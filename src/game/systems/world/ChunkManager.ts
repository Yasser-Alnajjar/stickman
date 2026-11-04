import Phaser from 'phaser';
import { CHUNK_WIDTH, DEPTH } from '@/shared/constants';
import type { DecorDef, OneWayDef, RegionDef, SolidDef } from '@/game/config/regions';
import { t as tr } from '@/i18n';
import { session } from '@/game/managers/session';

interface ChunkData { solids: SolidDef[]; oneWays: OneWayDef[]; decor: DecorDef[] }
interface Loaded { gfx: Phaser.GameObjects.GameObject[]; bodies: Phaser.GameObjects.Rectangle[] }

const hash = (n: number): number => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Streams world geometry by horizontal chunk: only chunks near the camera have Graphics + physics bodies.
 * Everything else is pure data, so memory stays flat regardless of region length.
 */
export class ChunkManager {
  private readonly chunks = new Map<number, ChunkData>();
  private readonly loaded = new Map<number, Loaded>();
  readonly solidGroup: Phaser.Physics.Arcade.StaticGroup;
  readonly oneWayGroup: Phaser.Physics.Arcade.StaticGroup;
  private readonly theme: RegionDef['theme'];
  private readonly gateBodies = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly margin = 700;

  constructor(private readonly scene: Phaser.Scene, region: RegionDef) {
    this.theme = region.theme;
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
    const first = Math.floor((left - this.margin) / CHUNK_WIDTH);
    const last = Math.floor((right + this.margin) / CHUNK_WIDTH);
    for (let i = first; i <= last; i++) if (this.chunks.has(i) && !this.loaded.has(i)) this.load(i);
    for (const i of [...this.loaded.keys()]) if (i < first || i > last) this.unload(i);
  }

