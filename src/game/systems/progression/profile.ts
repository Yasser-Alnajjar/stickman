import type {
  AbilityId, AttributeId, ItemId, PlayerStats, ProfileData, RegionId,
} from '@/shared/types';
import { ABILITIES, ABILITY_ORDER } from '@/game/config/abilities';
import { ATTRIBUTES, ATTRIBUTE_ORDER, LEVEL_BONUS, MAX_LEVEL, xpToNext } from '@/game/config/progression';
import { PLAYER_CFG } from '@/game/config/player';
import { WORLD_PACKS } from '@/game/world/worlds';

/** Where a new game begins: the first registered world's city. */
export function startCheckpoint(): { region: RegionId; id: string; x: number; y: number } {
  return { region: WORLD_PACKS[0].cityRegion, id: 'start', x: 160, y: 960 };
}

/** Pure data/logic for character progression. No engine dependencies, fully unit-testable. */
export function createProfile(): ProfileData {
  const abilities = {} as Record<AbilityId, number>;
  for (const id of ABILITY_ORDER) abilities[id] = 0;
  const attributes = {} as Record<AttributeId, number>;
  for (const id of ATTRIBUTE_ORDER) attributes[id] = 0;
  const profile: ProfileData = {
    level: 1, xp: 0, skillPoints: 1, abilities, attributes, health: 0,
    quests: {}, defeatedBosses: [], killedEnemies: [], flags: {}, collected: [],
    checkpoint: startCheckpoint(),
    checkpoints: {},
    inventory: { items: {}, gold: 0 },
    stats: { kills: 0, deaths: 0, playTimeMs: 0 },
  };
  profile.health = deriveStats(profile).maxHealth;
  return profile;
}

export function deriveStats(p: ProfileData): PlayerStats {
  const b = PLAYER_CFG.base;
  const lv = p.level - 1;
  const a = p.attributes;
  return {
    maxHealth: b.maxHealth + lv * LEVEL_BONUS.health + a.vitality * 15,
    maxStamina: b.maxStamina + a.endurance * 12,
    maxEnergy: b.maxEnergy + lv * LEVEL_BONUS.energy + a.focus * 10,
    attack: b.attack + lv * LEVEL_BONUS.attack + a.strength * 2,
    defense: b.defense + Math.floor(lv / 2),
    moveSpeedMult: 1 + a.agility * 0.04,
    staminaRegen: b.staminaRegen + a.endurance * 4,
    energyRegen: b.energyRegen + a.focus * 0.6,
  };
}

export interface XpResult { levelsGained: number; newLevel: number }

export function addXp(p: ProfileData, amount: number): XpResult {
  let gained = 0;
  if (amount <= 0) return { levelsGained: 0, newLevel: p.level };
  p.xp += Math.floor(amount);
  while (p.level < MAX_LEVEL && p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level += 1;
    p.skillPoints += 1;
    gained += 1;
  }
  if (p.level >= MAX_LEVEL) p.xp = Math.min(p.xp, xpToNext(MAX_LEVEL) - 1);
  return { levelsGained: gained, newLevel: p.level };
}

export type SkillCheck = { ok: true; cost: number } | { ok: false; reason: string };

export function checkAbilityUpgrade(p: ProfileData, id: AbilityId): SkillCheck {
  const def = ABILITIES[id];
  const rank = p.abilities[id];
  if (rank >= def.maxRank) return { ok: false, reason: 'Max rank' };
  if (p.level < def.unlockLevel) return { ok: false, reason: `Requires level ${def.unlockLevel}` };
  const cost = def.rankCosts[rank] ?? 1;
  if (p.skillPoints < cost) return { ok: false, reason: `Needs ${cost} skill point${cost > 1 ? 's' : ''}` };
  return { ok: true, cost };
}

export function upgradeAbility(p: ProfileData, id: AbilityId): boolean {
  const c = checkAbilityUpgrade(p, id);
  if (!c.ok) return false;
  p.skillPoints -= c.cost;
  p.abilities[id] += 1;
  return true;
}

export function checkAttributeUpgrade(p: ProfileData, id: AttributeId): SkillCheck {
  if (p.attributes[id] >= ATTRIBUTES[id].maxRank) return { ok: false, reason: 'Max rank' };
  if (p.skillPoints < 1) return { ok: false, reason: 'Needs 1 skill point' };
  return { ok: true, cost: 1 };
}

export function upgradeAttribute(p: ProfileData, id: AttributeId): boolean {
  const c = checkAttributeUpgrade(p, id);
  if (!c.ok) return false;
  p.skillPoints -= c.cost;
  p.attributes[id] += 1;
  return true;
}

export function addItem(p: ProfileData, id: ItemId, qty = 1): void {
  p.inventory.items[id] = (p.inventory.items[id] ?? 0) + qty;
}

export function removeItem(p: ProfileData, id: ItemId, qty = 1): boolean {
  const have = p.inventory.items[id] ?? 0;
  if (have < qty) return false;
  const left = have - qty;
  if (left <= 0) delete p.inventory.items[id];
  else p.inventory.items[id] = left;
  return true;
}

export const itemCount = (p: ProfileData, id: ItemId): number => p.inventory.items[id] ?? 0;
