import Phaser from 'phaser';
import type { AttackPhase, HitSpec } from '@/shared/types';
import { COLORS, DEPTH } from '@/shared/constants';
import { ENEMY_ATTACKS } from '@/game/config/attacks';
import { WARDEN, type EnemyDef } from '@/game/config/enemies';
import { Enemy } from './Enemy';
import type { HitResult } from '@/game/systems/combat/CombatSystem';
import type { Fighter } from '@/game/entities/Fighter';
import type { WorldContext } from '@/game/systems/world/context';
import { poseAttack, poseDead, poseFall, poseIdle, poseJump, poseLand, poseMove, poseStun } from '@/game/animations/clips';
import { audio } from '@/game/managers/AudioManager';
import { session } from '@/game/managers/session';
import { bus } from '@/game/events/bus';

const BOSS_DEF: EnemyDef = {
  kind: 'boss', name: WARDEN.name, maxHealth: WARDEN.maxHealth, attack: WARDEN.attack, defense: WARDEN.defense,
  width: WARDEN.width, height: WARDEN.height, patrolSpeed: 0, chaseSpeed: WARDEN.walkSpeed, detectRange: 4000,
  detectHeight: 900, loseRange: 9000, attackRange: 160, attackCooldown: 0, recoverTime: 0, attacks: [],
  knockbackResist: 1, stunScale: 0, xp: WARDEN.xp, gold: WARDEN.gold,
  style: { color: COLORS.boss, lineWidth: 11, scale: 1.85, accessory: 'warden', accent: 0xffd24a, headRadius: 10 },
};

type Mode =
  | 'dormant' | 'intro' | 'choose' | 'walk' | 'combo' | 'slam' | 'charge_tel' | 'charge_run'
  | 'leap_tel' | 'leap_air' | 'pause' | 'exhausted' | 'roar' | 'dead';
type Pattern = 'combo' | 'slam' | 'charge' | 'leap';

interface Wave { x: number; dir: -1 | 1; life: number; hits: Set<number> }

const waveRect = new Phaser.Geom.Rectangle();

/**
 * Iron Warden Kaizo. Three phases, telegraphed patterns, exhaustion windows (vulnerable) after the big attacks.
 *  - Slam:   overhead smash + ground shockwave(s) you can jump.
 *  - Charge: long lane telegraph, then a wall-to-wall rush you must dodge or dash through.
 *  - Combo:  fast 3-hit chain at close range (block or back off).
 *  - Leap:   (phase 2+) lands on your marked position with an area shockwave.
 *  - Phase 3: enraged, summons minions, faster tempo.
 */
export class Boss extends Enemy {
  phase = 1;
  private mode: Mode = 'dormant';
  private mt = 0;
  private last: Pattern | null = null;
  private pattern: Pattern = 'combo';
  private walkTimeout = 0;
  private chargeDir: -1 | 1 = 1;
  private leapTargetX = 0;
  private leapAir = 0;
  private summoned = false;
  private readonly waves: Wave[] = [];
  private readonly waveG: Phaser.GameObjects.Graphics;
  private lastEmit = 0;
  private lastPhaseNote = 0;
  onDefeated?: () => void;

  constructor(ctx: WorldContext, x: number, feetY: number) {
    super(ctx, BOSS_DEF, x, feetY, 0);
    this.waveG = ctx.scene.add.graphics().setDepth(DEPTH.fx - 1);
    this.facing = -1;
    // Boss attacks use the shared Attack/Recover states; the machine must not rest in Idle (Idle -> Attack is invalid).
    this.sm.transition('Chase');
  }

  /** Starts the encounter. */
  engage(): void {
    if (this.mode !== 'dormant') return;
    this.setMode('intro');
    audio.play('roar');
    this.ctx.fx.shake(0.01, 600);
    bus.emit('banner', { title: WARDEN.name, subtitle: 'Guardian of the City Gate' });
    this.ctx.scene.time.delayedCall(2600, () => bus.emit('banner', null));
  }

