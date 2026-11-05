import Phaser from 'phaser';
import type { AttackDef, AttackPhase, HitSpec } from '@/shared/types';
import { DEPTH } from '@/shared/constants';
import { ENEMY_ATTACKS } from '@/game/config/attacks';
import type { EnemyDef } from '@/game/config/enemies';
import { Fighter } from '@/game/entities/Fighter';
import { StateMachine } from '@/game/systems/StateMachine';
import { ENEMY_TRANSITIONS, type EnemyState } from './transitions';
import { computeDamage } from '@/game/systems/combat/damage';
import type { HitResult } from '@/game/systems/combat/CombatSystem';
import type { WorldContext } from '@/game/systems/world/context';
import { makePose, type Pose } from '@/game/animations/pose';
import { poseAttack, poseDead, poseDodge, poseHurt, poseIdle, poseMove, posePointing, poseStun } from '@/game/animations/clips';
import { audio } from '@/game/managers/AudioManager';
import { session } from '@/game/managers/session';
import { devFlags } from '@/devtools/flags';
import { rollCoinDrop } from '@/game/economy/loot';
import { t } from '@/i18n';

export type { EnemyState };
export { ENEMY_TRANSITIONS };

export interface ProjectileOpts {
  x: number; y: number; vx: number; vy?: number; ay?: number; life?: number; w?: number; h?: number; color: number;
  def: AttackDef; burn?: HitSpec['burn'];
}
interface Projectile extends Required<Omit<ProjectileOpts, 'burn' | 'def'>> { spec: HitSpec; hits: Set<number> }

const projRect = new Phaser.Geom.Rectangle();
const IGNORED: HitResult = { outcome: 'ignored', damage: 0, dir: 1 };

export class Enemy extends Fighter {
  readonly team = 'enemy' as const;
  readonly sm: StateMachine<EnemyState>;
  /** Set when the corpse has fully faded and can be cleaned up. */
  removed = false;
  onKilled?: (e: Enemy) => void;
  /** 0 for enemies summoned by a boss: they give no coins, so a boss fight cannot be farmed by restarting it. */
  lootScale = 1;

  protected readonly spawnX: number;
  protected patrolMin: number;
  protected patrolMax: number;
  protected patrolDir: -1 | 1 = 1;
  protected attackCd = 600;
  protected dodgeCd = 0;
  protected dashCd = 0;
  protected jumpCd = 0;
  protected lostT = 0;
  protected idleFor = 800;
  protected burstT = 0;
  protected dodgeDir: -1 | 1 = 1;
  protected stunMs = 0;
  protected hurtDur = 0;
  protected deadT = 0;
  protected vulnerable = false;
  private prevPlayerAttacking = false;
  private frame = 0;
  private aiAccum = 0;
  protected readonly pose: Pose = makePose();
  protected moveT = 0;
  private readonly bar: Phaser.GameObjects.Graphics;
  private barVisible = false;
  private t = Math.random() * 10;
  protected readonly pt = { x: 0, y: 0 };
  protected readonly projectiles: Projectile[] = [];
  private projG: Phaser.GameObjects.Graphics | null = null;

  constructor(ctx: WorldContext, readonly def: EnemyDef, x: number, feetY: number, patrolRange = 160) {
    super(ctx, x, feetY, def.width, def.height, def.style, def.kind === 'boss' ? DEPTH.boss : DEPTH.enemies);
    this.spawnX = x;
    this.patrolMin = x - patrolRange;
    this.patrolMax = x + patrolRange;
    this.maxHealth = def.maxHealth;
    this.health = def.maxHealth;
    this.attackStat = def.attack;
    this.defenseStat = def.defense;
    this.sm = new StateMachine<EnemyState>('Idle', ENEMY_TRANSITIONS);
    this.bar = ctx.scene.add.graphics().setDepth(DEPTH.enemies + 5);
    this.facing = Math.random() < 0.5 ? 1 : -1;
    this.runner.onPhase = (phase, prev) => this.onAttackPhase(phase, prev);
  }

  get state(): EnemyState { return this.sm.state; }

  /* -------------------------------------------------------------- update loop */

