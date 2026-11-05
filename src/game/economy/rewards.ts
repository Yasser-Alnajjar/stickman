import type { ProfileData } from '@/shared/types';
import { WEAPONS, WEAPON_ORDER } from '@/game/weapons/registry';
import type { WeaponSource } from '@/game/weapons/types';
import { addWeapon } from '@/game/weapons/ownership';
import { earnGold } from './wallet';

/**
 * The one place rewards turn into player state. Boss, chest and quest rewards all go through `grantReward`, keyed by a
 * claim that is stored in the save: replaying an event (scene restart, save reload, repeated trigger) cannot pay twice.
 */
export interface RewardBundle {
  gold?: number;
  weapons?: string[];
}

export interface RewardResult {
  /** False when the claim was already taken. */
  granted: boolean;
  gold: number;
  /** Weapons newly added to the collection. */
  weapons: string[];
}

export const bossClaim = (boss: string): string => `boss:${boss}`;
export const questClaim = (quest: string): string => `quest:${quest}`;
export const chestClaim = (region: string, pickup: string): string => `chest:${region}:${pickup}`;

export function grantReward(p: ProfileData, claim: string, bundle: RewardBundle): RewardResult {
  if (p.rewardClaims.includes(claim)) return { granted: false, gold: 0, weapons: [] };
  p.rewardClaims.push(claim);
  const gold = earnGold(p, bundle.gold ?? 0);
  const weapons = (bundle.weapons ?? []).filter((id) => addWeapon(p, id));
  return { granted: true, gold, weapons };
}

/** Weapons whose definition names this event as a source. */
export function weaponsFromSource(match: (s: WeaponSource) => boolean): string[] {
  return WEAPON_ORDER.filter((id) => WEAPONS[id].sources.some(match));
}
export const bossWeapons = (boss: string): string[] => weaponsFromSource((s) => s.type === 'boss' && s.boss === boss);
export const questWeapons = (quest: string): string[] => weaponsFromSource((s) => s.type === 'quest' && s.quest === quest);
export const chestWeapons = (region: string, pickup: string): string[] =>
  weaponsFromSource((s) => s.type === 'chest' && s.region === region && s.pickup === pickup);

/** Gold in a treasure chest grows with the world it sits in (`worldIndex` is 0-based). */
export function chestGold(worldIndex: number): number {
  const i = Math.max(0, Math.floor(worldIndex));
  return Math.round((20 * Math.pow(i + 1, 1.5)) / 5) * 5;
}
