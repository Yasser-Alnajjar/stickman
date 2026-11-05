import Phaser from 'phaser';
import type { AbilityId, AttackDef, AttackPhase, HitOutcome, HitSpec, PlayerStats } from '@/shared/types';
import type { SpecialDef } from '@/game/weapons/types';
import { COLORS, DEPTH } from '@/shared/constants';
import { PLAYER_CFG } from '@/game/config/player';
import { PLAYER_ATTACKS } from '@/game/config/attacks';
import { ABILITIES, FIRE_BURN } from '@/game/config/abilities';
import { Fighter } from '@/game/entities/Fighter';
import { PlayerInput, type Intent } from '@/game/input/PlayerInput';
import { StateMachine } from '@/game/systems/StateMachine';
import { PLAYER_TRANSITIONS, type PlayerState } from './transitions';
import { ComboController } from '@/game/systems/combat/ComboController';
import { computeDamage, type BlockResult } from '@/game/systems/combat/damage';
import type { HitResult } from '@/game/systems/combat/CombatSystem';
import { AbilityManager, type AbilityHost } from '@/game/systems/abilities/AbilityManager';
import { makePose, type Pose } from '@/game/animations/pose';
import {
  poseAttack, poseBlock, poseDash, poseDead, poseDodge, poseFall, poseHurt, poseIdle, poseJump, poseLand,
  poseLightning, poseMove, poseStun,
} from '@/game/animations/clips';
import type { Trail } from '@/game/managers/Fx';
import { session } from '@/game/managers/session';
import { audio } from '@/game/managers/AudioManager';
import { bus } from '@/game/events/bus';
import type { WorldContext } from '@/game/systems/world/context';
import { t } from '@/i18n';
import { devFlags } from '@/devtools/flags';
import { WeaponRuntime } from '@/game/weapons/runtime';
import { StaggerGate } from '@/game/weapons/hit-gate';
import { cycleTarget, equippedId, levelOf } from '@/game/weapons/ownership';
import { RARITY_COLOR } from '@/game/weapons/presentation';
import { PlayerProjectiles } from '@/game/systems/combat/PlayerProjectiles';
import { painterFor } from '@/game/animations/weapon-art';
import { REST_ANGLE, poseFlurry, weaponAngles } from '@/game/animations/weapon-clips';

export type { PlayerState };
export { PLAYER_TRANSITIONS };

const HERO_STYLE = { color: COLORS.player, lineWidth: 5, scale: 1, accessory: 'hero', accent: COLORS.playerAccent, headRadius: 10 };
const IGNORED: HitResult = { outcome: 'ignored', damage: 0, dir: 1 };

interface DashData {
  kind: 'dash' | 'lightning' | 'flurry';
  t: number;
  dur: number;
  dir: -1 | 1;
  speed: number;
  /** Maximum travel distance (px); the dash ends when reached regardless of frame timing. */
  dist: number;
  startX: number;
  startY: number;
  spec?: HitSpec;
  hits: Set<number>;
  /** flurry: ms until the next hit tick, and the finisher thrown at the end. */
  tick?: number;
  finisher?: { def: AttackDef; spec: Partial<HitSpec> };
}

export class Player extends Fighter implements AbilityHost {
  readonly team = 'player' as const;
  readonly sm: StateMachine<PlayerState>;
  readonly combo = new ComboController();
  readonly abilities: AbilityManager;
  readonly input: PlayerInput;
  /** The equipped weapon: concrete attacks, stats, special cooldowns. Re-synced from the profile every frame. */
  readonly weapon = new WeaponRuntime(() => session.profile);
  readonly projectiles: PlayerProjectiles;
  private readonly staggerGate = new StaggerGate();
  private activeSpecial: SpecialDef | null = null;
  private switchCd = 0;
  private weaponTrail: Trail;
  stats: PlayerStats;
  stamina: number;
  energy: number;
  locked = false;
  onDied?: () => void;
  /** Last frame the player stood on a one-way platform (set by the world's collider callback). */
  oneWayTouch = -1000;

  private staminaDelay = 0;
  private coyote = 0;
  private jumpBuf = 0;
  private dashCd = 0;
  private dodgeCd = 0;
  private iframes = 0;
  private blockTime = 0;
  private hurtDur = 0;
  private landT = 0;
  private wasGrounded = true;
  private lastVy = 0;
  private airDashUsed = false;
  private movePhase = 0;
  private stepAcc = 0;
  private idleT = 0;
  private dash: DashData | null = null;
  private dodgeDir: -1 | 1 = 1;
  private dodgeFwd = 1;
  private dodgeT = 0;
  private deadT = 0;
  private lastComboShown = 0;
  private readonly pose: Pose = makePose();
  private readonly pt = { x: 0, y: 0 };
  private readonly fistTrail: Trail;
  private readonly footTrail: Trail;
  private readonly dashTrail: Trail;
  private glowAmt = 0;

  constructor(ctx: WorldContext, x: number, feetY: number) {
    super(ctx, x, feetY, PLAYER_CFG.width, PLAYER_CFG.height, HERO_STYLE, DEPTH.player);
    this.stats = session.stats;
    this.applyStats(false);
    this.health = Math.min(this.stats.maxHealth, Math.max(1, session.profile.health || this.stats.maxHealth));
    this.stamina = this.stats.maxStamina;
    this.energy = this.stats.maxEnergy;
    this.sm = new StateMachine<PlayerState>('Idle', PLAYER_TRANSITIONS);
    this.abilities = new AbilityManager(this);
    this.input = new PlayerInput(ctx.scene);
    this.fistTrail = ctx.fx.createTrail(0xffffff, 9);
    this.footTrail = ctx.fx.createTrail(0xffffff, 9);
    this.dashTrail = ctx.fx.createTrail(COLORS.lightning, 22, 12);
    this.weaponTrail = ctx.fx.createTrail(0xffffff, 8, 10);
    this.projectiles = new PlayerProjectiles(ctx.scene, ctx.combat, ctx.fx, () => ({ width: ctx.region.width, groundY: ctx.region.groundY }));
    this.applyWeapon();
    this.runner.onPhase = (phase, prev) => this.onAttackPhase(phase, prev);
    this.arcade.setSize(PLAYER_CFG.width, PLAYER_CFG.height);
  }