  update(dt: number): void {
    this.t += dt / 1000;
    this.updateProjectiles(dt);
    if (!this.alive) { this.updateDead(dt); return; }
    this.sm.tick(dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.jumpCd = Math.max(0, this.jumpCd - dt);
    this.runner.update(dt);
    if (this.tickBurn(dt) > 0 && this.health <= 0) { this.die(); return; }

    if (this.runner.active) this.ctx.combat.processAttack(this, this.runner);
    this.perFrame(dt);

    // AI level-of-detail: distant enemies think less often.
    const p = this.ctx.getPlayer();
    const dist = Math.abs(p.cx - this.cx);
    const interval = this.aiInterval(dist);
    this.aiAccum += dt;
    if (++this.frame % interval === 0) {
      this.think(this.aiAccum);
      this.aiAccum = 0;
    }
    this.draw(dt);
  }

  protected aiInterval(dist: number): number {
    return dist < 700 ? 1 : dist < 1400 ? 3 : 8;
  }

  /** Cheap work every frame (velocity decay, bursts). */
  protected perFrame(dt: number): void {
    const a = this.arcade;
    switch (this.sm.state) {
      case 'Hit':
        a.setVelocityX(a.velocity.x * Math.pow(0.03, dt / 1000));
        break;
      case 'Dodge':
        a.setVelocityX(this.dodgeDir * 520 * Math.max(0.2, 1 - this.sm.elapsed / 260));
        break;
      case 'Chase':
        if (this.burstT > 0) {
          this.burstT -= dt;
          a.setVelocityX(this.facing * 640);
        }
        break;
      case 'Attack':
        if (this.runner.phase !== 'active' || !this.runner.def?.lunge) a.setVelocityX(a.velocity.x * Math.pow(0.0005, dt / 1000));
        break;
      default: break;
    }
  }

  /* -------------------------------------------------------------- AI */

  protected think(dt: number): void {
    const p = this.ctx.getPlayer();
    const d = this.def;
    const dx = p.cx - this.cx;
    const adx = Math.abs(dx);
    const dy = p.cy - this.cy;
    const a = this.arcade;
    const seen = p.alive && adx <= d.detectRange && Math.abs(dy) <= d.detectHeight;
    const playerAttacking = p.isAttacking;
    const attackStarted = playerAttacking && !this.prevPlayerAttacking;
    this.prevPlayerAttacking = playerAttacking;

    switch (this.sm.state) {
      case 'Idle':
        if (seen) { this.beginDetect(); break; }
        a.setVelocityX(this.approachVx(0, 1200, dt));
        if (this.sm.elapsed > this.idleFor) { this.patrolDir = Math.random() < 0.5 ? -1 : 1; this.sm.transition('Patrol'); }
        break;

      case 'Patrol': {
        if (seen) { this.beginDetect(); break; }
        if (this.cx <= this.patrolMin) this.patrolDir = 1;
        else if (this.cx >= this.patrolMax) this.patrolDir = -1;
        if ((a.blocked.left && this.patrolDir < 0) || (a.blocked.right && this.patrolDir > 0)) this.patrolDir = (-this.patrolDir) as -1 | 1;
        this.facing = this.patrolDir;
        a.setVelocityX(this.approachVx(this.patrolDir * d.patrolSpeed, 900, dt));
        if (this.sm.elapsed > 2500 + Math.random() * 2500) { this.idleFor = 700 + Math.random() * 1200; this.sm.transition('Idle'); }
        break;
      }

      case 'Detect':
        this.faceToward(p.cx);
        a.setVelocityX(this.approachVx(0, 2000, dt));
        if (this.sm.elapsed > (d.kind === 'fast' ? 220 : 380)) this.sm.transition('Chase');
        break;

      case 'Chase':
      case 'Recover': {
        if (!p.alive || adx > d.loseRange || Math.abs(dy) > 420) {
          this.lostT += dt;
          if (this.lostT > 1800 || !p.alive) { this.lostT = 0; this.sm.transition('Patrol'); break; }
        } else this.lostT = 0;

        if (this.sm.is('Recover')) {
          a.setVelocityX(this.approachVx(0, 1600, dt));
          this.faceToward(p.cx);
          if (this.sm.elapsed >= d.recoverTime) this.sm.transition('Chase');
          break;
        }

        // dodge-roll reaction (fast fighters)
        if (d.dodgeChance && this.dodgeCd <= 0 && attackStarted && adx < 190 && Math.random() < d.dodgeChance) {
          this.dodgeDir = (dx > 0 ? -1 : 1);
          this.dodgeCd = 1800;
          this.sm.transition('Dodge');
          audio.play('dodge');
          this.ctx.fx.dustPuff(this.cx, this.feetY, 4);
          break;
        }

        this.faceToward(p.cx);
        if (d.ranged) { this.rangedThink(dx, adx, dy, dt); break; }
        const want = d.attackRange * 0.85;
        if (this.burstT > 0) break;
        if (d.dashApproach && adx > 300 && this.dashCd <= 0 && this.grounded) {
          this.burstT = 260;
          this.dashCd = 2600;
          this.ctx.fx.dustPuff(this.cx, this.feetY, 5);
          audio.play('dash');
          break;
        }
        if (adx > want) {
          a.setVelocityX(this.approachVx(Math.sign(dx) * d.chaseSpeed * this.separationFactor(Math.sign(dx)), 2600, dt));
        } else {
          a.setVelocityX(this.approachVx(0, 2600, dt));
          if (this.attackCd <= 0 && Math.abs(dy) < 100 && p.alive) this.beginAttack(adx);
        }
        // obstacle / ledge hopping
        const blocked = (dx > 0 && a.blocked.right) || (dx < 0 && a.blocked.left);
        if (this.grounded && this.jumpCd <= 0 && (blocked || (dy < -110 && adx < 220))) {
          a.setVelocityY(-760);
          this.jumpCd = 900;
        }
        break;
      }

      case 'Attack':
        a.setVelocityX(a.velocity.x);
        break;

      case 'Dodge':
        if (this.sm.elapsed > 280) { this.sm.transition('Chase'); this.attackCd = Math.min(this.attackCd, 150); }
        break;

      case 'Hit':
        if (this.sm.elapsed >= this.hurtDur) { this.lostT = 0; this.sm.transition('Chase'); }
        break;

      case 'Stunned':
        a.setVelocityX(this.approachVx(0, 2000, dt));
        this.vulnerable = true;
        if (this.sm.elapsed >= this.stunMs) { this.vulnerable = false; this.sm.transition('Recover'); }
        break;

      default: break;
    }
  }

  /** Archers hold their range, back away when pressed and shoot on cooldown. */
  private rangedThink(dx: number, adx: number, dy: number, dt: number): void {
    const r = this.def.ranged!, a = this.arcade;
    const away = dx > 0 ? -1 : 1;
    const cornered = (away < 0 && a.blocked.left) || (away > 0 && a.blocked.right);
    if (adx < r.keepAway && !cornered) a.setVelocityX(this.approachVx(away * this.def.chaseSpeed * 1.1, 2600, dt));
    else if (adx > r.range) a.setVelocityX(this.approachVx(Math.sign(dx) * this.def.chaseSpeed, 2600, dt));
    else a.setVelocityX(this.approachVx(0, 2600, dt));
    if (this.attackCd <= 0 && adx <= r.range + 80 && Math.abs(dy) < 170 && this.ctx.getPlayer().alive) this.launchAttack(r.attackId);
  }

  protected approachVx(target: number, rate: number, dt: number): number {
    const vx = this.arcade.velocity.x;
    const step = (rate * dt) / 1000;
    return Math.abs(target - vx) <= step ? target : vx + Math.sign(target - vx) * step;
  }

  /** Slows down when another enemy is directly ahead so groups spread out instead of stacking. */
  protected separationFactor(dir: number): number {
    for (const f of this.ctx.combat.fighters) {
      if (f === this || f.team !== 'enemy' || !f.alive) continue;
      const ox = f.cx - this.cx;
      if (Math.sign(ox) === dir && Math.abs(ox) < 46 && Math.abs(f.cy - this.cy) < 60) return 0.15;
    }
    return 1;
  }

  protected beginDetect(): void {
    this.faceToward(this.ctx.getPlayer().cx);
    this.sm.transition('Detect');
    this.ctx.fx.text(this.cx, this.cy - this.h * 0.75, '!', '#ff5050', 30, 600);
  }

  protected beginAttack(distance: number): void {
    const options = this.def.attacks.filter((o) => !o.minRange || distance >= o.minRange);
    const total = options.reduce((s, o) => s + o.weight, 0);
    let roll = Math.random() * total;
    let pick = options[0];
    for (const o of options) { roll -= o.weight; if (roll <= 0) { pick = o; break; } }
    this.launchAttack(pick.id);
  }

  protected launchAttack(id: string): boolean {
    const def = ENEMY_ATTACKS[id];
    if (!this.sm.is('Attack') && !this.sm.transition('Attack')) {
      console.warn(`[enemy] cannot attack from state ${this.sm.state}`);
      return false;
    }
    const spec: HitSpec = { def, damageMult: 1, element: 'physical', comboScale: 1 };
    this.runner.start(def, spec);
    if (def.telegraph && def.superArmor) audio.play('telegraph');
    return true;
  }

  protected onAttackPhase(phase: AttackPhase, _prev: AttackPhase): void {
    const def = this.runner.def;
    if (!def || !this.sm.is('Attack')) return;
    if (phase === 'active') {
      if (def.lunge) this.arcade.setVelocityX(this.facing * def.lunge);
      const rg = this.def.ranged;
      if (rg && def.id === rg.attackId) {
        this.fireProjectile({ x: this.cx + this.facing * 30, y: this.cy - 8, vx: this.facing * rg.speed, color: rg.color, def });
        audio.play('dash');
      } else audio.play('whoosh');
    } else if (phase === 'idle') {
      const p = this.ctx.getPlayer();
      if (def.chain && p.alive) {
        this.launchAttack(def.chain);
      } else {
        this.attackCd = this.def.attackCooldown * (0.85 + Math.random() * 0.3);
        this.sm.transition('Recover');
      }
    }
  }

  /* -------------------------------------------------------------- damage */

  receiveHit(spec: HitSpec, attacker: Fighter, fromX: number): HitResult {
    if (!this.alive) return IGNORED;
    if (this.sm.is('Dodge') && this.sm.elapsed < 240) return IGNORED;
    const dir = this.cx >= fromX ? 1 : -1;
    // Raised shield: absorbs light frontal hits; heavy blows and abilities break the guard.
    const guardUp = !!this.def.guard && this.guardRaised(fromX);
    const breaks = guardUp && (spec.def.damage >= 18 || spec.def.armorBreak === true || spec.element !== 'physical');
    const absorbs = guardUp && !breaks;
    const dmg = computeDamage({
      baseDamage: spec.def.damage, attackerAttack: attacker.attackStat, targetDefense: this.defenseStat,
      comboScale: spec.comboScale, multiplier: spec.damageMult * (absorbs ? 1 - this.def.guard! : breaks ? 0.7 : 1), block: 'none', blockFactor: 1, vulnerable: this.vulnerable,
    });
    this.health = Math.max(0, this.health - dmg);
    if (__DEV_TOOLS__ && devFlags.god && attacker.team === 'player') { devFlags.sandbox = true; this.health = 0; } // Super Mode: any hit kills
    this.rig.flash(90);
    if (spec.burn) this.applyBurn(spec.burn.dps, spec.burn.duration);
    audio.play('enemyHit');
    if (this.health <= 0) { this.die(); this.arcade.setVelocity(dir * spec.def.knockback.x, spec.def.knockback.y); return { outcome: 'killed', damage: dmg, dir }; }

    if (absorbs) {
      this.ctx.fx.hitSparks(this.cx + this.facing * this.w * 0.5, this.cy - 6, dir, 5);
      this.ctx.fx.text(this.cx, this.cy - this.h * 0.75, t('GUARD'), '#8fd3ff', 16, 450);
      audio.play('block');
      return { outcome: 'hit', damage: dmg, dir };
    }
    if (breaks) {
      this.stun(1100);
      this.ctx.fx.text(this.cx, this.cy - this.h * 0.85, t('GUARD BROKEN'), '#ffd24a', 18, 800);
      return { outcome: 'hit', damage: dmg, dir };
    }
    this.onDamaged(spec, dir);
    return { outcome: 'hit', damage: dmg, dir };
  }

  override staggerImmune(): boolean {
    return this.def.kind === 'boss' || this.def.stunScale <= 0 || (this.runner.running && !!this.runner.def?.superArmor);
  }

  private guardRaised(fromX: number): boolean {
    if (this.sm.is('Attack') || this.sm.is('Hit') || this.sm.is('Stunned') || this.sm.is('Recover') || this.sm.is('Dodge')) return false;
    return (fromX >= this.cx ? 1 : -1) === this.facing;
  }

  /* -------------------------------------------------------------- projectiles */

  protected fireProjectile(o: ProjectileOpts): void {
    this.projectiles.push({
      x: o.x, y: o.y, vx: o.vx, vy: o.vy ?? 0, ay: o.ay ?? 0, life: o.life ?? 2400, w: o.w ?? 22, h: o.h ?? 12, color: o.color,
      spec: { def: o.def, damageMult: 1, element: 'physical', comboScale: 1, burn: o.burn }, hits: new Set(),
    });
  }

  protected updateProjectiles(dt: number): void {
    if (!this.projectiles.length) { this.projG?.clear(); return; }
    const g = (this.projG ??= this.ctx.scene.add.graphics().setDepth(DEPTH.fx - 1));
    g.clear();
    const s = dt / 1000;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.vy += pr.ay * s;
      pr.x += pr.vx * s;
      pr.y += pr.vy * s;
      let spent = pr.life <= 0 || pr.x < 0 || pr.x > this.ctx.region.width || pr.y > this.ctx.region.groundY + 20;
      if (!spent) {
        projRect.setTo(pr.x - pr.w / 2, pr.y - pr.h / 2, pr.w, pr.h);
        if (this.ctx.combat.hitRect(this, projRect, pr.spec, pr.hits, pr.x - Math.sign(pr.vx) * 30) > 0) spent = true;
      }
      if (spent) { this.projectiles.splice(i, 1); continue; }
      g.fillStyle(pr.color, 0.35).fillCircle(pr.x, pr.y, pr.h * 1.1);
      g.fillStyle(pr.color, 1).fillEllipse(pr.x, pr.y, pr.w, pr.h);
      g.fillStyle(0xffffff, 0.8).fillEllipse(pr.x + Math.sign(pr.vx) * 3, pr.y, pr.w * 0.4, pr.h * 0.4);
    }
  }

