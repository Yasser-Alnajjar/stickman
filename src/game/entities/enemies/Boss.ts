import Phaser from 'phaser';
import type { AttackPhase, BossId, HitSpec } from '@/shared/types';
import { DEPTH } from '@/shared/constants';
import { ENEMY_ATTACKS } from '@/game/config/attacks';
import { BOSSES, type BossDef, type BossPattern, type EnemyDef } from '@/game/config/enemies';
import { BOSS_MOVES } from '@/game/world/stores';
import type { BossApi, BossMove, HazardOpts, MovePlan, ProjectileSpec } from '@/game/config/boss-moves';
import { Enemy } from './Enemy';
import type { HitResult } from '@/game/systems/combat/CombatSystem';
import type { Fighter } from '@/game/entities/Fighter';
import type { WorldContext } from '@/game/systems/world/context';
import { poseAttack, poseDead, poseFall, poseIdle, poseJump, poseLand, poseMove, poseStun } from '@/game/animations/clips';
import { audio } from '@/game/managers/AudioManager';
import { session } from '@/game/managers/session';
import { bus } from '@/game/events/bus';
import { t } from '@/i18n';

function enemyDefFor(d: BossDef): EnemyDef {
  return {
    kind: 'boss', name: d.name, maxHealth: d.maxHealth, attack: d.attack, defense: d.defense,
    width: d.width, height: d.height, patrolSpeed: 0, chaseSpeed: d.walkSpeed, detectRange: 4000,
    detectHeight: 900, loseRange: 9000, attackRange: 160, attackCooldown: 0, recoverTime: 0, attacks: [],
    knockbackResist: 1, stunScale: 0, xp: d.xp, gold: d.gold, style: d.style,
  };
}

type Mode =
  | 'dormant' | 'intro' | 'choose' | 'walk' | 'combo' | 'slam' | 'charge_tel' | 'charge_run'
  | 'leap_tel' | 'leap_air' | 'cast' | 'whirl_tel' | 'whirl' | 'pause' | 'exhausted' | 'roar' | 'dead';

interface Wave { x: number; dir: -1 | 1; life: number; hits: Set<number> }
/** A timed damage zone (falling cargo, flame pillar). */
interface Hazard {
  x: number; w: number; top: number; h: number; life: number; spec: HitSpec; hits: Set<number>; color: number;
  vx: number; vy: number; shape: 'column' | 'orb' | 'beam';
}
/** A per-frame effect a move script installed (gravity well, gale, ...). It ends with its timer or with the fight. */
interface Field { life: number; fn: (dtMs: number) => void }
interface CastEvent { at: number; fn: () => void; done: boolean }
interface Cast { events: CastEvent[]; dur: number; end: 'pause' | 'exhausted' }

const waveRect = new Phaser.Geom.Rectangle();
const hazRect = new Phaser.Geom.Rectangle();
const EXHAUSTED = (): string => t('EXHAUSTED!');

/**
 * Data-driven boss (see BOSSES). Three phases, telegraphed patterns and exhaustion windows (vulnerable) after the big
 * attacks. Patterns are shared building blocks; each boss picks and weights its own set:
 *  - combo / slam / charge / leap: melee, shockwaves and gap-closers
 *  - volley:   projectile barrage (low/high harpoons, aimed fireball fans)
 *  - rain:     marked floor spots, cargo crashes down on them
 *  - pillars:  flame pillars erupt outward from the player's position
 *  - teleport: vanishes and ambushes from behind
 *  - whirl:    a spinning rush that leaves the boss exhausted
 */
