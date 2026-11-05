import { splitCoins } from './loot';

/**
 * Pure simulation of dropped coins: they pop out of a defeated enemy, settle, get pulled toward a nearby player and are
 * collected on contact. Each coin carries its own value, and collecting is the only way a coin pays out, so one coin
 * can never pay twice. Leaving the area banks whatever is left (`drain`) exactly once.
 */
export interface Coin {
  x: number; y: number; vx: number; vy: number;
  /** y at which the coin settles. */
  restY: number;
  value: number;
  /** ms since it dropped. */
  age: number;
  spin: number;
}

export interface Collector { x: number; y: number; alive: boolean }

export const COIN_CFG = {
  gravity: 1500,
  magnetRadius: 170,
  magnetDelay: 350,
  collectRadius: 34,
  /** More physical coins than this are credited immediately instead of spawned. */
  maxOnField: 80,
} as const;

export class CoinSim {
  coins: Coin[] = [];

  /** Spawns coins worth `total`. Returns the value that could not be spawned (field full) so the caller can credit it. */
  drop(total: number, x: number, y: number, rng: () => number, maxCoins = 12): number {
    let overflow = 0;
    for (const value of splitCoins(total, maxCoins)) {
      if (this.coins.length >= COIN_CFG.maxOnField) { overflow += value; continue; }
      const ang = -Math.PI / 2 + (rng() - 0.5) * 2.2;
      const sp = 180 + rng() * 240;
      this.coins.push({
        x, y, vx: Math.cos(ang) * sp * 0.7, vy: Math.sin(ang) * sp,
        restY: y + 18 + rng() * 12, value, age: 0, spin: rng() * 6,
      });
    }
    return overflow;
  }

  /** Advances time. Returns the values of the coins collected during this step. */
  step(dt: number, who: Collector | null): number[] {
    const got: number[] = [];
    const s = dt / 1000;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.age += dt;
      c.spin += s * 9;
      const dx = who ? who.x - c.x : 0;
      const dy = who ? who.y - c.y : 0;
      const dist = Math.hypot(dx, dy);
      if (who?.alive && c.age > COIN_CFG.magnetDelay && dist < COIN_CFG.magnetRadius) {
        const pull = 1 - dist / COIN_CFG.magnetRadius;
        const k = Math.min(1, s * (6 + 14 * pull));
        c.vx += (dx / Math.max(1, dist) * 620 - c.vx) * k;
        c.vy += (dy / Math.max(1, dist) * 620 - c.vy) * k;
      } else {
        c.vy += COIN_CFG.gravity * s;
      }
      c.x += c.vx * s;
      c.y += c.vy * s;
      if (c.y >= c.restY && c.vy > 0 && !(who?.alive && c.age > COIN_CFG.magnetDelay && dist < COIN_CFG.magnetRadius)) {
        c.y = c.restY;
        c.vy = Math.abs(c.vy) > 160 ? -c.vy * 0.35 : 0;
        c.vx *= 0.6;
      }
      if (who?.alive && dist < COIN_CFG.collectRadius && c.age > 150) {
        got.push(c.value);
        this.coins.splice(i, 1);
      }
    }
    return got;
  }

  /** Removes every remaining coin and returns its total value (banked when the area ends). */
  drain(): number {
    const total = this.coins.reduce((n, c) => n + c.value, 0);
    this.coins = [];
    return total;
  }

  get remainingValue(): number { return this.coins.reduce((n, c) => n + c.value, 0); }
}