  /* ------------------------------------------------------------------ stats */

  applyStats(fullHeal: boolean): void {
    this.stats = session.stats;
    this.maxHealth = this.stats.maxHealth;
    this.attackStat = this.stats.attack;
    this.defenseStat = this.stats.defense;
    if (fullHeal) {
      this.health = this.maxHealth;
      this.stamina = this.stats.maxStamina;
      this.energy = this.stats.maxEnergy;
    } else {
      this.health = Math.min(this.health, this.maxHealth);
    }
  }

  restoreHealth(n: number): void {
    this.health = Math.min(this.maxHealth, this.health + n);
    this.ctx.fx.text(this.cx, this.cy - 60, `+${Math.round(n)}`, '#7dffa0', 22);
  }
  restoreEnergy(n: number): void {
    this.energy = Math.min(this.stats.maxEnergy, this.energy + n);
    this.ctx.fx.text(this.cx, this.cy - 60, t('+{n} EN', { n: Math.round(n) }), '#6aa8ff', 20);
  }
  fullRestore(): void {
    this.health = this.maxHealth;
    this.stamina = this.stats.maxStamina;
    this.energy = this.stats.maxEnergy;
    this.abilities.resetCooldowns();
    this.weapon.resetCooldowns();
  }
  spendEnergy(n: number): void { this.energy = Math.max(0, this.energy - n); }
  flashText(text: string, color: string): void { this.ctx.fx.text(this.cx, this.cy - 70, text, color, 18, 700); }

  /* ------------------------------------------------------------------ state helpers */

  get state(): PlayerState { return this.sm.state; }
  get isAttacking(): boolean { return this.sm.is('Attacking') || (this.sm.is('Dashing') && (this.dash?.kind === 'lightning' || this.dash?.kind === 'flurry')); }

  private invulnerable(): boolean {
    if (this.iframes > 0) return true;
    if (this.sm.is('Dodging')) return this.dodgeT >= PLAYER_CFG.dodge.iframeStart && this.dodgeT <= PLAYER_CFG.dodge.iframeEnd;
    if (this.sm.is('Dashing') && this.dash) return this.dash.kind === 'lightning' || this.dash.kind === 'flurry' || this.dash.t < PLAYER_CFG.dash.iframes;
    return false;
  }

  canCast(): boolean {
    if (this.locked) return false;
    if (this.sm.is('Attacking')) return this.canCancelAttack();
    return this.sm.is('Idle', 'Moving', 'Jumping', 'Falling', 'Blocking');
  }

  private canCancelAttack(): boolean {
    const r = this.runner;
    if (!r.running) return true;
    return r.phase === 'recovery' && r.t >= (r.def?.recovery ?? 0) * 0.4;
  }

  /* ------------------------------------------------------------------ update */

  update(dt: number): void {
    const I = this.input.poll(this.locked || !this.alive);
    const a = this.arcade;
    this.sm.tick(dt);
    if (!this.alive) { this.updateDead(dt); return; }

    // timers
    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.iframes = Math.max(0, this.iframes - dt);
    this.landT = Math.max(0, this.landT - dt);
    this.staminaDelay = Math.max(0, this.staminaDelay - dt);
    this.combo.update(dt);
    this.abilities.update(dt);
    this.weapon.update(dt);
    this.switchCd = Math.max(0, this.switchCd - dt);
    this.syncWeapon();
    this.runner.update(dt);
    this.projectiles.update(dt);
    this.tickBurn(dt);

    // resources
    if (this.staminaDelay <= 0 && !this.sm.is('Blocking')) {
      this.stamina = Math.min(this.stats.maxStamina, this.stamina + (this.stats.staminaRegen * dt) / 1000);
    }
    this.energy = Math.min(this.stats.maxEnergy, this.energy + (this.stats.energyRegen * dt) / 1000);
    session.profile.health = this.health;

    // grounded bookkeeping
    const grounded = this.grounded;
    if (grounded) {
      this.coyote = PLAYER_CFG.coyoteMs;
      this.airDashUsed = false;
      if (!this.wasGrounded && this.lastVy > 380) this.onLand(this.lastVy);
    }
    this.wasGrounded = grounded;
    this.lastVy = a.velocity.y;

    if (I.jumpPressed) this.jumpBuf = PLAYER_CFG.jumpBufferMs;
    if (I.light) this.combo.push('light');
    else if (I.kick) this.combo.push('kick');
    else if (I.heavy) this.combo.push('heavy');
    if (I.weaponNext) this.quickSwitch(1);
    else if (I.weaponPrev) this.quickSwitch(-1);
    if (I.tonic) session.useItem('health_tonic');
    if (I.cell) session.useItem('energy_cell');

    // base gravity tuning (variable jump height & snappy fall)
    let extraG = 0;
    if (this.sm.is('Jumping', 'Falling', 'Attacking', 'Moving', 'Idle')) {
      if (a.velocity.y < 0 && !I.jumpHeld) extraG = PLAYER_CFG.lowJumpGravity;
      else if (a.velocity.y > 0) extraG = PLAYER_CFG.fallGravity;
    }
    a.setGravityY(extraG);
    if (a.velocity.y > PLAYER_CFG.maxFallSpeed) a.setVelocityY(PLAYER_CFG.maxFallSpeed);

    switch (this.sm.state) {
      case 'Idle': case 'Moving': case 'Jumping': case 'Falling': this.updateFree(dt, I); break;
      case 'Attacking': this.updateAttacking(dt, I); break;
      case 'Blocking': this.updateBlocking(dt, I); break;
      case 'Dodging': this.updateDodging(dt, I); break;
      case 'Dashing': this.updateDashing(dt, I); break;
      case 'TakingDamage': this.updateHurt(dt); break;
      default: break;
    }

    this.updateVisuals(dt);
    const hits = this.combo.hits;
    if (hits !== this.lastComboShown) { this.lastComboShown = hits; bus.emit('combo', hits); }
  }