export class Boss extends Enemy {
  readonly bossId: BossId;
  phase = 1;
  private readonly bd: BossDef;
  private mode: Mode = 'dormant';
  private mt = 0;
  private last: BossPattern | null = null;
  private pattern: BossPattern = 'combo';
  private chargeDir: -1 | 1 = 1;
  private leapTargetX = 0;
  private leapAir = 0;
  private summoned = false;
  private hidden = false;
  private cast: Cast | null = null;
  private whirlTick = 0;
  private whirlHits = new Set<number>();
  private readonly waves: Wave[] = [];
  private readonly hazards: Hazard[] = [];
  private readonly fields: Field[] = [];
  private plan: MovePlan | null = null;
  private api: BossApi | null = null;
  private readonly waveG: Phaser.GameObjects.Graphics;
  private lastEmit = 0;
  onDefeated?: () => void;

  constructor(ctx: WorldContext, x: number, feetY: number, id: BossId) {
    const bd = BOSSES[id];
    super(ctx, enemyDefFor(bd), x, feetY, 0);
    this.bd = bd;
    this.bossId = id;
    this.waveG = ctx.scene.add.graphics().setDepth(DEPTH.fx - 1);
    this.facing = -1;
    // Boss attacks use the shared Attack/Recover states; the machine must not rest in Idle (Idle -> Attack is invalid).
    this.sm.transition('Chase');
  }

  private k(name: string): string { return `${this.bd.prefix}_${name}`; }
  private spec(name: string, burn?: HitSpec['burn']): HitSpec { return { def: ENEMY_ATTACKS[this.k(name)], damageMult: 1, element: 'physical', comboScale: 1, burn }; }

  /** Starts the encounter. */
  engage(): void {
    if (this.mode !== 'dormant') return;
    this.setMode('intro');
    audio.play('roar');
    this.ctx.fx.shake(0.01, 600);
    bus.emit('banner', { title: t(this.bd.name), subtitle: t(this.bd.subtitle) });
    this.ctx.scene.time.delayedCall(2600, () => bus.emit('banner', null));
  }

  get engaged(): boolean { return this.mode !== 'dormant'; }
  private get invulnerable(): boolean { return this.hidden || this.mode === 'dormant' || this.mode === 'roar' || this.mode === 'intro'; }
  private get tempo(): number { return this.bd.tempo[this.phase - 1]; }

  private setMode(m: Mode): void {
    this.mode = m;
    this.mt = 0;
    this.cast = null;
    if (m !== 'cast') this.plan = null;
    this.vulnerable = m === 'exhausted';
    if (m !== 'cast') this.hidden = false;
  }

  private exhaust(): void {
    this.sm.transition('Recover');
    this.setMode('exhausted');
    this.ctx.fx.text(this.cx, this.cy - 130, EXHAUSTED(), '#ffd24a', 24, 1200);
  }

  protected override aiInterval(): number { return 1; }

  /* ------------------------------------------------------------------ AI */

