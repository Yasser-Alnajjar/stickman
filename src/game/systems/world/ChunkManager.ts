import Phaser from 'phaser';
import { CHUNK_WIDTH, DEPTH } from '@/shared/constants';
import type { DecorDef, OneWayDef, RegionDef, SolidDef } from '@/game/config/regions';
import { t as tr } from '@/i18n';
import type { DrawCtx, WorldTheme } from '@/game/world/types';
import { themeOf } from '@/game/world/themes';
import { session } from '@/game/managers/session';

interface ChunkData { solids: SolidDef[]; oneWays: OneWayDef[]; decor: DecorDef[] }
interface Loaded { gfx: Phaser.GameObjects.GameObject[]; bodies: Phaser.GameObjects.Rectangle[] }

/**
 * Streams world geometry by horizontal chunk: only chunks near the camera have Graphics + physics bodies.
 * Everything else is pure data, so memory stays flat regardless of region length.
 */
export class ChunkManager {
  private readonly chunks = new Map<number, ChunkData>();
  private readonly loaded = new Map<number, Loaded>();
  readonly solidGroup: Phaser.Physics.Arcade.StaticGroup;
  readonly oneWayGroup: Phaser.Physics.Arcade.StaticGroup;
  private readonly theme: WorldTheme;
  /** Small regions (boss arenas) keep every chunk resident so wide scenery never pops in. */
  private readonly resident: boolean;
  private readonly gateBodies = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly margin = 700;

  constructor(private readonly scene: Phaser.Scene, region: RegionDef) {
    this.theme = themeOf(region.theme);
    this.resident = region.width <= CHUNK_WIDTH * 2.5;
    this.solidGroup = scene.physics.add.staticGroup();
    this.oneWayGroup = scene.physics.add.staticGroup();
    const chunkOf = (x: number, w: number): number => Math.floor((x + w / 2) / CHUNK_WIDTH);
    const get = (i: number): ChunkData => {
      let c = this.chunks.get(i);
      if (!c) this.chunks.set(i, (c = { solids: [], oneWays: [], decor: [] }));
      return c;
    };
    for (const s of region.solids) {
      if (s.openFlag && session.profile.flags[s.openFlag]) continue;
      get(chunkOf(s.x, s.w)).solids.push(s);
    }
    for (const o of region.oneWays) get(chunkOf(o.x, o.w)).oneWays.push(o);
    for (const d of region.decor) get(chunkOf(d.x, d.w)).decor.push(d);
  }

  get loadedCount(): number { return this.loaded.size; }

  /** Whether physics bodies exist for the chunk containing world x. */
  isLoadedAt(x: number): boolean { return this.loaded.has(Math.floor(x / CHUNK_WIDTH)); }

  /** Loads/unloads chunks around the camera view. Cheap enough to call a few times per second. */
  update(left: number, right: number): void {
    const m = this.resident ? 5000 : this.margin;
    const first = Math.floor((left - m) / CHUNK_WIDTH);
    const last = Math.floor((right + m) / CHUNK_WIDTH);
    for (let i = first; i <= last; i++) if (this.chunks.has(i) && !this.loaded.has(i)) this.load(i);
    for (const i of [...this.loaded.keys()]) if (i < first || i > last) this.unload(i);
  }

  private load(i: number): void {
    const data = this.chunks.get(i)!;
    const rec: Loaded = { gfx: [], bodies: [] };
    const back = this.scene.add.graphics().setDepth(DEPTH.decor);
    const front = this.scene.add.graphics().setDepth(DEPTH.solids);
    const fore = this.scene.add.graphics().setDepth(DEPTH.foreground - 6);
    rec.gfx.push(back, front, fore);
    const ctx = this.textFor(rec);
    for (const d of data.decor) this.theme.drawDecor(d.layer === 'front' ? fore : back, d, ctx);
    for (const s of data.solids) {
      this.theme.drawSolid(front, s, ctx);
      const pad = s.kind === 'ground' ? 8 : 0;
      const r = this.scene.add.rectangle(s.x - pad + (s.w + pad * 2) / 2, s.y + s.h / 2, s.w + pad * 2, s.h, 0, 0);
      this.scene.physics.add.existing(r, true);
      this.solidGroup.add(r);
      rec.bodies.push(r);
      if (s.kind === 'gate') this.gateBodies.set(s.id, r);
    }
    for (const o of data.oneWays) {
      this.theme.drawLedge(front, o);
      // 32px thick (visual is thinner): max fall speed is ~18px per physics step, so a thin body could be tunnelled through.
      const r = this.scene.add.rectangle(o.x + o.w / 2, o.y + 16, o.w, 32, 0, 0);
      this.scene.physics.add.existing(r, true);
      const b = r.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false;
      this.oneWayGroup.add(r);
      rec.bodies.push(r);
    }
    this.loaded.set(i, rec);
  }

  private unload(i: number): void {
    const rec = this.loaded.get(i);
    if (!rec) return;
    rec.gfx.forEach((g) => g.destroy());
    rec.bodies.forEach((b) => { this.solidGroup.remove(b, true, true); this.oneWayGroup.remove(b, true, true); });
    this.loaded.delete(i);
  }

  /** Removes a solid immediately (e.g. the gate when its quest completes) and rebuilds only its chunk. */
  openGate(id: string): boolean {
    for (const [index, c] of this.chunks) {
      if (!c.solids.some((s) => s.id === id)) continue;
      c.solids = c.solids.filter((s) => s.id !== id);
      this.gateBodies.delete(id);
      // Unload + load within the same frame: no physics step runs in between, so nothing falls through.
      if (this.loaded.has(index)) { this.unload(index); this.load(index); }
      return true;
    }
    return false;
  }

  /** Scene shutdown destroys every game object and physics group itself; only drop our references. */
  destroy(): void {
    this.loaded.clear();
    this.chunks.clear();
    this.gateBodies.clear();
  }

  /* ------------------------------------------------------------------ drawing */

  private textFor(rec: Loaded): DrawCtx {
    return {
      text: (d, color, size) => {
        if (!d.text) return;
        const t = this.scene.add.text(d.x + d.w / 2, d.y + d.h / 2, tr(d.text), {
          fontFamily: 'system-ui, sans-serif', fontSize: `${size ?? Math.max(14, Math.floor(d.h * 0.62))}px`, fontStyle: '800',
          color: `#${color.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5).setDepth(DEPTH.decor + 1);
        rec.gfx.push(t);
      },
    };
  }
}