  /* ------------------------------------------------------------------ free movement */

  private moveHorizontal(dt: number, mx: number, speedMul = 1): void {
    const a = this.arcade;
    const vx = a.velocity.x;
    const max = PLAYER_CFG.runSpeed * this.stats.moveSpeedMult * speedMul;
    const target = mx * max;
    const g = this.grounded;
    let rate: number;
    if (mx === 0) rate = g ? PLAYER_CFG.groundDecel : PLAYER_CFG.airDecel;
    else if (vx !== 0 && Math.sign(vx) !== mx) rate = g ? PLAYER_CFG.groundDecel : PLAYER_CFG.airAccel * 1.5;
    else rate = g ? PLAYER_CFG.groundAccel : PLAYER_CFG.airAccel;
    const step = (rate * dt) / 1000;
    const nv = Math.abs(target - vx) <= step ? target : vx + Math.sign(target - vx) * step;
    a.setVelocityX(nv);
  }

  private updateFree(dt: number, I: Intent): void {
    const a = this.arcade;
    if (I.moveX !== 0) this.facing = I.moveX;
    this.moveHorizontal(dt, I.moveX);

    // jump (buffered + coyote). Down + jump on a one-way platform drops through instead.
    if (this.jumpBuf > 0) {
      const onOneWay = this.ctx.clock.now - this.oneWayTouch < 120;
      if (I.downHeld && onOneWay && this.grounded) {
        this.arcade.gameObject.setData('dropUntil', this.ctx.clock.now + 260);
        this.jumpBuf = 0;
        this.coyote = 0;
      } else if (this.grounded || this.coyote > 0) {
        a.setVelocityY(-PLAYER_CFG.jumpVelocity);
        this.jumpBuf = 0;
        this.coyote = 0;
        this.sm.transition('Jumping');
        this.ctx.fx.dustPuff(this.cx, this.feetY, 5);
        audio.play('jump');
      }
    }

    // actions
    if (this.tryActions(I)) return;

    const g = this.grounded;
    const next: PlayerState = g ? (Math.abs(a.velocity.x) > 25 || I.moveX !== 0 ? 'Moving' : 'Idle') : a.velocity.y < 0 ? 'Jumping' : 'Falling';
    this.sm.transition(next);
  }

  /** Dash / dodge / block / abilities / attacks. Returns true when a transition happened. */
  private tryActions(I: Intent): boolean {
    if (I.dodgePressed && this.startDodge(I)) return true;
    if (I.dashPressed && this.startDash(I)) return true;
    if (I.ability1 && this.abilities.tryActivate(0)) return true;
    if (I.ability2 && this.abilities.tryActivate(1)) return true;
    if (I.special && this.trySpecial()) return true;
    const b = this.combo.buffered;
    if (b && !this.sm.is('Blocking')) {
      const id = this.combo.resolve(b.input, this.runner.running);
      if (this.startWeaponAttack(id)) return true;
      this.combo.buffered = null;
    }
    if (I.blockHeld && this.grounded && !this.sm.is('Blocking') && this.sm.can('Blocking')) {
      this.sm.transition('Blocking');
      this.blockTime = 0;
      this.arcade.setVelocityX(this.arcade.velocity.x * 0.4);
      return true;
    }
    return false;
  }

  private onLand(vy: number): void {
    this.landT = 150;
    this.ctx.fx.dustPuff(this.cx, this.feetY, vy > 700 ? 9 : 4);
    audio.play('land');
    if (vy > 850) this.ctx.fx.shake(0.002, 80);
  }

  /* ------------------------------------------------------------------ attacks */

  startAttack(def: AttackDef, overrides?: Partial<HitSpec>): boolean {
    if (this.locked || !this.alive) return false;
    const cost = def.staminaCost ?? 0;
    if (this.sm.is('Attacking') && !this.canCancelAttack()) return false;
    if (this.stamina < cost) {
      this.flashText(t('No stamina'), '#ffd24a');
      this.combo.buffered = null;
      return false;
    }
    const energyCost = def.energyCost ?? 0;
    if (this.energy < energyCost) {
      this.flashText(t('Not enough energy'), '#6aa8ff');
      this.combo.buffered = null;
      return false;
    }
    if (!this.sm.transition('Attacking')) return false;
    this.stamina -= cost;
    this.energy -= energyCost;
    if (cost > 0) this.staminaDelay = PLAYER_CFG.staminaRegenDelay;
    this.combo.onAttackStarted(def.id);
    const mx = this.input.intent.moveX;
    if (mx !== 0) this.facing = mx;
    const spec: HitSpec = { def, damageMult: 1, element: 'physical', comboScale: this.combo.scale(), ...overrides };
    this.runner.start(def, spec);
    // Attacks briefly root the player on the ground (keeps hitboxes readable).
    if (this.grounded) this.arcade.setVelocityX(this.arcade.velocity.x * 0.35);
    return true;
  }

  private onAttackPhase(phase: AttackPhase, prev: AttackPhase): void {
    const def = this.runner.def;
    if (!def) return;
    if (phase === 'active') {
      if (def.lunge) this.arcade.setVelocityX(this.facing * def.lunge);
      audio.play(def.sfx === 'fire' ? 'fire' : 'whoosh');
      if (def.sfx !== 'fire') audio.play(def.sfx);
      if (this.activeSpecial) this.fireSpecialEffects(this.activeSpecial);
      else if (def.projectile && this.runner.spec) this.projectiles.fire(this, def.projectile, { ...this.runner.spec }, this.facing);
      if (this.runner.spec?.def.id === 'fire_punch') {
        this.ctx.fx.fireBurst(this.cx + this.facing * 40, this.cy - 20, 14);
        this.ctx.fx.ring(this.cx + this.facing * 40, this.cy - 20, COLORS.fire, 8, 70, 250);
      }
    }
    if (phase === 'idle' && prev !== 'idle') { this.combo.onAttackEnded(); this.activeSpecial = null; }
  }