  protected override think(dt: number): void {
    this.mt += dt;
    this.updateFx(dt);
    const p = this.ctx.getPlayer();
    const a = this.arcade;
    const dx = p.cx - this.cx, adx = Math.abs(dx);
    const speed = this.bd.walkSpeed * (this.phase === 1 ? 1 : this.phase === 2 ? 1.08 : 1.18);

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
          const s = this.bd.summon;
          if (s && s.phase === this.phase && !this.summoned) this.summon();
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
        const dur = this.pattern === 'charge' ? 2600 : this.pattern === 'whirl' ? 2200 : 1900;
        if (this.mt > dur) this.setMode('pause');
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
        if (this.mt > 1200) this.startCharge();
        break;
      case 'charge_run': {
        a.setVelocityX(this.chargeDir * 750);
        const hitWall = (this.chargeDir > 0 && a.blocked.right) || (this.chargeDir < 0 && a.blocked.left);
        if (hitWall || this.mt > 1300 || !this.runner.running) {
          this.runner.cancel();
          if (hitWall) {
            this.ctx.fx.shake(0.016, 350);
            this.ctx.fx.debrisBurst(this.cx + this.chargeDir * 40, this.cy, 24);
            audio.play('slam');
          }
          a.setVelocityX(0);
          this.exhaust();
        }
        break;
      }
      case 'leap_tel':
        a.setVelocityX(this.approachVx(0, 3000, dt));
        if (this.mt > 900) this.startLeap();
        break;
      case 'leap_air':
        this.leapAir += dt;
        if (this.grounded && this.leapAir > 120) this.landLeap();
        break;
      case 'cast':
        a.setVelocityX(this.approachVx(0, 3000, dt));
        this.runCast();
        break;
      case 'whirl_tel':
        a.setVelocityX(this.approachVx(0, 3000, dt));
        this.faceToward(p.cx);
        if (this.mt > 700) { this.setMode('whirl'); this.whirlTick = 0; this.whirlHits.clear(); audio.play('roar'); }
        break;
      case 'whirl': {
        a.setVelocityX(this.approachVx(Math.sign(dx || 1) * (330 + this.phase * 40), 2600, dt));
        this.whirlTick += dt;
        if (this.whirlTick > 320) { this.whirlTick = 0; this.whirlHits.clear(); }
        waveRect.setTo(this.cx - 120, this.feetY - 150, 240, 150);
        this.ctx.combat.hitRect(this, waveRect, this.spec('whirl'), this.whirlHits, this.cx);
        if (Math.random() < 0.3) this.ctx.fx.dustPuff(this.cx + (Math.random() - 0.5) * 160, this.feetY, 1);
        if (this.mt > 1500) { a.setVelocityX(0); this.exhaust(); }
        break;
      }
      default: break;
    }

