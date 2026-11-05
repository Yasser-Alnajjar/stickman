import type { ProfileData } from '@/shared/types';

/** Gold Coins: the one currency, shared by every world. Always a non-negative integer. */
export const MAX_GOLD = 9_999_999;

/** Coerces anything (a corrupted save, NaN, a float) into a valid balance. */
export function sanitizeGold(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(MAX_GOLD, Math.max(0, Math.floor(v))) : 0;
}

export const balance = (p: ProfileData): number => p.inventory.gold;

export const canAfford = (p: ProfileData, amount: number): boolean =>
  Number.isInteger(amount) && amount >= 0 && p.inventory.gold >= amount;

/** Adds coins. Returns the amount actually credited (0 for invalid amounts; clamped at the cap). */
export function earnGold(p: ProfileData, amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const add = Math.min(Math.floor(amount), MAX_GOLD - p.inventory.gold);
  if (add <= 0) return 0;
  p.inventory.gold += add;
  return add;
}

/** Removes coins only when the whole price is available; never goes negative. */
export function spendGold(p: ProfileData, amount: number): boolean {
  if (!Number.isInteger(amount) || amount < 0 || p.inventory.gold < amount) return false;
  p.inventory.gold -= amount;
  return true;
}