  private updateAttacking(dt: number, I: Intent): void {
    const r = this.runner;
    const def = r.def;
    // air control + ground friction
    if (this.grounded && !(r.phase === 'active' && def?.lunge)) this.moveHorizontal(dt, 0);
    else if (!this.grounded) this.moveHorizontal(dt, I.moveX, 0.8);

    if (r.active) {
      this.ctx.combat.processAttack(this, r);
      if (r.spec?.def.id === 'fire_punch') {
        this.ctx.fx.fireTick(this.cx + this.facing * 50, this.cy - 24);
        this.ctx.fx.fireTick(this.cx + this.facing * 62, this.cy - 30);
      } else if (r.spec?.element === 'fire' && this.rig.weapon) {
        this.rig.weaponTip(this.pt);
        this.ctx.fx.fireTick(this.pt.x, this.pt.y);
      }
    }

    if (!r.running) {
      // finished: chain buffered input, otherwise return to locomotion
      const b = this.combo.buffered;
      if (b && this.startWeaponAttack(this.combo.resolve(b.input, false))) return;
      this.sm.transition(this.grounded ? 'Idle' : 'Falling');
      return;
    }

    // cancels during recovery: chain, dodge, block, ability
    if (this.canCancelAttack()) {
      if (I.dodgePressed && this.startDodge(I)) return;
      const b = this.combo.buffered;
      if (b && def && this.combo.hasChainFrom(def.id, b.input)) {
        if (this.startWeaponAttack(this.combo.resolve(b.input, true))) return;
      }
      if (I.ability1 && this.abilities.tryActivate(0)) return;
      if (I.ability2 && this.abilities.tryActivate(1)) return;
      if (I.special && this.trySpecial()) return;
      if (I.blockHeld && this.grounded && this.sm.can('Blocking')) {
        r.cancel();
        this.combo.onAttackEnded();
        this.sm.transition('Blocking');
        this.blockTime = 0;
      }
    }
  }

  override onHitLanded(target: Fighter, spec: HitSpec, res: HitResult): void {
    if (res.outcome !== 'hit' && res.outcome !== 'killed') return;
    const n = this.combo.registerHit();
    // Casting weapons pay energy per attack and must not refund it from their own hits.
    if (!spec.def.energyCost && !spec.def.projectile) this.energy = Math.min(this.stats.maxEnergy, this.energy + PLAYER_CFG.energyOnHit);
    if (n >= 2) this.ctx.fx.text(this.cx, this.cy - 74, t('{n} HIT', { n }), n >= 5 ? '#ffd24a' : '#ffffff', 16 + Math.min(n, 8), 600);
    if (spec.def.id === 'combo_heavy') this.ctx.fx.text(this.cx, this.cy - 100, t('FINISHER!'), '#ff8a5c', 26, 800);
    if (spec.extraStun) target.stun(spec.extraStun);
    // Weapon stagger: never on bosses or armoured moves, and a target cannot be re-staggered during its lockout.
    if (spec.stagger && res.outcome === 'hit' && this.staggerGate.tryStagger(target.id, this.ctx.clock.now, target.staggerImmune())) target.stun(spec.stagger);
  }

  /* ------------------------------------------------------------------ blocking */

  private updateBlocking(dt: number, I: Intent): void {
    this.blockTime += dt;
    if (I.moveX !== 0) this.facing = I.moveX;
    this.moveHorizontal(dt, 0);
    if (!I.blockHeld || !this.grounded) {
      this.sm.transition(this.grounded ? 'Idle' : 'Falling');
      return;
    }
    if (I.dodgePressed) this.startDodge(I);
  }

  /* ------------------------------------------------------------------ dodge & dash */

  private startDodge(I: Intent): boolean {
    const c = PLAYER_CFG.dodge;
    if (this.dodgeCd > 0 || this.stamina < c.stamina || !this.grounded || !this.sm.can('Dodging')) return false;
    this.runner.cancel();
    this.combo.onAttackEnded();
    this.sm.transition('Dodging');
    this.stamina -= c.stamina;
    this.staminaDelay = PLAYER_CFG.staminaRegenDelay;
    this.dodgeT = 0;
    this.dodgeDir = I.moveX !== 0 ? I.moveX : ((-this.facing) as -1 | 1);
    this.dodgeFwd = this.dodgeDir === this.facing ? 1 : -1;
    this.dodgeCd = c.cooldown + c.duration;
    this.ctx.fx.dustPuff(this.cx, this.feetY, 6);
    audio.play('dodge');
    return true;
  }

  private updateDodging(dt: number, I: Intent): void {
    const c = PLAYER_CFG.dodge;
    this.dodgeT += dt;
    const k = 1 - this.dodgeT / c.duration;
    this.arcade.setVelocityX(this.dodgeDir * c.speed * Math.max(0.15, k * k + 0.25));
    if (this.dodgeT % 90 < dt) this.ctx.fx.dustPuff(this.cx, this.feetY, 1);
    if (this.dodgeT >= c.duration) {
      const mx = I.moveX;
      this.arcade.setVelocityX(this.arcade.velocity.x * 0.3);
      this.sm.transition(this.grounded ? (mx !== 0 ? 'Moving' : 'Idle') : 'Falling');
    }
  }