    // HUD
    if (this.ctx.clock.now - this.lastEmit > 80) {
      this.lastEmit = this.ctx.clock.now;
      if (this.mode !== 'dormant') bus.emit('boss:update', { name: t(this.bd.name), health: this.health, maxHealth: this.maxHealth, phase: this.phase });
    }
  }

  private runCast(): void {
    const c = this.cast;
    if (!c) { this.setMode('pause'); return; }
    for (const ev of c.events) {
      if (!ev.done && this.mt >= ev.at) {
        ev.done = true;
        ev.fn();
        if (this.cast !== c) return; // the event switched mode
      }
    }
    if (this.mt >= c.dur) {
      if (c.end === 'exhausted') this.exhaust(); else this.setMode('pause');
    }
  }

  private startCast(events: [number, () => void][], dur: number, end: Cast['end']): void {
    this.setMode('cast');
    this.cast = { events: events.map(([at, fn]) => ({ at, fn, done: false })), dur, end };
  }

  /** Weighted pick; each pattern prefers the range it is good at. Never repeats the previous pattern. */
  private choose(adx: number): void {
    const near = (lim: number, hi: number, lo: number): number => (adx < lim ? hi : lo);
    const affinity: Record<BossPattern, number> = {
      combo: near(220, 1.7, 0.35), slam: near(380, 1.3, 0.4), charge: adx > 320 ? 1.3 : 0.5, leap: adx > 340 ? 1.3 : 0.4,
      volley: adx > 300 ? 1.4 : 0.5, rain: 1, pillars: 1, teleport: adx > 200 ? 1.2 : 0.8, whirl: near(500, 1.2, 0.7),
    };
    // Pack-defined moves have no built-in range preference: their weight alone decides how often they are used.
    let pool = this.bd.patterns.filter((o) => (o.from ?? 1) <= this.phase && o.id !== this.last);
    if (!pool.length) pool = this.bd.patterns.filter((o) => (o.from ?? 1) <= this.phase);
    const weights = pool.map((o) => o.weight * (affinity[o.id] ?? 1));
    let roll = Math.random() * weights.reduce((s, w) => s + w, 0);
    let pick = pool[0].id;
    for (let i = 0; i < pool.length; i++) { roll -= weights[i]; if (roll <= 0) { pick = pool[i].id; break; } }
    this.pattern = pick;
    this.last = pick;
    if (pick === 'combo' || pick === 'slam') this.setMode('walk');
    else this.startPattern(pick);
  }

  private startPattern(p: BossPattern): void {
    const player = this.ctx.getPlayer();
    this.faceToward(player.cx);
    switch (p) {
      case 'combo':
        this.setMode('combo');
        this.launchAttack(this.k('swing1'));
        break;
      case 'slam': {
        this.setMode('slam');
        this.launchAttack(this.k('slam'));
        const d = ENEMY_ATTACKS[this.k('slam')];
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
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(x, this.feetY - 130, reach, 130), 1200);
        this.ctx.fx.text(this.cx, this.cy - 140, '!!', '#ff3030', 40, 1200);
        break;
      }
      case 'leap': {
        this.setMode('leap_tel');
        this.leapTargetX = Phaser.Math.Clamp(player.cx, 300, this.ctx.region.width - 300);
        audio.play('telegraph');
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(this.leapTargetX - 150, this.feetY - 70, 300, 70), 900);
        break;
      }
      default: {
        const move = BOSS_MOVES[this.bossId]?.[p];
        if (move) this.startMove(move);
        else this.setMode('pause'); // unknown pattern name: skip it rather than freeze the fight
        break;
      }
      case 'volley': this.startVolley(); break;
      case 'rain': this.startRain(); break;
      case 'pillars': this.startPillars(); break;
      case 'teleport': this.startTeleport(); break;
      case 'whirl':
        this.setMode('whirl_tel');
        audio.play('telegraph');
        this.ctx.fx.text(this.cx, this.cy - 140, '!!', '#ff3030', 40, 700);
        break;
    }
  }

  /* ------------------------------------------------------------------ new patterns */

  private startVolley(): void {
    const v = this.bd.volley!;
    const rounds = v.rounds[this.phase - 1], fan = v.fan[this.phase - 1];
    const events: [number, () => void][] = [];
    for (let i = 0; i < rounds; i++) {
      const h = v.heights[i % v.heights.length];
      events.push([400 + i * 900, () => {
        const p = this.ctx.getPlayer();
        this.faceToward(p.cx);
        const y = v.aim ? this.cy - 10 : this.feetY - h;
        const reach = this.facing > 0 ? this.ctx.region.width - this.cx : this.cx;
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(this.facing > 0 ? this.cx : this.cx - reach, y - 14, reach, 28), 550, v.color);
        audio.play('telegraph');
      }]);
      events.push([950 + i * 900, () => {
        const p = this.ctx.getPlayer();
        this.faceToward(p.cx);
        const sx = this.cx + this.facing * 40, sy = v.aim ? this.cy - 10 : this.feetY - h;
        const travel = Math.max(0.25, Math.abs(p.cx - sx) / v.speed);
        const baseVy = v.aim ? Phaser.Math.Clamp((p.cy - sy) / travel, -420, 420) : 0;
        for (let f = 0; f < fan; f++) {
          const spread = (f - (fan - 1) / 2) * 170;
          this.fireProjectile({ x: sx, y: sy, vx: this.facing * v.speed, vy: baseVy + spread, w: v.w, h: v.h, color: v.color, def: ENEMY_ATTACKS[this.k('volley')], burn: v.burn });
        }
        audio.play('whoosh');
        this.ctx.fx.ring(sx, sy, v.color, 6, 60, 250, 4);
      }]);
    }
    this.startCast(events, 950 + (rounds - 1) * 900 + 700, 'pause');
  }

  private startRain(): void {
    const n = this.phase >= 3 ? 5 : 3;
    const events: [number, () => void][] = [];
    const spec = this.spec('rain');
    const xs: number[] = [];
    for (let i = 0; i < n; i++) {
      events.push([i * 280, () => {
        const p = this.ctx.getPlayer();
        const x = Phaser.Math.Clamp(p.cx + (i - (n - 1) / 2) * 190 + (Math.random() - 0.5) * 60, 700, this.ctx.region.width - 120);
        xs[i] = x;
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(x - 60, this.feetY - 380, 120, 380), 900, 0xffb454);
        audio.play('telegraph');
      }]);
      events.push([900 + i * 280, () => {
        const x = xs[i];
        this.addHazard(x, 110, 380, 140, spec, 0x8a5a2b);
        this.ctx.fx.debrisBurst(x, this.feetY - 10, 18);
        this.ctx.fx.shake(0.01, 200);
        audio.play('slam');
      }]);
    }
    this.startCast(events, 900 + (n - 1) * 280 + 700, 'pause');
  }

  private startPillars(): void {
    const n = this.phase === 1 ? 3 : this.phase === 2 ? 4 : 5;
    const events: [number, () => void][] = [];
    const xs: number[] = [];
    const spec = this.spec('pillars', { dps: 5, duration: 2000 });
    const cx0 = this.ctx.getPlayer().cx;
    for (let i = 0; i < n; i++) {
      xs[i] = Phaser.Math.Clamp(cx0 + Math.ceil(i / 2) * 175 * (i % 2 ? 1 : -1), 700, this.ctx.region.width - 100);
      events.push([i * 250, () => {
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(xs[i] - 45, this.feetY - 420, 90, 420), 850, 0xff7a2a);
        audio.play('telegraph');
      }]);
      events.push([850 + i * 250, () => {
        this.addHazard(xs[i], 90, 420, 260, spec, 0xff7a2a);
        this.ctx.fx.ring(xs[i], this.feetY - 10, 0xffd24a, 10, 110, 350, 6);
        this.ctx.fx.debrisBurst(xs[i], this.feetY - 10, 10);
        audio.play('fire');
      }]);
    }
    this.startCast(events, 850 + (n - 1) * 250 + 700, 'pause');
  }

  private startTeleport(): void {
    let tx = this.cx;
    this.startCast([
      [0, () => {
        this.hidden = true;
        audio.play('dash');
        this.ctx.fx.ring(this.cx, this.cy, 0xfff2a0, 10, 120, 300, 5);
        this.ctx.fx.dustPuff(this.cx, this.feetY, 8);
      }],
      [550, () => {
        const p = this.ctx.getPlayer();
        tx = Phaser.Math.Clamp(p.cx - p.facing * 150, 700, this.ctx.region.width - 100);
        this.ctx.fx.warn(new Phaser.Geom.Rectangle(tx - 110, this.feetY - 140, 220, 140), 520);
        this.ctx.fx.text(tx, this.feetY - 160, '!!', '#ff3030', 36, 520);
        audio.play('telegraph');
      }],
      [1070, () => {
        this.arcade.reset(tx, this.arcade.center.y);
        this.arcade.setVelocity(0, 0);
        this.hidden = false;
        this.faceToward(this.ctx.getPlayer().cx);
        this.ctx.fx.ring(tx, this.cy, 0xff7a2a, 10, 150, 300, 6);
        this.setMode('combo');
        this.launchAttack(this.k('strike'));
      }],
    ], 1200, 'pause');
  }

  private addHazard(x: number, w: number, h: number, life: number, spec: HitSpec, color: number, extra: Partial<Hazard> = {}): void {
    this.hazards.push({ x, w, top: this.feetY - h, h, life, spec, hits: new Set(), color, vx: 0, vy: 0, shape: 'column', ...extra });
  }

  /* ------------------------------------------------------------------ pack-scripted moves */

  /** Runs a pack's move script. The script only schedules events; this class owns timing, hits and cleanup. */
  private startMove(move: BossMove): void {
    const plan = move(this.moveApi());
    this.startCast(plan.events, plan.dur, plan.end ?? 'pause');
    this.plan = plan;
  }

  private moveApi(): BossApi {
    if (this.api) return this.api;
    const self = this;
    const player = this.ctx.getPlayer();
    this.api = {
      scene: this.ctx.scene, fx: this.ctx.fx,
      get phase() { return self.phase; },
      boss: { get cx() { return self.cx; }, get cy() { return self.cy; }, get feetY() { return self.feetY; }, get facing() { return self.facing; } },
      player: { get cx() { return player.cx; }, get cy() { return player.cy; }, get feetY() { return player.feetY; }, get facing() { return player.facing; } },
      region: { width: this.ctx.region.width, groundY: this.ctx.region.groundY, barrierX: this.ctx.region.boss?.barrierX ?? 590 },
      spec: (name, burn) => this.spec(name, burn),
      rect: (x, y, w, h) => new Phaser.Geom.Rectangle(x, y, w, h),
      warn: (rect, ms, color) => this.ctx.fx.warn(rect, ms, color),
      hazard: (o: HazardOpts) => this.addHazard(o.x, o.w, o.h, o.life, this.spec(o.attack, o.burn), o.color, { top: o.top ?? this.feetY - o.h, vx: o.vx ?? 0, vy: o.vy ?? 0, shape: o.shape ?? 'column' }),
      projectile: (o: ProjectileSpec) => this.fireProjectile({ x: o.x, y: o.y, vx: o.vx, vy: o.vy, ay: o.ay, w: o.w, h: o.h, life: o.life, color: o.color, def: ENEMY_ATTACKS[this.k(o.attack)], burn: o.burn }),
      field: (ms, fn) => { this.fields.push({ life: ms, fn }); },
      nudgePlayer: (dx) => { const p = this.ctx.getPlayer(); if (p.alive) p.arcade.position.x += dx; },
      hide: (v) => { this.hidden = v; },
      moveTo: (x, y) => { this.arcade.reset(Phaser.Math.Clamp(x, 120, this.ctx.region.width - 100), y ?? this.arcade.center.y); this.arcade.setVelocity(0, 0); },
      face: () => this.faceToward(this.ctx.getPlayer().cx),
      strike: (name) => { this.setMode('combo'); this.launchAttack(this.k(name)); },
      summon: (kind, x) => { this.ctx.spawnEnemy(kind, Phaser.Math.Clamp(x, (this.ctx.region.boss?.barrierX ?? 590) + 120, this.ctx.region.width - 140), this.feetY, 120); },
      rand: () => Math.random(),
      sfx: (name) => audio.play(name as never),
    };
    return this.api;
  }

  /* ------------------------------------------------------------------ jumps and charges */

  private startCharge(): void {
    this.setMode('charge_run');
    const def = ENEMY_ATTACKS[this.k('charge')];
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
    const rect = new Phaser.Geom.Rectangle(this.cx - 150, this.feetY - 100, 300, 110);
    this.ctx.combat.hitRect(this, rect, this.spec('leap'), new Set(), this.cx);
    this.slamEffects(true);
    this.spawnWave(this.cx, -1);
    this.spawnWave(this.cx, 1);
    this.exhaust();
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
    const kinds = this.bd.summon!.kinds;
    const px = this.ctx.getPlayer().cx;
    const lo = this.ctx.region.boss ? this.ctx.region.boss.barrierX + 120 : 200, hi = this.ctx.region.width - 140;
    kinds.forEach((kind, i) => {
      const x = Phaser.Math.Clamp(px + (i % 2 ? 520 : -520), lo, hi);
      this.ctx.spawnEnemy(kind, x, this.feetY, 120);
    });
    this.ctx.fx.text(this.cx, this.cy - 150, t('REINFORCEMENTS!'), '#ff7a5c', 24, 1400);
  }

  /* ------------------------------------------------------------------ attack hooks */

  protected override onAttackPhase(phase: AttackPhase): void {
    const def = this.runner.def;
    if (!def) return;
    const base = def.id.slice(this.bd.prefix.length + 1);
    if (phase === 'active') {
      if (base === 'slam') {
        this.slamEffects(false);
        this.spawnWave(this.cx + this.facing * 150, this.facing);
        if (this.phase >= 2) this.spawnWave(this.cx - this.facing * 150, (-this.facing) as -1 | 1);
      } else if (base.startsWith('swing')) {
        this.arcade.setVelocityX(this.facing * 160);
        audio.play('heavy');
      } else if (base.startsWith('strike')) {
        this.slamEffects(false);
      }
    } else if (phase === 'startup' && base.startsWith('swing') && base !== 'swing1') {
      this.faceToward(this.ctx.getPlayer().cx);
    } else if (phase === 'idle' && this.mode !== 'charge_run') {
      if (def.chain && this.mode === 'combo') { this.launchAttack(def.chain); return; }
      if (base === 'slam') this.exhaust();
      else { this.sm.transition('Recover'); this.setMode('pause'); }
    }
  }

  /* ------------------------------------------------------------------ shockwaves and hazards */

  private spawnWave(x: number, dir: -1 | 1): void {
    this.waves.push({ x, dir, life: 1500, hits: new Set() });
  }

  private updateFx(dt: number): void {
    const g = this.waveG;
    g.clear();
    const au = this.bd.aura;
    if (au && this.alive && !this.hidden && this.mode !== 'dormant') {
      const pulse = Math.sin(this.ctx.clock.now / 260);
      g.fillStyle(au.color, 0.07 + 0.03 * pulse).fillCircle(this.cx, this.cy - 10, au.r * (1 + 0.05 * pulse));
      g.fillStyle(au.color, 0.06).fillCircle(this.cx, this.cy - 10, au.r * 0.6);
    }
    const spec = this.spec('wave');
    const floor = this.feetY;
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life -= dt;
      w.x += w.dir * 340 * (dt / 1000);
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
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt;
      if (h.life <= 0) { this.hazards.splice(i, 1); continue; }
      h.x += h.vx * (dt / 1000);
      h.top += h.vy * (dt / 1000);
      hazRect.setTo(h.x - h.w / 2, h.top, h.w, h.h);
      this.ctx.combat.hitRect(this, hazRect, h.spec, h.hits, h.x);
      const k = Math.min(1, h.life / 120);
      if (h.shape === 'orb') {
        const cy = h.top + h.h / 2;
        g.fillStyle(h.color, 0.3 * k).fillCircle(h.x, cy, h.w * 0.85);
        g.fillStyle(h.color, 0.9 * k).fillEllipse(h.x, cy, h.w, h.h);
        g.fillStyle(0xffffff, 0.7 * k).fillEllipse(h.x, cy, h.w * 0.4, h.h * 0.4);
      } else if (h.shape === 'beam') {
        g.fillStyle(h.color, 0.35 * k).fillRect(h.x - h.w / 2, h.top - 4, h.w, h.h + 8);
        g.fillStyle(h.color, 0.9 * k).fillRect(h.x - h.w / 2, h.top, h.w, h.h);
        g.fillStyle(0xffffff, 0.85 * k).fillRect(h.x - h.w / 2, h.top + h.h * 0.35, h.w, h.h * 0.3);
      } else {
        g.fillStyle(h.color, 0.8 * k).fillRect(h.x - h.w / 2, h.top, h.w, h.h);
        g.fillStyle(0xffffff, 0.5 * k).fillRect(h.x - h.w / 5, h.top, h.w / 2.5, h.h);
      }
    }
    for (let i = this.fields.length - 1; i >= 0; i--) {
      const f = this.fields[i];
      f.life -= dt;
      if (f.life <= 0) { this.fields.splice(i, 1); continue; }
      f.fn(dt);
    }
  }

  /* ------------------------------------------------------------------ damage */

  override receiveHit(spec: HitSpec, attacker: Fighter, fromX: number): HitResult {
    if (this.invulnerable) return { outcome: 'ignored', damage: 0, dir: 1 };
    return super.receiveHit(spec, attacker, fromX);
  }

  protected override onDamaged(): void {
    const ratio = this.health / this.maxHealth;
    const [t1, t2] = this.bd.phaseThresholds;
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
      this.ctx.fx.text(this.cx, this.cy - 150, t(next === 2 ? 'ENRAGED!' : 'FURY!'), '#ff4040', 30, 1400);
    }
  }

  protected override die(): void {
    super.die();
    this.mode = 'dead';
    this.hidden = false;
    this.waves.length = 0;
    this.hazards.length = 0;
    this.fields.length = 0;
    this.projectiles.length = 0;
    this.waveG.clear();
    this.ctx.clock.slowmo(0.25, 1800);
    this.ctx.fx.shake(0.02, 900);
    this.ctx.fx.ring(this.cx, this.cy, 0xffd24a, 20, 500, 900, 10);
    bus.emit('boss:update', null);
    bus.emit('banner', { title: t('VICTORY'), subtitle: t('{name} defeated', { name: t(this.bd.name) }) });
    this.ctx.scene.time.delayedCall(3200, () => bus.emit('banner', null));
    this.onDefeated?.();
  }

  protected override rewards(): void {
    const d = this.bd;
    session.gainXp(d.xp, d.name);
    // A boss pays its gold as a burst of physical coins and its weapon through the one-time claim ledger.
    this.ctx.dropCoins(d.gold, this.cx, this.feetY - 40, 16);
    session.claimBossWeapon(d.id);
    session.giveItem(d.drop);
    session.profile.stats.kills += 1;
    if (!session.profile.defeatedBosses.includes(d.id)) session.profile.defeatedBosses.push(d.id);
    session.questEvent({ type: 'boss', target: d.id });
    session.profile.flags[`${d.id}_defeated`] = true;
    void session.autoSave(true);
  }

  override update(dt: number): void {
    super.update(dt);
    if (!this.alive) this.removed = false; // the corpse stays for the arena; the scene cleans it on exit
  }

  /* ------------------------------------------------------------------ visuals */

  protected override draw(dt: number): void {
    this.rig.alpha = this.hidden ? 0 : 1;
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
        poseAttack(P, 'boss_charge', 'startup', Math.min(1, this.mt / 700));
        this.rig.glow = { color: 0xff3030, amount: Math.min(1, this.mt / 1200) };
        this.rig.setTint(Math.floor(this.mt / 100) % 2 ? 0xff8a7a : null);
        break;
      }
      case 'charge_run': poseAttack(P, 'boss_charge', 'active', 1); rate = 40; break;
      case 'leap_tel': poseLand(P, 0.5); P.fU = 1.3; P.gU = -1.0; this.rig.glow = { color: 0xff3030, amount: this.mt / 900 }; rate = 30; break;
      case 'leap_air': if (a.velocity.y < 0) poseJump(P, a.velocity.y); else poseFall(P, a.velocity.y); break;
      case 'exhausted': poseStun(P, this.mt / 1000 * 2); P.lean = 0.35; P.drop = 6; break;
      case 'cast':
        poseAttack(P, this.plan?.pose ?? 'slam', 'startup', 1);
        P.lean = -0.2 + Math.sin(this.mt / 70) * 0.04;
        this.rig.glow = { color: this.plan?.glow ?? this.bd.volley?.color ?? 0xff7a2a, amount: 0.6 };
        rate = 25;
        break;
      case 'whirl_tel':
        poseAttack(P, 'heavy', 'startup', Math.min(1, this.mt / 700));
        this.rig.glow = { color: 0xff3030, amount: Math.min(1, this.mt / 700) };
        break;
      case 'whirl':
        poseAttack(P, 'heavy', 'active', 1);
        this.facing = Math.floor(this.mt / 110) % 2 ? 1 : -1; // visual spin
        this.rig.glow = { color: 0xff7a2a, amount: 0.8 };
        rate = 50;
        break;
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
