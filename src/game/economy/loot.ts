/**
 * Enemy coin drops. The value an enemy is worth (`gold` in its definition) is the average payout; tier, drop chance
 * and a random spread are applied on top. All randomness is injected so the rules are testable.
 */
export type EnemyTier = 'normal' | 'strong' | 'elite';

export interface LootConfig {
  /** Overrides the derived tier. */
  tier?: EnemyTier;
  /** 0..1 chance that the enemy drops coins at all. */
  chance?: number;
  /** Fixed reward range (before tier); replaces the +-spread around the enemy's average gold. */
  min?: number;
  max?: number;
}

export interface LootSource {
  gold: number;
  maxHealth: number;
  guard?: number;
  loot?: LootConfig;
}

export const TIERS: Record<EnemyTier, { chance: number; mult: number }> = {
  normal: { chance: 0.85, mult: 1 },
  strong: { chance: 1, mult: 1.25 },
  elite: { chance: 1, mult: 1.6 },
};

export function enemyTier(e: Pick<LootSource, 'maxHealth' | 'guard' | 'loot'>): EnemyTier {
  if (e.loot?.tier) return e.loot.tier;
  if (e.maxHealth >= 240) return 'elite';
  if (e.maxHealth >= 120 || e.guard) return 'strong';
  return 'normal';
}

/** Coins dropped by one defeated enemy (0 when the drop roll fails). `rng` returns [0,1). */
export function rollCoinDrop(e: LootSource, rng: () => number): number {
  const tier = TIERS[enemyTier(e)];
  const chance = e.loot?.chance ?? tier.chance;
  if (rng() >= chance) return 0;
  let v: number;
  if (e.loot?.min !== undefined && e.loot?.max !== undefined) {
    v = (e.loot.min + rng() * (e.loot.max - e.loot.min)) * tier.mult;
  } else {
    v = e.gold * tier.mult * (0.8 + rng() * 0.45);
  }
  return Math.max(0, Math.round(v));
}

/** Splits a payout into a handful of coin stacks so the drop reads as physical coins. Always sums to `total`. */
export function splitCoins(total: number, maxCoins = 12): number[] {
  const t = Math.max(0, Math.floor(total));
  if (t === 0) return [];
  const n = Math.min(maxCoins, Math.max(1, Math.ceil(t / 5)));
  const base = Math.floor(t / n);
  let rest = t - base * n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) { out.push(base + (rest > 0 ? 1 : 0)); if (rest > 0) rest--; }
  return out.filter((v) => v > 0);
}

/** Expected coins per kill (used by the economy report and tests). */
export function expectedDrop(e: LootSource): number {
  const tier = TIERS[enemyTier(e)];
  const chance = e.loot?.chance ?? tier.chance;
  const avg = e.loot?.min !== undefined && e.loot?.max !== undefined ? (e.loot.min + e.loot.max) / 2 : e.gold;
  return chance * avg * tier.mult;
}