  private startDash(I: Intent): boolean {
    const c = PLAYER_CFG.dash;
    if (this.dashCd > 0 || this.stamina < c.stamina || !this.sm.can('Dashing')) return false;
    if (this.sm.is('Attacking') && !this.canCancelAttack()) return false;
    if (!this.grounded && this.airDashUsed) return false;
    if (!this.grounded) this.airDashUsed = true;
    this.runner.cancel();
    this.combo.onAttackEnded();
    this.sm.transition('Dashing');
    this.stamina -= c.stamina;
    this.staminaDelay = PLAYER_CFG.staminaRegenDelay;
    const dir = (I.moveX !== 0 ? I.moveX : this.facing) as -1 | 1;
    this.facing = dir;
    this.dash = { kind: 'dash', t: 0, dur: c.duration, dir, speed: c.speed * this.stats.moveSpeedMult, dist: Infinity, startX: this.cx, startY: this.cy, hits: new Set() };
    this.arcade.allowGravity = false;
    this.arcade.setVelocity(dir * this.dash.speed, 0);
    this.dashCd = c.cooldown + c.duration;
    this.ctx.fx.dustPuff(this.cx, this.feetY, 6);
    audio.play('dash');
    return true;
  }

  private castLightning(rank: number): boolean {
    if (!this.sm.can('Dashing')) return false;
    const ad = ABILITIES.lightning_dash;
    const dist = ad.range[rank - 1];
    const dur = 190;
    this.runner.cancel();
    this.combo.onAttackEnded();
    this.sm.transition('Dashing');
    const dir = (this.input.intent.moveX !== 0 ? this.input.intent.moveX : this.facing) as -1 | 1;
    this.facing = dir;
    const spec: HitSpec = {
      def: { ...PLAYER_ATTACKS.lightning_dash, damage: ad.damage[rank - 1] },
      damageMult: 1, element: 'lightning', comboScale: this.combo.scale(),
      extraStun: rank >= 3 ? 1000 : undefined,
    };
    this.dash = { kind: 'lightning', t: 0, dur, dir, speed: (dist / dur) * 1000, dist, startX: this.cx, startY: this.cy, spec, hits: new Set() };
    this.arcade.allowGravity = false;
    this.arcade.setVelocity(dir * this.dash.speed, 0);
    this.iframes = 0;
    this.ctx.fx.boltBurst(this.cx, this.cy, 16);
    this.ctx.fx.ring(this.cx, this.cy, COLORS.lightning, 10, 80, 260);
    this.ctx.fx.shake(0.004, 100);
    audio.play('zap');
    return true;
  }

  private updateDashing(dt: number, I: Intent): void {
    const d = this.dash;
    if (!d) { this.sm.transition('Falling'); return; }
    d.t += dt;
    this.arcade.setVelocityY(0);

    if (d.kind === 'flurry') {
      this.arcade.setVelocityX(d.dir * d.speed);
      this.dashTrail.push(this.cx, this.cy - 8);
      d.tick = (d.tick ?? 0) - dt;
      if (d.spec && d.tick <= 0) {
        d.tick += this.weapon.def.special.dash?.interval ?? 70;
        d.hits.clear();
        const rect = this.tmpRect.setTo(this.cx - 56, this.cy - 46, 112, 92);
        const n = this.ctx.combat.hitRect(this, rect, d.spec, d.hits, this.cx - d.dir * 30);
        if (n > 0) { this.ctx.fx.hitSparks(this.cx + d.dir * 36, this.cy - 6, d.dir, 6); this.ctx.fx.shake(0.002, 60); }
      }
    } else if (d.kind === 'lightning') {
      this.arcade.setVelocityX(d.dir * d.speed);
      this.dashTrail.push(this.cx, this.cy - 8);
      this.ctx.fx.boltBurst(this.cx, this.cy + (Math.random() - 0.5) * 50, 2);
      if (d.spec) {
        const rect = this.tmpRect.setTo(this.cx - 46, this.cy - 44, 92, 88);
        const n = this.ctx.combat.hitRect(this, rect, d.spec, d.hits, this.cx - d.dir * 30);
        if (n > 0) this.ctx.fx.boltBurst(this.cx + d.dir * 30, this.cy, 10);
      }
    } else {
      // Dash attack: any attack button during a dash converts it into a lunging strike.
      const b = this.combo.buffered;
      if (b) {
        this.endDash(false);
        this.combo.buffered = null;
        if (this.startAttack(this.weapon.attack(this.weapon.def.combo.dashAttack ?? 'dash_attack'), this.weaponSpec(PLAYER_ATTACKS.dash_attack))) return;
        this.dash = null;
      } else if (d.t % 40 < dt) {
        this.ctx.fx.dustPuff(this.cx, this.feetY, 1);
      }
      this.footTrail.push(this.cx - d.dir * 6, this.cy);
    }

    const blocked = (d.dir > 0 && this.arcade.blocked.right) || (d.dir < 0 && this.arcade.blocked.left);
    const traveled = Math.abs(this.cx - d.startX) >= d.dist;
    if (d.t >= d.dur || blocked || traveled) {
      if (d.kind === 'flurry' && d.finisher) {
        const fin = d.finisher;
        this.endDash(false);
        if (this.startAttack(fin.def, fin.spec)) return;
        this.sm.transition(this.grounded ? 'Idle' : 'Falling');
      } else this.endDash(true);
    }
    void I;
  }

  private readonly tmpRect = new Phaser.Geom.Rectangle();

  private endDash(transition: boolean): void {
    const d = this.dash;
    if (!d) return;
    this.arcade.allowGravity = true;
    if (d.kind === 'flurry') {
      this.ctx.fx.ring(this.cx, this.cy, this.weapon.def.vfx.trail, 10, 80, 240);
      this.arcade.setVelocityX(d.dir * 120);
    } else if (d.kind === 'lightning') {
      this.ctx.fx.bolt(d.startX, d.startY - 6, this.cx, this.cy - 6, COLORS.lightning, 260);
      this.ctx.fx.boltBurst(this.cx, this.cy, 14);
      this.ctx.fx.ring(this.cx, this.cy, COLORS.lightning, 10, 90, 280);
      this.arcade.setVelocityX(d.dir * 160);
    } else {
      this.arcade.setVelocityX(d.dir * 220);
    }
    this.dash = null;
    if (transition) this.sm.transition(this.grounded ? 'Idle' : 'Falling');
  }