  private load(i: number): void {
    const data = this.chunks.get(i)!;
    const rec: Loaded = { gfx: [], bodies: [] };
    const back = this.scene.add.graphics().setDepth(DEPTH.decor);
    const front = this.scene.add.graphics().setDepth(DEPTH.solids);
    rec.gfx.push(back, front);
    for (const d of data.decor) this.drawDecor(back, d, rec);
    for (const s of data.solids) {
      this.drawSolid(front, s);
      const pad = s.kind === 'ground' ? 8 : 0;
      const r = this.scene.add.rectangle(s.x - pad + (s.w + pad * 2) / 2, s.y + s.h / 2, s.w + pad * 2, s.h, 0, 0);
      this.scene.physics.add.existing(r, true);
      this.solidGroup.add(r);
      rec.bodies.push(r);
      if (s.kind === 'gate') this.gateBodies.set(s.id, r);
    }
    for (const o of data.oneWays) {
      this.drawLedge(front, o);
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

  private pal(): { wallA: number; wallB: number; window: number; windowOff: number; roof: number; ground: number; curb: number; accent: number } {
    return this.theme === 'arena'
      ? { wallA: 0x241a2b, wallB: 0x2f2038, window: 0xff7a3a, windowOff: 0x1a1320, roof: 0x4a3552, ground: 0x2a1f30, curb: 0x6a4a5a, accent: 0xff5a3a }
      : { wallA: 0x151a33, wallB: 0x1d2347, window: 0xffd36b, windowOff: 0x0f1328, roof: 0x3a4272, ground: 0x1a1f3d, curb: 0x4a5490, accent: 0x5cf0ff };
  }

  private drawSolid(g: Phaser.GameObjects.Graphics, s: SolidDef): void {
    const P = this.pal();
    switch (s.kind) {
      case 'ground': {
        g.fillStyle(P.ground, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(P.curb, 1).fillRect(s.x, s.y, s.w, 10);
        g.fillStyle(0x000000, 0.25).fillRect(s.x, s.y + 10, s.w, 6);
        g.fillStyle(0xffffff, 0.12);
        for (let x = s.x + 20; x < s.x + s.w; x += 140) g.fillRect(x, s.y + 52, 70, 6);
        g.lineStyle(2, P.curb, 0.35);
        for (let x = s.x; x < s.x + s.w; x += 200) g.lineBetween(x, s.y + 10, x, s.y + s.h);
        break;
      }
      case 'roof': {
        g.fillStyle(P.roof, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0xffffff, 0.18).fillRect(s.x, s.y, s.w, 4);
        g.fillStyle(0x000000, 0.3).fillRect(s.x, s.y + s.h - 6, s.w, 6);
        break;
      }
      case 'crate': {
        g.fillStyle(0x6b4a2b, 1).fillRect(s.x, s.y, s.w, s.h);
        g.lineStyle(4, 0x3d2a17, 1).strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
        for (let y = s.y; y < s.y + s.h - 4; y += 70) {
          g.lineBetween(s.x + 4, y + 4, s.x + s.w - 4, Math.min(y + 66, s.y + s.h - 4));
          g.lineBetween(s.x + s.w - 4, y + 4, s.x + 4, Math.min(y + 66, s.y + s.h - 4));
        }
        g.fillStyle(0xffffff, 0.15).fillRect(s.x, s.y, s.w, 4);
        break;
      }
      case 'wall': {
        g.fillStyle(P.wallB, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(P.accent, 0.4).fillRect(s.x, s.y, 4, s.h);
        break;
      }
      case 'gate': {
        g.fillStyle(0x3b3f55, 1).fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0xffd24a, 1);
        for (let y = s.y; y < s.y + s.h; y += 40) g.fillTriangle(s.x, y + 20, s.x + s.w, y, s.x + s.w, y + 20);
        g.fillStyle(0x000000, 0.4).fillRect(s.x, s.y, 5, s.h);
        g.lineStyle(3, 0xff3b3b, 0.9).strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
        break;
      }
    }
  }

  private drawLedge(g: Phaser.GameObjects.Graphics, o: OneWayDef): void {
    const P = this.pal();
    g.fillStyle(0x59627f, 1).fillRect(o.x, o.y, o.w, 8);
    g.fillStyle(P.accent, 0.8).fillRect(o.x, o.y, o.w, 2);
    g.lineStyle(3, 0x39405c, 1);
    for (let x = o.x + 14; x < o.x + o.w - 6; x += 46) g.lineBetween(x, o.y + 8, x - 10, o.y + 26);
    g.fillStyle(0x39405c, 1).fillRect(o.x, o.y + 8, o.w, 3);
  }

  private drawDecor(g: Phaser.GameObjects.Graphics, d: DecorDef, rec: Loaded): void {
    const P = this.pal();
    switch (d.kind) {
      case 'building': {
        const shade = hash(d.seed);
        g.fillStyle(shade > 0.5 ? P.wallA : P.wallB, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x000000, 0.25).fillRect(d.x, d.y, d.w, 6);
        g.fillStyle(0xffffff, 0.06).fillRect(d.x, d.y, 4, d.h);
        const cols = Math.max(2, Math.floor(d.w / 46));
        const gap = d.w / cols;
        for (let r = 0, y = d.y + 26; y < d.y + d.h - 40; y += 52, r++) {
          for (let c = 0; c < cols; c++) {
            const on = hash(d.seed + r * 13 + c * 7) > 0.62;
            g.fillStyle(on ? P.window : P.windowOff, on ? 0.85 : 1);
            g.fillRect(d.x + c * gap + gap * 0.22, y, gap * 0.52, 28);
          }
        }
        break;
      }
      case 'lamp': {
        g.fillStyle(0x2a2f4d, 1).fillRect(d.x - 3, d.y - d.h, 6, d.h);
        g.fillRect(d.x - 3, d.y - d.h, 22, 5);
        g.fillStyle(0xfff1b0, 0.35).fillCircle(d.x + 18, d.y - d.h + 10, 30);
        g.fillStyle(0xfff1b0, 1).fillCircle(d.x + 18, d.y - d.h + 8, 6);
        break;
      }
      case 'neon': {
        const c = [0xff4d8d, 0x5cf0ff, 0xffd24a, 0xa06bff][Math.floor(hash(d.seed) * 4)];
        g.fillStyle(0x0a0c1c, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(3, c, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(c, 0.12).fillRect(d.x - 6, d.y - 6, d.w + 12, d.h + 12);
        this.neonText(d, c, rec);
        break;
      }
      case 'pipes': {
        g.fillStyle(0x303654, 1).fillRect(d.x, d.y, d.w, 12);
        g.fillRect(d.x, d.y + 26, d.w, 8);
        for (let x = d.x; x < d.x + d.w; x += 150) g.fillRect(x, d.y, 10, d.h);
        break;
      }
      case 'banner': {
        g.fillStyle(this.theme === 'arena' ? 0x8a1a2a : 0x3a2a6a, 1).fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0xffd24a, 0.9).fillTriangle(d.x, d.y + d.h, d.x + d.w, d.y + d.h, d.x + d.w / 2, d.y + d.h - 24);
        g.fillStyle(0xffd24a, 0.8).fillCircle(d.x + d.w / 2, d.y + d.h * 0.4, d.w * 0.22);
        break;
      }
      case 'arrow': {
        g.fillStyle(0xffd24a, 0.55);
        g.fillTriangle(d.x + d.w, d.y + d.h / 2, d.x + d.w - 24, d.y, d.x + d.w - 24, d.y + d.h);
        g.fillRect(d.x, d.y + d.h / 2 - 5, d.w - 24, 10);
        break;
      }
      case 'beacon': {
        g.fillStyle(0x39405c, 1).fillRect(d.x + d.w / 2 - 5, d.y - d.h, 10, d.h);
        g.fillStyle(0xff4d5e, 0.25).fillCircle(d.x + d.w / 2, d.y - d.h, 46);
        g.fillStyle(0xff4d5e, 1).fillCircle(d.x + d.w / 2, d.y - d.h, 12);
        break;
      }
      case 'pillar': {
        g.fillStyle(0x2c2238, 1).fillRect(d.x - d.w / 2, d.y - d.h, d.w, d.h);
        g.fillStyle(0xffffff, 0.07).fillRect(d.x - d.w / 2, d.y - d.h, 6, d.h);
        g.fillStyle(0x4a3552, 1).fillRect(d.x - d.w / 2 - 8, d.y - d.h, d.w + 16, 22);
        break;
      }
      case 'torch': {
        g.fillStyle(0x3a2a22, 1).fillRect(d.x - 4, d.y - d.h, 8, d.h);
        g.fillStyle(0xff8a3a, 0.35).fillCircle(d.x, d.y - d.h - 6, 34);
        g.fillStyle(0xffd24a, 1).fillCircle(d.x, d.y - d.h - 6, 8);
        break;
      }
      case 'door': {
        g.fillStyle(0x0a0c1c, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(4, this.theme === 'arena' ? 0x5cf0ff : 0xff4d5e, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(this.theme === 'arena' ? 0x5cf0ff : 0xff4d5e, 0.15).fillRect(d.x, d.y, d.w, d.h);
        if (d.text) this.neonText({ ...d, y: d.y - 34, h: 24 }, 0xffffff, rec);
        break;
      }
    }
  }

  private neonText(d: DecorDef, color: number, rec: Loaded): void {
    if (!d.text) return;
    const t = this.scene.add.text(d.x + d.w / 2, d.y + d.h / 2, tr(d.text), {
      fontFamily: 'system-ui, sans-serif', fontSize: `${Math.max(14, Math.floor(d.h * 0.62))}px`, fontStyle: '800',
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(DEPTH.decor + 1);
    rec.gfx.push(t);
  }
}
