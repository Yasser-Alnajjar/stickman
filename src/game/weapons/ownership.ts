import type { ProfileData, WeaponsState } from '@/shared/types';
import { canAfford, spendGold } from '@/game/economy/wallet';
import { WEAPONS, WEAPON_ORDER, STARTING_WEAPON } from './registry';
import { clampLevel, nextUpgradeCost } from './stats';

/** A fresh or repaired weapon state: always owns and equips the starting weapon. */
export function defaultWeapons(): WeaponsState {
  return { owned: [STARTING_WEAPON], equipped: STARTING_WEAPON, levels: { [STARTING_WEAPON]: 1 } };
}

/**
 * Ownership ids that exist in this build, in registry order. Saves may hold ids this build does not know (a pack that
 * is not registered right now); those are preserved in the profile but never surface in the game.
 */
export function ownedIds(p: ProfileData): string[] {
  const set = new Set(p.weapons.owned);
  return WEAPON_ORDER.filter((id) => set.has(id));
}

export const owns = (p: ProfileData, id: string): boolean => !!WEAPONS[id] && p.weapons.owned.includes(id);

export function levelOf(p: ProfileData, id: string): number {
  const def = WEAPONS[id];
  return def ? clampLevel(p.weapons.levels[id] ?? 1, def) : 1;
}

/** The equipped weapon id, guaranteed to be a known, owned weapon. */
export function equippedId(p: ProfileData): string {
  const id = p.weapons.equipped;
  return owns(p, id) ? id : STARTING_WEAPON;
}

/** Adds a weapon to the collection. Idempotent: returns true only the first time. */
export function addWeapon(p: ProfileData, id: string): boolean {
  if (!WEAPONS[id] || p.weapons.owned.includes(id)) return false;
  p.weapons.owned.push(id);
  p.weapons.levels[id] = 1;
  return true;
}

export type EquipResult = { ok: true } | { ok: false; reason: 'unknown' | 'not_owned' };

export function equip(p: ProfileData, id: string): EquipResult {
  if (!WEAPONS[id]) return { ok: false, reason: 'unknown' };
  if (!owns(p, id)) return { ok: false, reason: 'not_owned' };
  p.weapons.equipped = id;
  return { ok: true };
}

/** Next/previous owned weapon in registry order, wrapping around. */
export function cycleTarget(p: ProfileData, dir: 1 | -1): string {
  const ids = ownedIds(p);
  if (ids.length <= 1) return equippedId(p);
  const i = Math.max(0, ids.indexOf(equippedId(p)));
  return ids[(i + dir + ids.length) % ids.length];
}

export type UpgradeResult =
  | { ok: true; level: number; cost: number }
  | { ok: false; reason: 'unknown' | 'not_owned' | 'max' | 'funds'; cost?: number };

/** Atomic: the level and the balance change together, or neither does. */
export function upgradeWeapon(p: ProfileData, id: string): UpgradeResult {
  const def = WEAPONS[id];
  if (!def) return { ok: false, reason: 'unknown' };
  if (!owns(p, id)) return { ok: false, reason: 'not_owned' };
  const level = levelOf(p, id);
  const cost = nextUpgradeCost(def, level);
  if (cost === null) return { ok: false, reason: 'max' };
  if (!canAfford(p, cost)) return { ok: false, reason: 'funds', cost };
  if (!spendGold(p, cost)) return { ok: false, reason: 'funds', cost };
  p.weapons.levels[id] = level + 1;
  return { ok: true, level: level + 1, cost };
}

/** Repairs a weapon state loaded from a save: unknown ids kept (but inert), levels clamped, equipped always valid. */
export function sanitizeWeapons(raw: unknown): WeaponsState {
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  const src = isObj(raw) ? raw : {};
  const owned = new Set<string>([STARTING_WEAPON]);
  if (Array.isArray(src.owned)) for (const id of src.owned) if (typeof id === 'string' && id.length > 0 && id.length < 80) owned.add(id);
  const levels: Record<string, number> = {};
  const rawLevels = isObj(src.levels) ? src.levels : {};
  for (const id of owned) {
    const def = WEAPONS[id];
    const lv = rawLevels[id];
    levels[id] = def ? clampLevel(typeof lv === 'number' ? lv : 1, def) : typeof lv === 'number' && Number.isFinite(lv) ? Math.max(1, Math.floor(lv)) : 1;
  }
  const eq = typeof src.equipped === 'string' ? src.equipped : STARTING_WEAPON;
  const equipped = WEAPONS[eq] && owned.has(eq) ? eq : STARTING_WEAPON;
  return { owned: [...owned], equipped, levels };
}