  /* ------------------------------------------------------------------ weapons */

  /** Spec fields every normal hit of the equipped weapon carries (damage multiplier, element, stagger). */
  private weaponSpec(def: AttackDef, extraMult = 1): Partial<HitSpec> {
    const w = this.weapon;
    const fx = w.def.elementEffect;
    const stagger = Math.max(def.stagger ?? 0, fx?.stagger ?? 0);
    return {
      damageMult: w.stats.damageMult * extraMult,
      element: w.def.element,
      burn: fx?.burn,
      stagger: stagger > 0 ? stagger : undefined,
    };
  }

  private startWeaponAttack(id: string): boolean {
    const def = this.weapon.resolveAttack(id, this.energy);
    return this.startAttack(def, this.weaponSpec(def));
  }

  /** Re-reads the equipped weapon and rebuilds everything that depends on it (combo graph, art, trail). */
  private applyWeapon(): void {
    const w = this.weapon;
    w.sync();
    const c = w.def.combo;
    this.combo.setTable(c.attacks, c.openers, w.stats.comboGain);
    this.rig.weapon = painterFor(w.def.id, w.def.category, w.def.art);
    this.ctx.fx.removeTrail(this.weaponTrail);
    this.weaponTrail = this.ctx.fx.createTrail(w.def.vfx.trail, w.def.category === 'daggers' ? 5 : 9, 10);
  }

  /** Called every frame: follows equip changes made from the inventory (while paused) or by quick switching. */
  private syncWeapon(): void {
    const p = session.profile;
    const id = equippedId(p);
    if (id !== this.weapon.def.id) {
      if (this.sm.is('Attacking')) {
        this.runner.cancel();
        this.sm.transition(this.grounded ? 'Idle' : 'Falling');
      }
      this.activeSpecial = null;
      this.applyWeapon();
      this.onWeaponChanged();
    } else if (levelOf(p, id) !== this.weapon.level) {
      this.weapon.sync();
      this.combo.setTable(this.weapon.def.combo.attacks, this.weapon.def.combo.openers, this.weapon.stats.comboGain);
    }
  }

  private onWeaponChanged(): void {
    const d = this.weapon.def;
    this.ctx.fx.text(this.cx, this.cy - 84, `${d.icon} ${t(d.name)}`, `#${RARITY_COLOR[d.rarity].toString(16).padStart(6, '0')}`, 20, 900);
    this.ctx.fx.ring(this.cx, this.cy - 10, RARITY_COLOR[d.rarity], 10, 64, 320, 3);
    audio.play('weaponSwitch');
  }

  /** Quick switch to the next / previous owned weapon during play. Refused while the player cannot act. */
  private quickSwitch(dir: 1 | -1): void {
    if (this.locked || !this.alive || this.switchCd > 0) return;
    if (!WeaponRuntime.canSwitchIn(this.sm.state, this.sm.is('Attacking') && this.canCancelAttack())) { audio.play('denied'); return; }
    const target = cycleTarget(session.profile, dir);
    if (target === this.weapon.def.id) { this.flashText(t('No other weapon'), '#9aa3c7'); audio.play('denied'); return; }
    this.switchCd = 220;
    if (session.equipWeapon(target, true).ok) this.syncWeapon();
  }

  /** The weapon's special ability: cooldown and energy are checked here, the effect runs through the shared attack flow. */
  private trySpecial(): boolean {
    if (!this.canCast()) return false;
    const chk = this.weapon.checkSpecial(this.energy);
    if (!chk.ok) {
      if (chk.reason === 'energy') this.flashText(t('Not enough energy'), '#6aa8ff');
      audio.play('denied');
      return false;
    }
    if (!this.castSpecial(this.weapon.def.special)) return false;
    this.energy = Math.max(0, this.energy - chk.cost);
    this.weapon.startSpecialCooldown();
    return true;
  }

  private specialSpec(sp: SpecialDef, def: AttackDef): Partial<HitSpec> {
    return this.weaponSpec(def, this.weapon.stats.specialMult);
  }

  private castSpecial(sp: SpecialDef): boolean {
    if (sp.kind === 'dash_flurry') return this.castFlurry(sp);
    this.activeSpecial = sp;
    if (!this.startAttack(sp.attack, this.specialSpec(sp, sp.attack))) { this.activeSpecial = null; return false; }
    return true;
  }

  private castFlurry(sp: SpecialDef): boolean {
    if (!sp.dash || !this.sm.can('Dashing')) return false;
    this.runner.cancel();
    this.combo.onAttackEnded();
    this.sm.transition('Dashing');
    const dir = (this.input.intent.moveX !== 0 ? this.input.intent.moveX : this.facing) as -1 | 1;
    this.facing = dir;
    const hitDef: AttackDef = {
      ...sp.attack, damage: sp.dash.hitDamage, hitbox: { ...sp.attack.hitbox }, startup: 0, active: sp.dash.interval, recovery: 0,
      knockback: { x: 70, y: -40 }, hitStun: 200, hitStop: 18, shake: 0, sfx: 'stab',
    };
    const spec: HitSpec = { def: hitDef, element: this.weapon.def.element, comboScale: this.combo.scale(), burn: this.weapon.def.elementEffect?.burn, ...this.specialSpec(sp, hitDef), damageMult: this.weapon.stats.damageMult * this.weapon.stats.specialMult };
    const { distance, duration } = sp.dash;
    this.dash = {
      kind: 'flurry', t: 0, dur: duration, dir, speed: (distance / duration) * 1000, dist: distance, startX: this.cx, startY: this.cy,
      spec, hits: new Set(), tick: 0, finisher: { def: sp.attack, spec: this.specialSpec(sp, sp.attack) },
    };
    this.arcade.allowGravity = false;
    this.arcade.setVelocity(dir * this.dash.speed, 0);
    this.iframes = 0;
    this.ctx.fx.dustPuff(this.cx, this.feetY, 8);
    this.ctx.fx.ring(this.cx, this.cy, this.weapon.def.vfx.trail, 8, 70, 240);
    audio.play('special');
    return true;
  }

