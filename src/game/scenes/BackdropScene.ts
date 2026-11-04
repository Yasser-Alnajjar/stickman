import Phaser from 'phaser';
import { computeZoom } from '@/game/utils/viewport';
import { themeOf } from '@/game/world/themes';
import type { BackdropFrame, WorldTheme } from '@/game/world/types';

type Kind = 'far' | 'mid' | 'near';
interface Layer { sprite: Phaser.GameObjects.TileSprite; factor: number; base: number; kind: Kind }

const REF_Y = 800;
const MAX_CACHED_THEMES = 3;

/** Persistent screen-space parallax backdrop that sits below the world scene. Art comes from the active world theme. */
export class BackdropScene extends Phaser.Scene {
  private sky!: Phaser.GameObjects.Image;
  private fxG!: Phaser.GameObjects.Graphics;
  private layers: Layer[] = [];
  private theme: WorldTheme | null = null;
  private themeId = 'neon';
  private readonly themeLru: string[] = [];
  private midX = 0;
  private midY = REF_Y;

  constructor() { super('Backdrop'); }

  create(): void {
    this.sky = this.add.image(0, 0, '__WHITE').setOrigin(0, 0).setDepth(0);
    this.layers = [
      { sprite: this.add.tileSprite(0, 0, 10, 10, '__WHITE').setOrigin(0, 1).setDepth(1), factor: 0.1, base: 0.88, kind: 'far' },
      { sprite: this.add.tileSprite(0, 0, 10, 10, '__WHITE').setOrigin(0, 1).setDepth(3), factor: 0.25, base: 0.97, kind: 'mid' },
      { sprite: this.add.tileSprite(0, 0, 10, 10, '__WHITE').setOrigin(0, 1).setDepth(4), factor: 0.5, base: 1.05, kind: 'near' },
    ];
    this.fxG = this.add.graphics().setDepth(2);
    this.setTheme(this.themeId);
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.layout();
  }

  /** Builds (once) and applies the textures of a world theme. Only the last few themes stay in memory. */
  setTheme(id: string): void {
    this.themeId = id;
    if (!this.sky) return;
    const theme = themeOf(id);
    this.theme = theme;
    this.ensureTextures(theme);
    this.sky.setTexture(`sky_${id}`);
    for (const l of this.layers) {
      const key = `${l.kind}_${id}`;
      const has = this.textures.exists(key);
      l.sprite.setVisible(has);
      if (has) l.sprite.setTexture(key);
    }
    this.layout();
  }

  private ensureTextures(theme: WorldTheme): void {
    const at = this.themeLru.indexOf(theme.id);
    if (at >= 0) { this.themeLru.splice(at, 1); this.themeLru.push(theme.id); return; }
    const mk = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void): void => {
      const tex = this.textures.createCanvas(key, w, h);
      if (!tex) return;
      draw(tex.getContext(), w, h);
      tex.refresh();
    };
    const art = theme.backdrop;
    mk(`sky_${theme.id}`, 16, 720, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 720);
      for (const [o, col] of art.sky) g.addColorStop(o, col);
      c.fillStyle = g; c.fillRect(0, 0, 16, 720);
    });
    for (const kind of ['far', 'mid', 'near'] as Kind[]) {
      const layer = art[kind];
      if (layer) mk(`${kind}_${theme.id}`, layer.w, layer.h, layer.draw);
    }
    this.themeLru.push(theme.id);
    while (this.themeLru.length > MAX_CACHED_THEMES) {
      const old = this.themeLru.shift()!;
      if (old === theme.id) continue;
      for (const k of ['sky', 'far', 'mid', 'near']) if (this.textures.exists(`${k}_${old}`)) this.textures.remove(`${k}_${old}`);
    }
  }

  /** World-space point at the centre of the world camera. */
  setFocus(x: number, y: number): void {
    this.midX = x;
    this.midY = y;
    this.place();
  }

  private layout(): void {
    const w = this.scale.width, h = this.scale.height;
    if (!w || !h || !this.sky) return;
    this.sky.setDisplaySize(w, h);
    this.place();
  }

  override update(): void {
    this.paintFx();
  }

  private place(): void {
    const w = this.scale.width, h = this.scale.height;
    if (!w || !h || !this.sky || !this.theme) return;
    const zoom = computeZoom(w, h);
    for (const l of this.layers) {
      if (!l.sprite.visible) continue;
      const texH = this.textures.get(`${l.kind}_${this.themeId}`).getSourceImage().height;
      l.sprite.setSize(w, texH * zoom).setTileScale(zoom, zoom);
      l.sprite.setPosition(0, h * l.base + (REF_Y - this.midY) * l.factor * zoom);
      l.sprite.tilePositionX = this.midX * l.factor;
    }
  }

  private paintFx(): void {
    const w = this.scale.width, h = this.scale.height;
    if (!this.fxG || !this.theme?.backdropFx || !w || !h) { this.fxG?.clear(); return; }
    const zoom = computeZoom(w, h);
    const f: BackdropFrame = {
      w, h, zoom, midX: this.midX, midY: this.midY, t: this.time.now / 1000,
      sx: (factor, lx) => (lx - this.midX * factor) * zoom,
      sy: (factor, base, up) => h * base + (REF_Y - this.midY) * factor * zoom - up * zoom,
    };
    this.theme.backdropFx(this.fxG, f);
  }
}
