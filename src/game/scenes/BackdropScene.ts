import Phaser from 'phaser';
import { computeZoom } from '@/game/utils/viewport';

type Theme = 'city' | 'arena';

interface Layer { sprite: Phaser.GameObjects.TileSprite; factor: number; base: number; kind: 'far' | 'mid' }

const REF_Y = 800;

/** Persistent screen-space parallax backdrop that sits below the world scene. */
export class BackdropScene extends Phaser.Scene {
  private sky!: Phaser.GameObjects.Image;
  private layers: Layer[] = [];
  private theme: Theme = 'city';
  private midX = 0;
  private midY = REF_Y;

  constructor() { super('Backdrop'); }

  create(): void {
    this.sky = this.add.image(0, 0, 'sky_city').setOrigin(0, 0).setDepth(0);
    this.layers = [
      { sprite: this.add.tileSprite(0, 0, 10, 10, 'far_city').setOrigin(0, 1).setDepth(1), factor: 0.12, base: 0.88, kind: 'far' },
      { sprite: this.add.tileSprite(0, 0, 10, 10, 'mid_city').setOrigin(0, 1).setDepth(2), factor: 0.3, base: 0.97, kind: 'mid' },
    ];
    this.setTheme(this.theme);
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.layout();
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    if (!this.sky) return;
    this.sky.setTexture(`sky_${theme}`);
    this.layers[0].sprite.setTexture(`far_${theme}`);
    this.layers[1].sprite.setTexture(`mid_${theme}`);
    this.layout();
  }

  /** World-space point at the centre of the world camera. */
  setFocus(x: number, y: number): void {
    this.midX = x;
    this.midY = y;
    this.place();
  }

  private layout(): void {
    const w = this.scale.width, h = this.scale.height;
    if (!w || !h) return;
    this.sky.setDisplaySize(w, h);
    this.place();
  }

  private place(): void {
    const w = this.scale.width, h = this.scale.height;
    if (!w || !h || !this.sky) return;
    const zoom = computeZoom(w, h);
    for (const l of this.layers) {
      const texH = this.textures.get(`${l.kind}_${this.theme}`).getSourceImage().height;
      l.sprite.setSize(w, texH * zoom).setTileScale(zoom, zoom);
      l.sprite.setPosition(0, h * l.base + (REF_Y - this.midY) * l.factor * zoom);
      l.sprite.tilePositionX = this.midX * l.factor;
    }
  }
}