  /** Visual and physical effects at the moment a special's strike lands: shockwaves, waves, projectiles. */
  private fireSpecialEffects(sp: SpecialDef): void {
    const w = this.weapon;
    const fx = this.ctx.fx;
    const dir = this.facing;
    const color = w.def.vfx.impact === 0xffffff ? w.def.vfx.trail : w.def.vfx.impact;
    audio.play(sp.attack.sfx);
    const base = this.runner.spec!;
    if (sp.kind === 'slam') {
      fx.debrisBurst(this.cx + dir * 28, this.feetY - 6, 20);
      fx.ring(this.cx, this.feetY - 8, color, 20, sp.attack.hitbox.w / 2, 420, 6);
      fx.dustPuff(this.cx, this.feetY, 12);
      fx.shake(Math.max(0.01, sp.attack.shake), 260);
    } else if (sp.kind === 'strike') {
      fx.ring(this.cx + dir * 50, this.cy - 10, color, 12, 90, 280, 5);
      fx.hitSparks(this.cx + dir * 60, this.cy - 10, dir, 8, true);
    }
    const waveDef: AttackDef = { ...sp.attack, hitStop: Math.min(sp.attack.hitStop, 40), shake: 0.003 };
    for (const wave of sp.waves ?? []) {
      this.projectiles.fire(this, { ...wave, color: wave.ground ? wave.color : color }, { ...base, def: waveDef, damageMult: base.damageMult * (wave.damageMult ?? 1) }, dir);
    }
    if (sp.kind === 'projectile' && sp.projectile) {
      fx.ring(this.cx + dir * 36, this.cy - 20, sp.projectile.color, 6, 46, 260, 4);
      this.projectiles.fire(this, sp.projectile, { ...base, damageMult: base.damageMult * (sp.projectile.damageMult ?? 1) }, dir);
    }
  }

  /* ------------------------------------------------------------------ abilities (AbilityHost) */

  cast(id: AbilityId, rank: number): boolean {
    if (id === 'lightning_dash') return this.castLightning(rank);
    const ad = ABILITIES.fire_punch;
    const base = PLAYER_ATTACKS.fire_punch;
    const def: AttackDef = { ...base, damage: ad.damage[rank - 1], hitbox: { ...base.hitbox, w: ad.range[rank - 1], h: base.hitbox.h + (rank - 1) * 8 } };
    return this.startAttack(def, { element: 'fire', burn: FIRE_BURN[rank] });
  }

  /* ------------------------------------------------------------------ taking damage */

  receiveHit(spec: HitSpec, attacker: Fighter, fromX: number): HitResult {
    if (!this.alive || this.invulnerable()) return IGNORED;
    if (__DEV_TOOLS__ && devFlags.god) return IGNORED;
    const dir = this.cx >= fromX ? 1 : -1;
    const frontal = (fromX - this.cx) * this.facing >= -6;
    let block: BlockResult = 'none';
    if (this.sm.is('Blocking') && frontal) block = this.blockTime <= PLAYER_CFG.block.perfectWindow ? 'perfect' : 'block';
    const input = {
      baseDamage: spec.def.damage, attackerAttack: attacker.attackStat, targetDefense: this.defenseStat,
      comboScale: spec.comboScale, multiplier: spec.damageMult, block, blockFactor: PLAYER_CFG.block.damageFactor,
    };
    const dmg = computeDamage(input);
    let outcome: HitOutcome = 'hit';

    if (block === 'perfect') {
      this.energy = Math.min(this.stats.maxEnergy, this.energy + PLAYER_CFG.block.perfectEnergy);
      attacker.stun(1100);
      this.iframes = 200;
      return { outcome: 'perfect', damage: 0, dir };
    }

    if (block === 'block') {
      const raw = computeDamage({ ...input, block: 'none' });
      this.stamina = Math.max(0, this.stamina - raw * PLAYER_CFG.block.staminaPerDamage);
      this.staminaDelay = PLAYER_CFG.staminaRegenDelay * 2;
      this.health = Math.max(0, this.health - dmg);
      this.arcade.setVelocityX(dir * spec.def.knockback.x * 0.35);
      outcome = 'blocked';
      if (this.stamina <= 0 && this.health > 0) {
        // guard break
        this.beginHurt(PLAYER_CFG.block.guardBreakStun, dir, spec.def.knockback.x * 0.6, -120);
        this.ctx.fx.text(this.cx, this.cy - 80, t('GUARD BREAK'), '#ffd24a', 20, 900);
      }
    } else {
      this.health = Math.max(0, this.health - dmg);
      this.combo.reset();
      this.beginHurt(spec.def.hitStun, dir, spec.def.knockback.x, spec.def.knockback.y);
      this.iframes = PLAYER_CFG.hurtIframes + spec.def.hitStun * 0.3;
    }
    if (this.health <= 0) { this.die(); return { outcome: 'killed', damage: dmg, dir }; }
    return { outcome, damage: dmg, dir };
  }

  private beginHurt(stun: number, dir: number, kx: number, ky: number): void {
    this.runner.cancel();
    this.dash = null;
    this.arcade.allowGravity = true;
    this.hurtDur = stun;
    this.sm.transition('TakingDamage');
    this.arcade.setVelocity(dir * kx, ky);
    this.rig.flash(110, 0xffffff);
  }

  private updateHurt(dt: number): void {
    this.arcade.setVelocityX(this.arcade.velocity.x * Math.pow(0.04, dt / 1000));
    if (this.sm.elapsed >= this.hurtDur) this.sm.transition(this.grounded ? 'Idle' : 'Falling');
  }

