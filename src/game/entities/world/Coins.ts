import Phaser from 'phaser';
import { COLORS, DEPTH } from '@/shared/constants';
import { CoinSim } from '@/game/economy/coin-sim';
import type { Fx } from '@/game/managers/Fx';
import type { Player } from '@/game/entities/player/Player';
import { session } from '@/game/managers/session';
import { audio } from '@/game/managers/AudioManager';
import { t } from '@/i18n';

/**
 * Physical Gold Coins in the world. Enemies and bosses call `drop`; the player collects by touch (a magnet pulls coins
 * in close). Every credit goes through `session.earn`, the single currency entry point. Uncollected coins are banked
 * when the area ends (`bank`), so dying, leaving, or returning to the menu never loses a kill's reward.
 */
export class CoinField {
  private readonly sim = new CoinSim();
  private readonly g: Phaser.GameObjects.Graphics;
  private pending = 0;
  private pendingTimer = 0;
  private soundGap = 0;
  private pitch = 0;

  constructor(scene: Phaser.Scene, private readonly fx: Fx, private readonly player: () => Player) {
    this.g = scene.add.graphics().setDepth(DEPTH.pickups + 2);
  }

  drop(total: number, x: number, y: number, maxCoins = 12): void {
    if (total <= 0) return;
    const overflow = this.sim.drop(total, x, y, Math.random, maxCoins);
    if (overflow > 0) session.earn(overflow);
    this.fx.text(x, y - 34, `+${total} 🪙`, '#ffd24a', 15, 700);
  }

  update(dt: number): void {
    const p = this.player();
    const got = this.sim.step(dt, { x: p.cx, y: p.cy, alive: p.alive });
    this.soundGap = Math.max(0, this.soundGap - dt);
    if (got.length) {
      const sum = got.reduce((a, b) => a + b, 0);
      session.earn(sum);
      this.pending += sum;
      this.pendingTimer = 550;
      if (this.soundGap <= 0) {
        audio.play('coin');
        this.soundGap = 55;
      }
      this.fx.ring(p.cx, p.cy - 10, COLORS.coin, 6, 34, 220, 2);
    } else if (this.pending > 0) {
      this.pendingTimer -= dt;
      if (this.pendingTimer <= 0) {
        this.fx.text(p.cx, p.cy - 66, t('+{n} coins', { n: this.pending }), '#ffd24a', 20, 800);
        this.pending = 0;
      }
    }
    this.draw();
  }

  private draw(): void {
    const g = this.g;
    g.clear();
    for (const c of this.sim.coins) {
      const w = 6 + Math.abs(Math.cos(c.spin)) * 6;
      g.fillStyle(COLORS.coin, 0.22).fillCircle(c.x, c.y, 13);
      g.fillStyle(0xb8860b, 1).fillEllipse(c.x, c.y + 1, w + 2, 13);
      g.fillStyle(COLORS.coin, 1).fillEllipse(c.x, c.y, w, 12);
      g.fillStyle(0xfff1b0, 0.9).fillEllipse(c.x - w * 0.15, c.y - 2, Math.max(1.5, w * 0.35), 4);
    }
  }

  /** Credits every uncollected coin once and clears the field. Returns the amount banked. */
  bank(): number {
    const total = this.sim.drain();
    if (total > 0) session.earn(total);
    this.pending = 0;
    return total;
  }

  destroy(): void { this.g.destroy(); }
}