  /** Reaction to non-lethal damage; the boss overrides this. */
  protected onDamaged(spec: HitSpec, dir: number): void {
    const d = this.def;
    const armored = this.runner.running && this.runner.def?.superArmor;
    if (armored || d.stunScale <= 0) {
      this.arcade.setVelocityX(this.arcade.velocity.x + dir * spec.def.knockback.x * 0.1 * (1 - d.knockbackResist));
      return;
    }
    if (this.sm.state === 'Stunned') {
      this.arcade.setVelocityX(dir * spec.def.knockback.x * 0.25);
      return;
    }
    this.sm.transition('Hit');
    this.runner.cancel();
    this.hurtDur = spec.def.hitStun * d.stunScale;
    this.faceToward(this.cx - dir * 10);
    this.arcade.setVelocity(dir * spec.def.knockback.x * (1 - d.knockbackResist), spec.def.knockback.y * (1 - d.knockbackResist * 0.8));
    this.attackCd = Math.max(this.attackCd, 350);
  }

  override stun(ms: number): void {
    if (!this.alive) return;
    this.runner.cancel();
    this.sm.transition('Stunned');
    this.stunMs = ms;
    this.vulnerable = true;
    this.arcade.setVelocityX(0);
    this.ctx.fx.text(this.cx, this.cy - this.h * 0.75, t('STUNNED'), '#ffd24a', 16, 700);
  }