  get engaged(): boolean { return this.mode !== 'dormant'; }
  private get invulnerable(): boolean { return this.mode === 'dormant' || this.mode === 'roar' || this.mode === 'intro'; }
  private get tempo(): number { return this.phase === 1 ? 1 : this.phase === 2 ? 0.8 : 0.62; }

  private setMode(m: Mode): void {
    this.mode = m;
    this.mt = 0;
    this.vulnerable = m === 'exhausted';
  }

  protected override aiInterval(): number { return 1; }

  /* ------------------------------------------------------------------ AI */

  protected override think(dt: number): void {
    this.mt += dt;
    this.updateWaves(dt);
    const p = this.ctx.getPlayer();
    const a = this.arcade;
    const dx = p.cx - this.cx, adx = Math.abs(dx);
    const speed = WARDEN.walkSpeed * (this.phase === 1 ? 1 : this.phase === 2 ? 1.15 : 1.35);

    switch (this.mode) {
      case 'dormant':
        a.setVelocityX(0);
        break;
      case 'intro':
        a.setVelocityX(0);
        this.faceToward(p.cx);
        if (this.mt > 1600) this.setMode('choose');
        break;
      case 'roar':
        a.setVelocityX(0);
        if (this.mt > 1400) {
          if (this.phase === 3 && !this.summoned) this.summon();
          this.setMode('pause');
        }
        break;
      case 'pause':
        a.setVelocityX(this.approachVx(0, 3000, dt));
        this.faceToward(p.cx);
        if (this.mt > 650 * this.tempo) this.setMode('choose');
        break;
      case 'exhausted': {
        a.setVelocityX(this.approachVx(0, 3000, dt));
        const dur = this.pattern === 'charge' ? 1700 : 1100;
        if (this.mt > dur) { this.setMode('pause'); }
        break;
      }
      case 'choose':
        this.choose(adx);
        break;
      case 'walk': {
        this.faceToward(p.cx);
        const want = this.pattern === 'combo' ? 150 : 230;
        if (adx > want && this.mt < 2800) a.setVelocityX(this.approachVx(Math.sign(dx) * speed, 2400, dt));
        else { a.setVelocityX(0); this.startPattern(this.pattern); }
        break;
      }
      case 'combo':
      case 'slam':
        // runner-driven; movement damped by Enemy.perFrame
        if (!this.runner.running && this.mt > 80) this.setMode('pause');
        break;
      case 'charge_tel':
        a.setVelocityX(this.approachVx(0, 3000, dt));
        if (this.mt > 900) this.startCharge();
        break;
      case 'charge_run': {
        a.setVelocityX(this.chargeDir * 900);
        const hitWall = (this.chargeDir > 0 && a.blocked.right) || (this.chargeDir < 0 && a.blocked.left);
        if (hitWall || this.mt > 1300 || !this.runner.running) {
          this.runner.cancel();
          if (hitWall) {
            this.ctx.fx.shake(0.016, 350);
            this.ctx.fx.debrisBurst(this.cx + this.chargeDir * 40, this.cy, 24);
            audio.play('slam');
          }
          a.setVelocityX(0);
          this.sm.transition('Recover');
          this.setMode('exhausted');
          this.ctx.fx.text(this.cx, this.cy - 130, 'EXHAUSTED!', '#ffd24a', 24, 1200);
        }
        break;
      }
      case 'leap_tel':
        a.setVelocityX(this.approachVx(0, 3000, dt));
        if (this.mt > 650) this.startLeap();
        break;
      case 'leap_air':
        this.leapAir += dt;
        if (this.grounded && this.leapAir > 120) this.landLeap();
        break;
      default: break;
    }

    // HUD
    if (this.ctx.clock.now - this.lastEmit > 80) {
      this.lastEmit = this.ctx.clock.now;
      if (this.mode !== 'dormant') bus.emit('boss:update', { name: WARDEN.name, health: this.health, maxHealth: this.maxHealth, phase: this.phase });
    }
  }

