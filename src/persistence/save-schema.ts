import type { AbilityId, AttributeId, CheckpointRef, ItemId, ProfileData, QuestStatus, RegionId } from '@/shared/types';
import { ABILITIES, ABILITY_ORDER } from '@/game/config/abilities';
import { ATTRIBUTES, ATTRIBUTE_ORDER, MAX_LEVEL, xpToNext } from '@/game/config/progression';
import { ITEMS } from '@/game/config/items';
import { QUESTS } from '@/game/config/quests';
import { START_CHECKPOINT, createProfile, deriveStats } from '@/game/systems/progression/profile';

export const CURRENT_SAVE_VERSION = 1;

export interface SaveFile {
  version: number;
  savedAt: number;
  profile: ProfileData;
}

export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;
/** migrations[n] upgrades a version-n save to version n+1. */
export const MIGRATIONS: Record<number, Migration> = {};

const REGIONS: RegionId[] = ['city', 'boss_arena'];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

export type SaveResult = { ok: true; save: SaveFile } | { ok: false; error: string };

export function migrate(raw: unknown, migrations: Record<number, Migration> = MIGRATIONS): SaveResult {
  if (!isObj(raw)) return { ok: false, error: 'Save is not an object' };
  let cur: Record<string, unknown> = raw;
  let version = cur.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { ok: false, error: 'Missing save version' };
  if (version > CURRENT_SAVE_VERSION) return { ok: false, error: `Save version ${version} is newer than this game supports` };
  while ((version as number) < CURRENT_SAVE_VERSION) {
    const step = migrations[version as number];
    if (!step) return { ok: false, error: `No migration from version ${version}` };
    try {
      cur = step(cur);
    } catch {
      return { ok: false, error: `Migration from version ${version} failed` };
    }
    version = (version as number) + 1;
    cur.version = version;
  }
  return validateSave(cur);
}

/** Validates and sanitises a version-current save. Unknown ids are dropped, numbers clamped. */
export function validateSave(raw: unknown): SaveResult {
  if (!isObj(raw)) return { ok: false, error: 'Save is not an object' };
  if (raw.version !== CURRENT_SAVE_VERSION) return { ok: false, error: 'Unexpected save version' };
  if (!isObj(raw.profile)) return { ok: false, error: 'Missing profile' };
  const p = raw.profile;
  const base = createProfile();

  const level = Math.floor(num(p.level, 1, MAX_LEVEL, 1));
  const xp = Math.floor(num(p.xp, 0, xpToNext(level) - 1, 0));

  const abilities = { ...base.abilities };
  const rawAb = isObj(p.abilities) ? p.abilities : {};
  for (const id of ABILITY_ORDER) abilities[id as AbilityId] = Math.floor(num(rawAb[id], 0, ABILITIES[id].maxRank, 0));

  const attributes = { ...base.attributes };
  const rawAttr = isObj(p.attributes) ? p.attributes : {};
  for (const id of ATTRIBUTE_ORDER) attributes[id as AttributeId] = Math.floor(num(rawAttr[id], 0, ATTRIBUTES[id].maxRank, 0));

  // Spent points must be consistent with the level, otherwise someone edited the save.
  let spent = 0;
  for (const id of ABILITY_ORDER) for (let r = 0; r < abilities[id]; r++) spent += ABILITIES[id].rankCosts[r] ?? 1;
  for (const id of ATTRIBUTE_ORDER) spent += attributes[id];
  const earned = level; // 1 at start + (level - 1)
  const skillPoints = Math.floor(num(p.skillPoints, 0, 99, 0));
  if (spent + skillPoints > earned) return { ok: false, error: 'Skill points do not match level' };

  const quests: ProfileData['quests'] = {};
  if (isObj(p.quests)) {
    for (const [id, v] of Object.entries(p.quests)) {
      const def = QUESTS[id];
      if (!def || !isObj(v)) continue;
      const status = v.status as QuestStatus;
      if (!['active', 'ready', 'completed'].includes(status)) continue;
      const progress = def.objectives.map((o, i) => {
        const arr = Array.isArray(v.progress) ? v.progress : [];
        return Math.floor(num(arr[i], 0, o.count, 0));
      });
      quests[id] = { status, progress };
    }
  }

  const items: ProfileData['inventory']['items'] = {};
  const inv = isObj(p.inventory) ? p.inventory : {};
  if (isObj(inv.items)) {
    for (const id of Object.keys(ITEMS)) {
      const n = Math.floor(num(inv.items[id], 0, 999, 0));
      if (n > 0) items[id as ItemId] = n;
    }
  }

  const flags: Record<string, boolean> = {};
  if (isObj(p.flags)) for (const [k, v] of Object.entries(p.flags)) if (v === true && k.length < 64) flags[k] = true;

  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.length < 64).slice(0, 256) : [];

  let checkpoint: CheckpointRef = { ...START_CHECKPOINT };
  if (isObj(p.checkpoint) && REGIONS.includes(p.checkpoint.region as RegionId) && typeof p.checkpoint.id === 'string') {
    checkpoint = {
      region: p.checkpoint.region as RegionId,
      id: p.checkpoint.id.slice(0, 32),
      x: num(p.checkpoint.x, 0, 20000, START_CHECKPOINT.x),
      y: num(p.checkpoint.y, 0, 5000, START_CHECKPOINT.y),
    };
  }

  const stats = isObj(p.stats) ? p.stats : {};
  const profile: ProfileData = {
    level, xp, skillPoints, abilities, attributes,
    health: 0,
    quests,
    defeatedBosses: strArr(p.defeatedBosses),
    flags,
    collected: strArr(p.collected),
    checkpoint,
    inventory: { items, gold: Math.floor(num(inv.gold, 0, 9_999_999, 0)) },
    stats: {
      kills: Math.floor(num(stats.kills, 0, 1e7, 0)),
      deaths: Math.floor(num(stats.deaths, 0, 1e6, 0)),
      playTimeMs: Math.floor(num(stats.playTimeMs, 0, 1e11, 0)),
    },
  };
  const maxHealth = deriveStats(profile).maxHealth;
  profile.health = num(p.health, 1, maxHealth, maxHealth);

  return { ok: true, save: { version: CURRENT_SAVE_VERSION, savedAt: num(raw.savedAt, 0, 1e15, Date.now()), profile } };
}

export function serializeSave(profile: ProfileData): SaveFile {
  return { version: CURRENT_SAVE_VERSION, savedAt: Date.now(), profile: structuredClone(profile) };
}