  protected die(): void {
    if (!this.alive) return;
    this.alive = false;
    this.runner.cancel();
    this.sm.transition('Dead');
    this.deadT = 0;
    this.arcade.setVelocityY(Math.min(this.arcade.velocity.y, -240));
    audio.play('enemyDie');
    this.ctx.fx.debrisBurst(this.cx, this.cy, 12);
    this.ctx.fx.hitSparks(this.cx, this.cy, 1, 12, true);
    this.rewards();
    this.onKilled?.(this);
  }

  protected rewards(): void {
    const d = this.def;
    session.gainXp(d.xp, d.name);
    session.registerKill(d.kind);
    // Coins are dropped as physical pickups; the purse only grows when the player collects them. This method runs once
    // per enemy (die() is guarded by `alive`), and the spawner remembers the kill, so it cannot be farmed.
    if (this.lootScale > 0) this.ctx.dropCoins(rollCoinDrop(d, Math.random), this.cx, this.feetY - 28);
    if (Math.random() < 0.12) this.ctx.dropItem(Math.random() < 0.6 ? 'health_tonic' : 'energy_cell', this.cx, this.feetY - 40);
  }

  private updateDead(dt: number): void {
    this.deadT += dt;
    this.arcade.setVelocityX(this.arcade.velocity.x * Math.pow(0.02, dt / 1000));
    this.bar.clear();
    poseDead(this.pose, Math.min(1, this.deadT / 600));
    this.rig.alpha = this.deadT > 1200 ? Math.max(0, 1 - (this.deadT - 1200) / 500) : 1;
    this.rig.draw(this.cx, this.feetY, this.facing, this.pose, 45, dt);
    if (this.deadT > 1700) this.removed = true;
  }

