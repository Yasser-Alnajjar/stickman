import type Phaser from 'phaser';
import type { DecorDef, OneWayDef, RegionDef, SolidDef } from '@/game/config/regions';
import type { AttackDef, MusicTrack, QuestDef } from '@/shared/types';
import type { BossDef, EnemyDef } from '@/game/config/enemies';
import type { ItemDef } from '@/game/config/items';
import type { BossMove } from '@/game/config/boss-moves';
import type { AccessorySpec } from '@/game/animations/accessories';
import type { Fx } from '@/game/managers/Fx';

/** Identifier of a visual theme. One per city and one per boss arena; add a new string when you add a world. */
export type ThemeId = string;

/** Helpers a theme gets while drawing static (per-chunk) geometry. */
export interface DrawCtx {
  /** Adds a (localised) text label that is destroyed together with the chunk. */
  text(d: DecorDef, color: number, size?: number): void;
}

/** Screen-space frame for parallax props painted behind the world scene. */
export interface BackdropFrame {
  w: number; h: number; zoom: number;
  /** World-space centre of the world camera. */
  midX: number; midY: number;
  /** Seconds. */
  t: number;
  /** Screen x of a point at `lx` on a parallax layer that scrolls at `factor` (same maths as the tile layers). */
  sx(factor: number, lx: number): number;
  /** Screen y of a point `up` px above the bottom of the layer whose base is `base` (fraction of screen height). */
  sy(factor: number, base: number, up: number): number;
}

export interface BackdropArt {
  /** Seamlessly tiling canvas painters. `far` scrolls slowest; `near` (optional) is sparse and fastest. */
  far: { w: number; h: number; draw: (c: CanvasRenderingContext2D, w: number, h: number) => void };
  mid: { w: number; h: number; draw: (c: CanvasRenderingContext2D, w: number, h: number) => void };
  near?: { w: number; h: number; draw: (c: CanvasRenderingContext2D, w: number, h: number) => void };
  /** Sky gradient, top to bottom. */
  sky: [number, string][];
}

/** A decor kind that is repainted every frame (spinning gears, fire, cranes...). Only drawn while on screen. */
export interface AnimatedDecor {
  layer: 'back' | 'front';
  /** Rough half-extent used to cull against the camera. Defaults to the decor's own w/h. */
  pad?: number;
  draw(g: Phaser.GameObjects.Graphics, d: DecorDef, t: number): void;
}

export interface AmbientParticles {
  update(dt: number, view: Phaser.Geom.Rectangle, t: number): void;
}

export interface StageContext { scene: Phaser.Scene; region: RegionDef; fx: Fx }

export interface BossStagecraft {
  /** Called the instant the boss fight is triggered (shutters, lights, eruptions...). */
  onStart?(c: StageContext): void;
  /** Paints the energy/heat seal that drops behind the player. */
  drawBarrier?(g: Phaser.GameObjects.Graphics, x: number, h: number): void;
  /** Camera flash colour used on engage. */
  flash?: [number, number, number];
}

export interface WorldTheme {
  id: ThemeId;
  backdrop: BackdropArt;
  /** Painted behind the world, parallax aware, repainted each frame. */
  backdropFx?(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void;
  drawSolid(g: Phaser.GameObjects.Graphics, s: SolidDef, ctx: DrawCtx): void;
  drawLedge(g: Phaser.GameObjects.Graphics, o: OneWayDef): void;
  /** Static decor. `front` decor is painted over the actors on a separate graphics object. */
  drawDecor(g: Phaser.GameObjects.Graphics, d: DecorDef, ctx: DrawCtx): void;
  animated?: Record<string, AnimatedDecor>;
  /** Weather/particles in the world (rain, embers, sea spray...). */
  ambient?(scene: Phaser.Scene, region: RegionDef): AmbientParticles;
  /** Animated strip painted behind the ground (water, lava) and visible through gaps in the deck. */
  bed?: { top: number; draw(g: Phaser.GameObjects.Graphics, x0: number, x1: number, t: number): void };
  stage?: BossStagecraft;
  /** Colour of the `ground` top edge etc. exposed for minimap-like uses. */
  accent: number;
}

/**
 * The heavy, lazily loaded half of a world: painters and level geometry. Everything in here is built only when the
 * player is about to enter the world (see world/loader.ts) and dropped again when it is no longer adjacent.
 */
export interface WorldPackContent {
  /** The city theme and the arena theme (painters are code, so they live here, not in the manifest). */
  themes: WorldTheme[];
  /** Builds the city and the boss arena. Called once per load; the result is what gets evicted. */
  buildRegions(): [city: RegionDef, arena: RegionDef];
  /** Scripts for the boss's custom patterns (names referenced by the manifest's boss `patterns`). */
  moves?: Record<string, BossMove>;
}

/** Boss melee attack set: scaled clones of the shared baseline plus whatever only this boss does. */
export interface BossAttackSet {
  /** Damage multiplier on the shared baseline set (the Warden's `boss_*` attacks). */
  scale: number;
  /** Tweaks applied to individual baseline attacks (`swing1`, `slam`, `charge`...). */
  tune?: Record<string, Partial<AttackDef>>;
  /** Attacks only this boss uses (hitbox attacks and projectile/hazard damage specs alike). */
  extras: Record<string, Partial<AttackDef>>;
}

/**
 * Everything the game must know about a world *without* loading it: identity, order, the boss, enemies, items,
 * quests, localisation. Data only, so the manifest of every world can stay in the first bundle.
 *
 * To add a world: write `worlds/<id>/manifest.ts` and `worlds/<id>/content.ts`, then append the manifest to
 * `worlds/index.ts`. Nothing else (and no earlier world) changes: exits, unlocks and the campaign map follow from order.
 */
export interface WorldPackMeta {
  id: string;
  /** English name; also the city region's name. */
  name: string;
  description: string;
  /** Banner subtitle when entering the city. */
  tagline: string;
  /** Short caps label painted on the door that leads *into* this world. */
  doorLabel: string;
  cityRegion: string;
  arenaRegion: string;
  cityTheme: string;
  arenaTheme: string;
  music?: { city: MusicTrack; boss: MusicTrack };
  /** Enemy kinds introduced by this world (ids must be unique across the game). */
  enemies?: Record<string, EnemyDef>;
  /** Attack definitions used by this world's enemies. */
  enemyAttacks?: Record<string, AttackDef>;
  boss: BossDef;
  bossAttacks?: BossAttackSet;
  items?: ItemDef[];
  /** In story order. */
  quests?: QuestDef[];
  /** Data-only rig accessories (fighter silhouettes) for this world's enemies and boss. */
  accessories?: Record<string, AccessorySpec>;
  /** Arabic translations for every English string this world introduces. */
  text?: Record<string, string>;
  /** Loads the heavy half. Must be a dynamic import so it ends up in its own chunk. */
  load(): Promise<WorldPackContent>;
}
