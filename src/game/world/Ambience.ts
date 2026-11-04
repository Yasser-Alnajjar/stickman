import Phaser from 'phaser';
import { DEPTH } from '@/shared/constants';
import type { DecorDef, RegionDef } from '@/game/config/regions';
import type { AmbientParticles, AnimatedDecor, WorldTheme } from './types';

interface Entry { d: DecorDef; a: AnimatedDecor; l: number; r: number }

/**
 * Everything in a world that moves: animated machinery, the water/lava bed, weather. Decor is bucketed once at
 * start-up; each frame only entries overlapping the camera are repainted into two shared Graphics objects.
 */
export class Ambience {
  private readonly back: Phaser.GameObjects.Graphics;
  private readonly front: Phaser.GameObjects.Graphics;
  private readonly bed: Phaser.GameObjects.Graphics | null;
  private readonly entries: Entry[] = [];
  private readonly weather: AmbientParticles | null;

  constructor(scene: Phaser.Scene, region: RegionDef, private readonly theme: WorldTheme) {
    this.bed = theme.bed ? scene.add.graphics().setDepth(DEPTH.decor - 1) : null;
    this.back = scene.add.graphics().setDepth(DEPTH.decor + 1);
    this.front = scene.add.graphics().setDepth(DEPTH.foreground - 5);
    const anim = theme.animated ?? {};
    for (const d of region.decor) {
      const a = anim[d.kind];
      if (!a) continue;
      const pad = a.pad ?? 40;
      this.entries.push({ d, a, l: d.x - pad - d.w * 0.5, r: d.x + d.w * 1.5 + pad });
    }
    this.weather = theme.ambient ? theme.ambient(scene, region) : null;
  }

  update(dt: number, view: Phaser.Geom.Rectangle, nowMs: number): void {
    const t = nowMs / 1000;
    if (this.bed && this.theme.bed) { this.bed.clear(); this.theme.bed.draw(this.bed, view.left - 40, view.right + 40, t); }
    this.back.clear(); this.front.clear();
    for (const e of this.entries) {
      if (e.r < view.left || e.l > view.right) continue;
      e.a.draw(e.a.layer === 'back' ? this.back : this.front, e.d, t);
    }
    this.weather?.update(dt, view, t);
  }
}