  /* -------------------------------------------------------------- visuals */

  protected draw(dt: number): void {
    const P = this.pose, a = this.arcade, r = this.runner;
    let rate = 16;
    this.rig.velX = a.velocity.x;
    this.rig.glow = null;
    this.rig.setTint(this.vulnerable ? 0xffe08a : null);
    switch (this.sm.state) {
      case 'Attack': {
        const def = r.def;
        if (def) {
          poseAttack(P, def.anim, r.phase === 'idle' ? 'recovery' : r.phase, r.phase === 'idle' ? 1 : r.progress);
          if (def.telegraph && r.phase === 'startup') this.rig.glow = { color: 0xff3030, amount: 0.35 + 0.65 * r.progress };
          if (def.superArmor && r.phase === 'startup') this.rig.setTint(Math.floor(r.t / 90) % 2 ? 0xff9a7a : null);
        }
        rate = 55;
        break;
      }
      case 'Hit': poseHurt(P, this.sm.elapsed / Math.max(1, this.hurtDur)); rate = 45; break;
      case 'Stunned': poseStun(P, this.t); rate = 20; break;
      case 'Dodge': poseDodge(P, this.sm.elapsed / 280, this.dodgeDir === this.facing ? 1 : -1); rate = 60; break;
      case 'Detect': posePointing(P, this.t); break;
      case 'Patrol':
      case 'Chase': {
        const speed = Math.abs(a.velocity.x);
        if (!this.grounded) { poseMove(P, 1, 0.4, 0.3); break; }
        const run = Math.min(1, speed / (this.def.chaseSpeed * 1.1));
        this.moveT += speed * (dt / 1000) * (this.def.style.scale > 1.2 ? 0.035 : 0.05);
        if (speed < 14) poseIdle(P, this.t);
        else poseMove(P, this.moveT, 0.45 + run * 0.5, this.sm.is('Chase') ? run : run * 0.3);
        rate = 22;
        break;
      }
      default: poseIdle(P, this.t);
    }
    this.rig.draw(this.cx, this.feetY, this.facing, P, rate, dt);
    this.drawBar();
  }

  protected drawBar(): void {
    const show = this.health < this.maxHealth && this.alive;
    if (!show) {
      if (this.barVisible) { this.bar.clear(); this.barVisible = false; }
      return;
    }
    this.barVisible = true;
    const w = 46 * Math.max(1, this.def.style.scale * 0.9);
    const x = this.cx - w / 2;
    const y = this.feetY - this.h * 1.12 - 8;
    this.bar.clear();
    this.bar.fillStyle(0x000000, 0.6).fillRect(x - 1, y - 1, w + 2, 7);
    this.bar.fillStyle(this.vulnerable ? 0xffd24a : 0xff4d5e, 1).fillRect(x, y, w * (this.health / this.maxHealth), 5);
  }

  override destroy(): void {
    this.projG?.destroy();
    this.bar.destroy();
    super.destroy();
  }
}
