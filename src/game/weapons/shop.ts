import type { ProfileData } from '@/shared/types';
import { canAfford, spendGold } from '@/game/economy/wallet';
import { WORLD_PACKS } from '@/game/world/stores';
import { isWorldUnlocked } from '@/game/systems/campaign/progress';
import { WEAPONS, WEAPON_ORDER } from './registry';
import { addWeapon, owns } from './ownership';
import type { WeaponDef, WeaponSource } from './types';

type ShopSource = Extract<WeaponSource, { type: 'shop' }>;

export const shopSource = (def: WeaponDef): ShopSource | undefined =>
  def.sources.find((s): s is ShopSource => s.type === 'shop');

/** Index in campaign order of the world that stocks / owns a weapon; -1 for core weapons (always available). */
export function worldIndexOf(packId: string): number {
  return WORLD_PACKS.findIndex((p) => p.id === packId);
}

/** The highest world the player can currently enter (0-based). */
export function highestUnlockedWorld(p: ProfileData): number {
  let hi = 0;
  for (let i = 0; i < WORLD_PACKS.length; i++) if (isWorldUnlocked(p, i)) hi = i;
  return hi;
}

/** A weapon from a later world stays hidden until the player is one world away, so campaign content isn't spoiled. */
export function isRevealed(p: ProfileData, def: WeaponDef): boolean {
  const idx = worldIndexOf(def.world);
  return idx < 0 || idx <= highestUnlockedWorld(p) + 1;
}

export type ShopStatus = 'equipped' | 'owned' | 'available' | 'unaffordable' | 'locked';

export interface ShopEntry {
  def: WeaponDef;
  price: number;
  status: ShopStatus;
  /** Pack whose world must be reachable (locked entries only). */
  requiresPack?: string;
}

/** Shop listing for a profile: every revealed weapon that has a shop source, in registry order. */
export function shopEntries(p: ProfileData): ShopEntry[] {
  const out: ShopEntry[] = [];
  for (const id of WEAPON_ORDER) {
    const def = WEAPONS[id];
    const src = shopSource(def);
    if (!src || !isRevealed(p, def)) continue;
    const pack = src.unlockPack ?? def.world;
    const idx = worldIndexOf(pack);
    const unlocked = idx < 0 || isWorldUnlocked(p, idx);
    let status: ShopStatus;
    if (owns(p, id)) status = p.weapons.equipped === id ? 'equipped' : 'owned';
    else if (!unlocked) status = 'locked';
    else status = canAfford(p, src.price) ? 'available' : 'unaffordable';
    out.push({ def, price: src.price, status, requiresPack: status === 'locked' ? pack : undefined });
  }
  return out;
}

/** How many shop weapons are still hidden (shown as a hint, never named). */
export function hiddenShopCount(p: ProfileData): number {
  return WEAPON_ORDER.filter((id) => shopSource(WEAPONS[id]) && !isRevealed(p, WEAPONS[id])).length;
}

export type PurchaseResult =
  | { ok: true; price: number }
  | { ok: false; reason: 'unknown' | 'not_for_sale' | 'owned' | 'locked' | 'funds'; price?: number };

/** Atomic purchase: coins and ownership change together; a repeat call fails with `owned` and spends nothing. */
export function purchaseWeapon(p: ProfileData, id: string): PurchaseResult {
  const def = WEAPONS[id];
  if (!def) return { ok: false, reason: 'unknown' };
  const src = shopSource(def);
  if (!src) return { ok: false, reason: 'not_for_sale' };
  if (owns(p, id)) return { ok: false, reason: 'owned' };
  const idx = worldIndexOf(src.unlockPack ?? def.world);
  if (idx >= 0 && !isWorldUnlocked(p, idx)) return { ok: false, reason: 'locked' };
  if (!canAfford(p, src.price)) return { ok: false, reason: 'funds', price: src.price };
  if (!spendGold(p, src.price)) return { ok: false, reason: 'funds', price: src.price };
  addWeapon(p, id);
  return { ok: true, price: src.price };
}