  override stun(ms: number): void {
    this.beginHurt(ms, -this.facing, 0, 0);
  }

  private die(): void {
    this.alive = false;
    this.runner.cancel();
    this.dash = null;
    this.arcade.allowGravity = true;
    this.sm.transition('Dead');
    this.deadT = 0;
    this.arcade.setVelocityX(-this.facing * 220);
    this.arcade.setVelocityY(-380);
    audio.play('death');
    this.ctx.fx.shake(0.012, 300);
    this.ctx.clock.slowmo(0.35, 900);
  }

  private updateDead(dt: number): void {
    this.deadT += dt;
    this.arcade.setVelocityX(this.arcade.velocity.x * Math.pow(0.02, dt / 1000));
    this.rig.alpha = 1;
    const p = Math.min(1, this.deadT / 800);
    poseDead(this.pose, p);
    this.rig.draw(this.cx, this.feetY, this.facing, this.pose, 40, dt);
    if (this.deadT > 1400 && this.onDied) {
      const cb = this.onDied;
      this.onDied = undefined;
      cb();
    }
  }

  /* ------------------------------------------------------------------ visuals */

  private updateVisuals(dt: number): void {
    const P = this.pose;
    const a = this.arcade;
    const r = this.runner;
    let rate = 18;
    this.idleT += dt / 1000;
    this.rig.velX = a.velocity.x;
    this.rig.alpha = this.iframes > 0 && !this.sm.is('Dodging', 'Dashing') ? (Math.floor(this.ctx.clock.now / 70) % 2 ? 0.45 : 0.9) : 1;
    this.glowAmt = 0;
    this.rig.glow = null;

    switch (this.sm.state) {
      case 'Attacking': {
        const def = r.def!;
        const ph = r.phase === 'idle' ? 'recovery' : r.phase;
        const pr = r.phase === 'idle' ? 1 : r.progress;
        poseAttack(P, def.anim, ph, pr);
        if (this.rig.weapon) weaponAngles(P, def.anim, ph, pr, REST_ANGLE[this.weapon.def.category]);
        this.rig.swing = r.active ? 1 : 0;
        rate = 55;
        if (r.spec?.def.id === 'fire_punch') {
          this.glowAmt = r.phase === 'recovery' ? 1 - r.progress : 1;
          this.rig.glow = { color: COLORS.fire, amount: this.glowAmt };
        }
        // weapon trails during the swing
        if (r.active || (r.phase === 'startup' && r.progress > 0.5)) {
          const kicking = def.anim === 'kick' || def.anim === 'roundhouse';
          if (this.rig.weapon && !kicking && def.id !== 'wp_kick') {
            this.rig.weaponTip(this.pt);
            this.weaponTrail.push(this.pt.x, this.pt.y);
          } else if (kicking) { this.rig.foot('f', this.pt); this.footTrail.push(this.pt.x, this.pt.y); }
          else {
            this.rig.hand(def.anim === 'punch2' || def.anim === 'heavy' ? 'b' : 'a', this.pt);
            this.fistTrail.push(this.pt.x, this.pt.y);
          }
        }
        break;
      }
      case 'Blocking': poseBlock(P, this.idleT); rate = 28; break;
      case 'Dodging': poseDodge(P, this.dodgeT / PLAYER_CFG.dodge.duration, this.dodgeFwd); rate = 70; break;
      case 'Dashing':
        if (this.dash?.kind === 'lightning') poseLightning(P, this.idleT);
        else if (this.dash?.kind === 'flurry') { poseFlurry(P, this.idleT); this.rig.swing = 1; this.rig.weaponTip(this.pt); this.weaponTrail.push(this.pt.x, this.pt.y); }
        else poseDash(P, this.idleT);
        rate = 45;
        break;
      case 'TakingDamage': poseHurt(P, this.sm.elapsed / Math.max(1, this.hurtDur)); if (this.hurtDur > 700) poseStun(P, this.idleT); rate = 45; break;
      case 'Jumping': poseJump(P, a.velocity.y); rate = 20; break;
      case 'Falling': poseFall(P, a.velocity.y); rate = 16; break;
      case 'Moving': {
        const speed = Math.abs(a.velocity.x);
        const run = Math.min(1, Math.max(0, (speed - 140) / 220));
        this.movePhase += speed * (dt / 1000) * 0.048;
        poseMove(P, this.movePhase, 0.5 + run * 0.55, run);
        rate = 24;
        this.stepAcc += (speed * (dt / 1000) * 0.048) / Math.PI;
        if (this.stepAcc >= 1) { this.stepAcc -= 1; if (this.grounded) { audio.play('step'); if (speed > 280) this.ctx.fx.dustPuff(this.cx, this.feetY, 1); } }
        break;
      }
      default:
        poseIdle(P, this.idleT);
        rate = 14;
    }
    if (this.landT > 0 && this.sm.is('Idle', 'Moving')) {
      poseLand(P, 1 - this.landT / 150);
      rate = 60;
    }
    // Held weapon at rest: follows the carrying arm so it bobs with the stride instead of staying frozen.
    if (this.rig.weapon && !this.sm.is('Attacking') && !(this.sm.is('Dashing') && this.dash?.kind === 'flurry')) {
      const rest = REST_ANGLE[this.weapon.def.category];
      P.wa = rest.wa + (P.aL - 1.9) * 0.7;
      P.wb = rest.wb + (P.bL - 1.7) * 0.7;
      this.rig.swing = 0;
    }
    this.rig.draw(this.cx, this.feetY, this.facing, P, rate, dt);
  }

  override destroy(): void {
    this.ctx.fx.removeTrail(this.fistTrail);
    this.ctx.fx.removeTrail(this.footTrail);
    this.ctx.fx.removeTrail(this.dashTrail);
    this.ctx.fx.removeTrail(this.weaponTrail);
    this.projectiles.destroy();
    this.input.destroy();
    super.destroy();
  }
}
