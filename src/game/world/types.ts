import type Phaser from 'phaser';
import type { DecorDef, OneWayDef, RegionDef, SolidDef } from '@/game/config/regions';

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

export interface BossStagecraft {
  /** Called the instant the boss fight is triggered (shutters, lights, eruptions...). */
  onStart?(scene: Phaser.Scene, region: RegionDef): void;
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

/** A self-contained world: its themes and the regions (city + arena) that use them. */
export interface WorldPack {
  id: string;
  themes: WorldTheme[];
  regions: RegionDef[];
}
