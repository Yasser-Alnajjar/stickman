import Phaser from 'phaser';
import { COLORS, DEPTH } from '@/shared/constants';
import type { CheckpointDef, PickupDef } from '@/game/config/regions';
import { ITEMS } from '@/game/config/items';
import { t } from '@/i18n';

/** A glowing lamp that acts as a checkpoint. */
export class CheckpointLamp {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  active = false;
  private t = 0;

  constructor(scene: Phaser.Scene, readonly def: CheckpointDef, readonly y: number) {
    this.g = scene.add.graphics().setDepth(DEPTH.decor + 2);
    this.label = scene.add.text(def.x, y - 190, t(def.name), { fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: '700', color: '#cfd6ff', stroke: '#000', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(DEPTH.decor + 2).setAlpha(0.8);
  }

  contains(x: number): boolean { return Math.abs(x - this.def.x) < 70; }

  update(dt: number): void {
    this.t += dt / 1000;
    const g = this.g, x = this.def.x, y = this.y;
    g.clear();
    g.fillStyle(0x2a2f4d, 1).fillRect(x - 5, y - 150, 10, 150);
    g.fillRect(x - 18, y - 6, 36, 6);
    const c = this.active ? 0x7dffa0 : 0xffb347;
    const pulse = 0.6 + 0.4 * Math.sin(this.t * 3);
    g.fillStyle(c, 0.18 * pulse).fillCircle(x, y - 160, 54);
    g.fillStyle(c, 0.9).fillCircle(x, y - 160, 14);
    g.fillStyle(0xffffff, 0.9).fillCircle(x - 3, y - 164, 4);
    g.lineStyle(3, 0x2a2f4d, 1).strokeCircle(x, y - 160, 18);
  }

  destroy(): void { this.g.destroy(); this.label.destroy(); }
}

/** Collectable item or chest. */
export class Pickup {
  private readonly g: Phaser.GameObjects.Graphics;
  private t = Math.random() * 6;
  collected = false;

  constructor(scene: Phaser.Scene, readonly def: Pick<PickupDef, 'id' | 'item' | 'qty' | 'x' | 'y' | 'chest'>, depth: number = DEPTH.pickups) {
    this.g = scene.add.graphics().setDepth(depth);
  }

  get x(): number { return this.def.x; }
  get y(): number { return this.def.y; }

  update(dt: number): void {
    if (this.collected) return;
    this.t += dt / 1000;
    const { x, y } = this.def;
    const g = this.g;
    g.clear();
    const bob = Math.sin(this.t * 3) * 4;
    const col = this.def.item === 'keycard' ? 0xffd24a : this.def.item === 'energy_cell' ? 0x5c9dff : this.def.item === 'health_tonic' ? 0xff5c7a : COLORS.fireCore;
    g.fillStyle(col, 0.2 + 0.1 * Math.sin(this.t * 4)).fillCircle(x, y - 18 + bob, 30);
    if (this.def.chest) {
      g.fillStyle(0x6b4a2b, 1).fillRect(x - 20, y - 26 + bob * 0.3, 40, 26);
      g.fillStyle(0x8a6238, 1).fillRect(x - 20, y - 34 + bob * 0.3, 40, 12);
      g.fillStyle(col, 1).fillRect(x - 4, y - 28 + bob * 0.3, 8, 10);
    } else {
      g.fillStyle(col, 1).fillRect(x - 12, y - 30 + bob, 24, 16);
      g.lineStyle(2, 0xffffff, 0.9).strokeRect(x - 12, y - 30 + bob, 24, 16);
    }
  }

  collect(): void {
    this.collected = true;
    this.g.clear();
  }

  get label(): string { return ITEMS[this.def.item].name; }

  destroy(): void { this.g.destroy(); }
}
