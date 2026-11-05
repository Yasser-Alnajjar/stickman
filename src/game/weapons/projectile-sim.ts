/**
 * Pure projectile stepping for bolts, waves and orbs. The engine-side system (PlayerProjectiles) feeds it hit counts
 * from the shared CombatSystem, so hit detection and damage rules stay in exactly one place.
 */
export interface SimProjectile {
  x: number; y: number; vx: number; vy: number; ay: number;
  /** ms left. */
  life: number;
  /** Additional targets it may still pass through; -1 = unlimited. */
  pierceLeft: number;
  dead: boolean;
  /** True once it has hit something. */
  struck: boolean;
}

export function stepProjectile(p: SimProjectile, dt: number): void {
  if (p.dead) return;
  const s = dt / 1000;
  p.life -= dt;
  p.vy += p.ay * s;
  p.x += p.vx * s;
  p.y += p.vy * s;
  if (p.life <= 0) p.dead = true;
}

/** Applies the outcome of a collision pass. Returns true when the projectile ended because of it. */
export function registerProjectileHits(p: SimProjectile, hits: number): boolean {
  if (hits <= 0 || p.dead) return false;
  p.struck = true;
  if (p.pierceLeft < 0) return false;
  p.pierceLeft -= hits;
  if (p.pierceLeft < 0) { p.dead = true; return true; }
  return false;
}
