import type { ProfileData } from '@/shared/types';
import { BOSSES, QUESTS } from '@/game/world/stores';
import { packOfRegion } from '@/game/world/registry';
import { WORLD_PACKS } from '@/game/world/stores';
import { levelOf, owns } from './ownership';
import { isRevealed } from './shop';
import { summarize, type WeaponSummary } from './stats';
import type { WeaponDef, WeaponSource } from './types';

export interface SourceText { key: string; vars: Record<string, string | number> }

/** Describes where a weapon comes from. `key` is an English source string (the localisation key). */
export function describeSource(src: WeaponSource): SourceText {
  switch (src.type) {
    case 'start': return { key: 'Starting weapon', vars: {} };
    case 'shop': return { key: 'Sold in the Weapon Shop: {price} coins', vars: { price: src.price } };
    case 'boss': return { key: 'Boss reward: {name}', vars: { name: BOSSES[src.boss]?.name ?? src.boss } };
    case 'quest': return { key: 'Quest reward: {name}', vars: { name: QUESTS[src.quest]?.title ?? src.quest } };
    case 'chest': return { key: 'Hidden treasure chest in {name}', vars: { name: packOfRegion(src.region)?.name ?? src.region } };
  }
}

/** What stops a player from buying a shop weapon right now (null = nothing). */
export function shopLockText(packId: string): SourceText {
  const pack = WORLD_PACKS.find((p) => p.id === packId);
  return { key: 'Reach {name} to unlock', vars: { name: pack?.name ?? packId } };
}

export type StatTrend = 'up' | 'down' | 'same';
export const trend = (value: number, base: number): StatTrend => (Math.abs(value - base) < 0.005 ? 'same' : value > base ? 'up' : 'down');

export interface WeaponView {
  def: WeaponDef;
  owned: boolean;
  revealed: boolean;
  level: number;
  summary: WeaponSummary;
}

export function weaponView(p: ProfileData, def: WeaponDef): WeaponView {
  const owned = owns(p, def.id);
  const level = owned ? levelOf(p, def.id) : 1;
  return { def, owned, revealed: owned || isRevealed(p, def), level, summary: summarize(def, level) };
}
