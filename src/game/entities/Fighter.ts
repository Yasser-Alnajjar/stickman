import Phaser from 'phaser';
import type { Facing, HitSpec, Team } from '@/shared/types';
import { StickmanRig, type RigStyle } from '@/game/animations/StickmanRig';
import { AttackRunner } from '@/game/systems/combat/AttackRunner';
import type { HitResult } from '@/game/systems/combat/CombatSystem';
import type { WorldContext } from '@/game/systems/world/context';

/** Common base for every combatant: physics body, rig, health, burn, hurtbox. */
export abstract class Fighter {
  private static counter = 1;
  readonly id = Fighter.counter++;
  abstract readonly team: Team;
  readonly body: Phaser.GameObjects.Rectangle;
  readonly arcade: Phaser.Physics.Arcade.Body;
  readonly rig: StickmanRig;
  readonly runner = new AttackRunner();
  facing: Facing = 1;
  maxHealth = 100;
  health = 100;
  attackStat = 10;
  defenseStat = 0;
  alive = true;
  protected burn: { dps: number; left: number; acc: number } | null = null;

  constructor(
    protected readonly ctx: WorldContext,
    x: number,
    feetY: number,
    readonly w: number,
    readonly h: number,
    style: RigStyle,
    depth: number,
  ) {
    this.body = ctx.scene.add.rectangle(x, feetY - h / 2, w, h, 0xff00ff, 0);
    ctx.scene.physics.add.existing(this.body);
    this.arcade = this.body.body as Phaser.Physics.Arcade.Body;
    this.arcade.setCollideWorldBounds(true);
    this.arcade.setMaxVelocity(1600, 1400);
    ctx.actors.add(this.body);
    this.rig = new StickmanRig(ctx.scene, style, depth);
    ctx.combat.register(this);
  }

  get cx(): number { return this.arcade.center.x; }
  get cy(): number { return this.arcade.center.y; }
  get feetY(): number { return this.arcade.bottom; }
  get grounded(): boolean { return this.arcade.blocked.down || this.arcade.touching.down; }

  hurtbox(out: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    return out.setTo(this.arcade.x, this.arcade.y, this.arcade.width, this.arcade.height);
  }

  abstract update(dt: number): void;
  abstract receiveHit(spec: HitSpec, attacker: Fighter, fromX: number): HitResult;
  /** Called on the attacker after it successfully hits something. */
  onHitLanded(_target: Fighter, _spec: HitSpec, _res: HitResult): void { /* optional */ }
  /** True when weapon stagger must not apply (bosses, enemies mid-super-armour). */
  staggerImmune(): boolean { return false; }
  /** Stagger caused by perfect blocks / guard breaks. */
  stun(_ms: number): void { /* optional */ }

  applyBurn(dps: number, durationMs: number): void {
    this.burn = { dps, left: durationMs, acc: 0 };
  }

  /** Returns burn damage dealt this tick (integer), applying health loss. */
  protected tickBurn(dt: number): number {
    const b = this.burn;
    if (!b || !this.alive) return 0;
    b.left -= dt;
    b.acc += (b.dps * dt) / 1000;
    if (Math.random() < 0.35) this.ctx.fx.fireTick(this.cx, this.cy - this.h * 0.2 + (Math.random() - 0.5) * this.h * 0.6);
    let dealt = 0;
    if (b.acc >= 1) {
      dealt = Math.floor(b.acc);
      b.acc -= dealt;
      this.health = Math.max(0, this.health - dealt);
      this.ctx.fx.text(this.cx, this.cy - this.h * 0.6, String(dealt), '#ff9a3a', 16, 500);
    }
    if (b.left <= 0) this.burn = null;
    return dealt;
  }

  protected faceToward(x: number): void {
    this.facing = x >= this.cx ? 1 : -1;
  }

  destroy(): void {
    this.ctx.combat.unregister(this);
    this.rig.destroy();
    this.body.destroy();
  }
}
