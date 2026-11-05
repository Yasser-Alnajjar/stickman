import type Phaser from 'phaser';
import type { AttackDef, HitSpec } from '@/shared/types';
import type { Fx } from '@/game/managers/Fx';

/**
 * The toolbox a pack's boss move script gets. Scripts only describe *what happens when*; the Boss class owns
 * movement, telegraph timing, hit detection and cleanup, so a script cannot leak objects or outlive its fight.
 */
export interface BossApi {
  readonly scene: Phaser.Scene;
  readonly fx: Fx;
  /** 1..3 */
  readonly phase: number;
  readonly boss: { cx: number; cy: number; feetY: number; facing: 1 | -1 };
  readonly player: { cx: number; cy: number; feetY: number; facing: 1 | -1 };
  readonly region: { width: number; groundY: number; barrierX: number };
  /** The attack spec of one of this boss's own attacks (`<prefix>_<name>`). */
  spec(name: string, burn?: HitSpec['burn']): HitSpec;
  /** A rectangle for telegraphs (moves never import Phaser themselves, so they stay loadable under test). */
  rect(x: number, y: number, w: number, h: number): Phaser.Geom.Rectangle;
  /** A red (or tinted) floor/air telegraph. */
  warn(rect: Phaser.Geom.Rectangle, ms: number, color?: number): void;
  /** Timed damage zone. `top` defaults to standing on the floor. `vx/vy` make it move. */
  hazard(o: HazardOpts): void;
  /** A projectile owned by the boss. */
  projectile(o: ProjectileSpec): void;
  /** Run `fn` every frame for `ms` (gravity wells, gales, darkness...). */
  field(ms: number, fn: (dtMs: number) => void): void;
  /** Carries the player sideways this frame (gales, gravity wells). Walls still stop them. */
  nudgePlayer(dxPx: number): void;
  /** Make the boss vanish / reappear and move instantly. */
  hide(v: boolean): void;
  moveTo(x: number, y?: number): void;
  face(): void;
  /** Launch one of the boss's own melee attacks right now (returns control through the attack's normal flow). */
  strike(name: string): void;
  /** Call in reinforcements near the player. */
  summon(kind: string, x: number): void;
  rand(): number;
  sfx(name: string): void;
}

export interface HazardOpts {
  x: number; w: number; h: number; life: number; attack: string; color: number;
  top?: number; vx?: number; vy?: number;
  /** Visual: filled column (default), glowing orb, or a ring pulse. */
  shape?: 'column' | 'orb' | 'beam';
  burn?: HitSpec['burn'];
}

export interface ProjectileSpec {
  x: number; y: number; vx: number; vy?: number; ay?: number; w?: number; h?: number; life?: number;
  color: number; attack: string; burn?: HitSpec['burn'];
}

/** What a move produces: timed events, a total duration and how the boss ends up afterwards. */
export interface MovePlan {
  events: [number, () => void][];
  dur: number;
  end?: 'pause' | 'exhausted';
  /** Rig glow colour while casting. */
  glow?: number;
  /** Casting pose (default 'slam' wind-up). */
  pose?: 'slam' | 'heavy' | 'punch1';
}

export type BossMove = (api: BossApi) => MovePlan;

export type { AttackDef };