  private choose(adx: number): void {
    const opts: [Pattern, number][] = [
      ['combo', adx < 220 ? 5 : 1],
      ['slam', adx < 380 ? 4 : 1.2],
      ['charge', adx > 320 ? 4 : 1.5],
    ];
    if (this.phase >= 2) opts.push(['leap', adx > 340 ? 4 : 1.2]);
    const pool = opts.filter(([id]) => id !== this.last);
    const total = pool.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * total;
    let pick = pool[0][0];
    for (const [id, w] of pool) { roll -= w; if (roll <= 0) { pick = id; break; } }
    this.pattern = pick;
    this.last = pick;
    if (pick === 'combo' || pick === 'slam') this.setMode('walk');
    else this.startPattern(pick);
  }

  private startPattern(p: Pattern): void {
    const player = this.ctx.getPlayer();
    this.faceToward(player.cx);
    switch (p) {
      case 'combo':
        this.setMode('combo');
        this.launchAttack('boss_swing1');
        break;
      case 'slam': {
        this.setMode('slam');
        this.launchAttack('boss_slam');
        const d = ENEMY_ATTACKS.boss_slam;
        const x = this.facing > 0 ? this.cx : this.cx - 270;
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(x, this.feetY - d.hitbox.h, 270, d.hitbox.h), d.startup);
        break;
      }
      case 'charge': {
        this.setMode('charge_tel');
        this.chargeDir = this.facing;
        audio.play('telegraph');
        const reach = this.chargeDir > 0 ? this.ctx.region.width - this.cx : this.cx;
        const x = this.chargeDir > 0 ? this.cx : this.cx - reach;
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(x, this.feetY - 130, reach, 130), 900);
        this.ctx.fx.text(this.cx, this.cy - 140, '!!', '#ff3030', 40, 900);
        break;
      }
      case 'leap': {
        this.setMode('leap_tel');
        this.leapTargetX = Phaser.Math.Clamp(player.cx, 300, this.ctx.region.width - 300);
        audio.play('telegraph');
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(this.leapTargetX - 150, this.feetY - 70, 300, 70), 650);
        break;
      }
    }
  }

  private startCharge(): void {
    this.setMode('charge_run');
    const def = ENEMY_ATTACKS.boss_charge;
    this.sm.transition('Attack');
    this.runner.start(def, { def, damageMult: 1, element: 'physical', comboScale: 1 });
    audio.play('roar');
  }

  private startLeap(): void {
    this.setMode('leap_air');
    this.leapAir = 0;
    const vy = -1150;
    const flight = (2 * -vy) / 1900;
    this.arcade.setVelocity(Phaser.Math.Clamp((this.leapTargetX - this.cx) / flight, -800, 800), vy);
    audio.play('whoosh');
  }

  private landLeap(): void {
    this.arcade.setVelocityX(0);
    const def = ENEMY_ATTACKS.boss_leap;
    const spec: HitSpec = { def, damageMult: 1, element: 'physical', comboScale: 1 };
    const rect = new Phaser.Geom.Rectangle(this.cx - 150, this.feetY - 100, 300, 110);
    this.ctx.combat.hitRect(this, rect, spec, new Set(), this.cx);
    this.slamEffects(true);
    this.spawnWave(this.cx, -1);
    this.spawnWave(this.cx, 1);
    this.setMode('exhausted');
    this.ctx.fx.text(this.cx, this.cy - 130, 'EXHAUSTED!', '#ffd24a', 24, 1200);
  }

  private slamEffects(big: boolean): void {
    const fx = this.ctx.fx;
    fx.shake(big ? 0.018 : 0.012, 350);
    fx.debrisBurst(this.cx + this.facing * 90, this.feetY - 8, big ? 26 : 16);
    fx.dustPuff(this.cx + this.facing * 90, this.feetY, 10);
    fx.ring(this.cx + this.facing * 90, this.feetY - 6, 0xffd9a0, 10, big ? 200 : 140, 400, 6);
    audio.play('slam');
  }

  private summon(): void {
    this.summoned = true;
    const left = this.cx > 900 ? 300 : this.cx + 500;
    const right = this.ctx.region.width - 300;
    this.ctx.spawnEnemy('basic', left, this.feetY, 120);
    this.ctx.spawnEnemy('basic', right, this.feetY, 120);
    this.ctx.fx.text(this.cx, this.cy - 150, 'REINFORCEMENTS!', '#ff7a5c', 24, 1400);
  }

  /* ------------------------------------------------------------------ attack hooks */

  protected override onAttackPhase(phase: AttackPhase): void {
    const def = this.runner.def;
    if (!def) return;
    if (phase === 'active') {
      if (def.id === 'boss_slam') {
        this.slamEffects(false);
        this.spawnWave(this.cx + this.facing * 150, this.facing);
        if (this.phase >= 2) this.spawnWave(this.cx - this.facing * 150, (-this.facing) as -1 | 1);
        if (this.phase >= 3) this.ctx.scene.time.delayedCall(550, () => { if (this.alive) this.spawnWave(this.cx + this.facing * 150, this.facing); });
      } else if (def.id.startsWith('boss_swing')) {
        this.arcade.setVelocityX(this.facing * 160);
        audio.play('heavy');
      }
    } else if (phase === 'startup' && def.id.startsWith('boss_swing') && def.id !== 'boss_swing1') {
      this.faceToward(this.ctx.getPlayer().cx);
    } else if (phase === 'idle' && this.mode !== 'charge_run') {
      if (def.chain && this.mode === 'combo') { this.launchAttack(def.chain); return; }
      if (def.id === 'boss_slam') {
        this.sm.transition('Recover');
        this.setMode('exhausted');
        this.ctx.fx.text(this.cx, this.cy - 130, 'EXHAUSTED!', '#ffd24a', 24, 1200);
      } else {
        this.sm.transition('Recover');
        this.setMode('pause');
      }
    }
  }

  /* ------------------------------------------------------------------ shockwaves */

  private spawnWave(x: number, dir: -1 | 1): void {
    this.waves.push({ x, dir, life: 1500, hits: new Set() });
  }

  private updateWaves(dt: number): void {
    const g = this.waveG;
    g.clear();
    const def = ENEMY_ATTACKS.boss_wave;
    const spec: HitSpec = { def, damageMult: 1, element: 'physical', comboScale: 1 };
    const floor = this.feetY;
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life -= dt;
      w.x += w.dir * 430 * (dt / 1000);
      if (w.life <= 0 || w.x < 20 || w.x > this.ctx.region.width - 20) { this.waves.splice(i, 1); continue; }
      waveRect.setTo(w.x - 30, floor - 48, 60, 48);
      this.ctx.combat.hitRect(this, waveRect, spec, w.hits, w.x - w.dir * 40);
      const k = Math.min(1, w.life / 300);
      g.fillStyle(0xffd9a0, 0.85 * k);
      g.fillTriangle(w.x - 30, floor, w.x + 30, floor, w.x + w.dir * 14, floor - 52);
      g.fillStyle(0xff8a3a, 0.7 * k);
      g.fillTriangle(w.x - 18, floor, w.x + 18, floor, w.x + w.dir * 8, floor - 30);
      if (Math.random() < 0.5) this.ctx.fx.dustPuff(w.x, floor - 4, 1);
    }
  }

  /* ------------------------------------------------------------------ damage */

  override receiveHit(spec: HitSpec, attacker: Fighter, fromX: number): HitResult {
    if (this.invulnerable) return { outcome: 'ignored', damage: 0, dir: 1 };
    return super.receiveHit(spec, attacker, fromX);
  }

  protected override onDamaged(): void {
    const ratio = this.health / this.maxHealth;
    const [t1, t2] = WARDEN.phaseThresholds;
    const next = this.phase === 1 && ratio <= t1 ? 2 : this.phase === 2 && ratio <= t2 ? 3 : 0;
    if (next) {
      this.phase = next;
      this.runner.cancel();
      this.sm.transition('Recover');
      this.setMode('roar');
      this.arcade.setVelocityX(0);
      audio.play('roar');
      this.ctx.fx.shake(0.014, 700);
      this.ctx.fx.ring(this.cx, this.cy, 0xff3b3b, 20, 360, 700, 8);
      this.ctx.fx.text(this.cx, this.cy - 150, next === 2 ? 'ENRAGED!' : 'FURY!', '#ff4040', 30, 1400);
      this.lastPhaseNote = this.ctx.clock.now;
    }
  }

  protected override die(): void {
    super.die();
    this.mode = 'dead';
    this.waves.length = 0;
    this.waveG.clear();
    this.ctx.clock.slowmo(0.25, 1800);
    this.ctx.fx.shake(0.02, 900);
    this.ctx.fx.ring(this.cx, this.cy, 0xffd24a, 20, 500, 900, 10);
    bus.emit('boss:update', null);
    bus.emit('banner', { title: 'VICTORY', subtitle: `${WARDEN.name} defeated` });
    this.ctx.scene.time.delayedCall(3200, () => bus.emit('banner', null));
    this.onDefeated?.();
  }

  protected override rewards(): void {
    session.gainXp(WARDEN.xp, WARDEN.name);
    session.profile.inventory.gold += WARDEN.gold;
    session.toast(`+${WARDEN.gold} gold`, 'good');
    session.giveItem('warden_core');
    session.profile.stats.kills += 1;
    if (!session.profile.defeatedBosses.includes(WARDEN.id)) session.profile.defeatedBosses.push(WARDEN.id);
    session.questEvent({ type: 'boss', target: WARDEN.id });
    session.profile.flags.warden_defeated = true;
    void session.autoSave(true);
  }

  override update(dt: number): void {
    super.update(dt);
    if (!this.alive) this.removed = false; // the corpse stays for the arena; the scene cleans it on exit
  }

  /* ------------------------------------------------------------------ visuals */

  protected override draw(dt: number): void {
    if (this.mode === 'combo' || this.mode === 'slam') { super.draw(dt); return; }
    const P = this.pose, a = this.arcade;
    let rate = 18;
    this.rig.velX = a.velocity.x;
    this.rig.glow = null;
    this.rig.setTint(this.vulnerable ? 0xffe08a : null);
    switch (this.mode) {
      case 'walk': {
        const speed = Math.abs(a.velocity.x);
        this.moveT += speed * (dt / 1000) * 0.03;
        if (speed < 10) poseIdle(P, this.moveT); else poseMove(P, this.moveT, 0.55, 0.15);
        break;
      }
      case 'charge_tel': {
        poseAttack(P, 'boss_charge', 'startup', Math.min(1, this.mt / 500));
        this.rig.glow = { color: 0xff3030, amount: Math.min(1, this.mt / 900) };
        this.rig.setTint(Math.floor(this.mt / 100) % 2 ? 0xff8a7a : null);
        break;
      }
      case 'charge_run': poseAttack(P, 'boss_charge', 'active', 1); rate = 40; break;
      case 'leap_tel': poseLand(P, 0.5); P.fU = 1.3; P.gU = -1.0; this.rig.glow = { color: 0xff3030, amount: this.mt / 650 }; rate = 30; break;
      case 'leap_air': if (a.velocity.y < 0) poseJump(P, a.velocity.y); else poseFall(P, a.velocity.y); break;
      case 'exhausted': poseStun(P, this.mt / 1000 * 2); P.lean = 0.35; P.drop = 6; break;
      case 'roar':
      case 'intro': {
        poseAttack(P, 'slam', 'startup', 1);
        P.lean = -0.3 + Math.sin(this.mt / 60) * 0.03;
        this.rig.glow = { color: 0xff3030, amount: 0.8 };
        rate = 25;
        break;
      }
      case 'dead': poseDead(P, Math.min(1, this.deadT2() / 900)); rate = 30; break;
      default: poseIdle(P, this.mt / 1000);
    }
    this.rig.draw(this.cx, this.feetY, this.facing, P, rate, dt);
  }

  private deadT2(): number { return this.sm.elapsed; }

  protected override drawBar(): void { /* boss uses the HUD bar */ }

  override destroy(): void {
    this.waveG.destroy();
    super.destroy();
  }
}
