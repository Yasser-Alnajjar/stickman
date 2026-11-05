import type { AbilityId, AttributeId, CheckpointRef, ItemId, ProfileData, QuestStatus, RegionId } from '@/shared/types';
import { ABILITIES, ABILITY_ORDER } from '@/game/config/abilities';
import { ATTRIBUTES, ATTRIBUTE_ORDER, MAX_LEVEL, xpToNext } from '@/game/config/progression';
import { ITEMS } from '@/game/config/items';
import { QUESTS } from '@/game/config/quests';
import { createProfile, deriveStats, startCheckpoint } from '@/game/systems/progression/profile';
import { allRegionIds } from '@/game/world/registry';
import { qualifyLegacyCollected } from './legacy-v1';

/**
 * v1 -> v2: pickups are stored per region (`region:pickupId`) and every region remembers its own last checkpoint.
 * v2 also lifted the old 256/2048 list caps (nothing in a save is ever truncated).
 */
export const CURRENT_SAVE_VERSION = 2;

export interface SaveFile {
  version: number;
  savedAt: number;
  profile: ProfileData;
}

export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;
/** migrations[n] upgrades a version-n save to version n+1. */
export const MIGRATIONS: Record<number, Migration> = {
  1: (raw) => {
    const profile = isObj(raw.profile) ? { ...raw.profile } : {};
    profile.collected = qualifyLegacyCollected(profile.collected);
    // The one checkpoint a v1 save had becomes that region's entry in the per-region table.
    const cp = isObj(profile.checkpoint) ? profile.checkpoint : null;
    profile.checkpoints = cp && typeof cp.region === 'string' && typeof cp.id === 'string'
      ? { [cp.region]: { id: cp.id, x: cp.x, y: cp.y } }
      : {};
    return { ...raw, profile };
  },
};

/** Longest id/key accepted from a save: guards against garbage, nowhere near any real id. */
const MAX_KEY = 160;
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
  if (isObj(p.flags)) for (const [k, v] of Object.entries(p.flags)) if (v === true && k.length < MAX_KEY) flags[k] = true;

  // Progress lists are only de-duplicated and sanity-checked per entry: their length is never capped, so a longer
  // campaign can never lose a kill, a chest or a boss on load.
  const strList = (v: unknown): string[] =>
    Array.isArray(v) ? [...new Set(v.filter((s): s is string => typeof s === 'string' && s.length > 0 && s.length < MAX_KEY))] : [];

  const start = startCheckpoint();
  const known = new Set(allRegionIds());
  const cpOf = (v: unknown): { id: string; x: number; y: number } | null =>
    isObj(v) && typeof v.id === 'string' && v.id.length > 0 && v.id.length < MAX_KEY
      ? { id: v.id, x: num(v.x, 0, 40000, start.x), y: num(v.y, 0, 5000, start.y) }
      : null;
  // The active checkpoint must point at a region this build knows (otherwise there is nowhere to put the player);
  // everything else is kept as is so progress for regions not registered right now survives a round trip.
  let checkpoint: CheckpointRef = { ...start };
  if (isObj(p.checkpoint) && typeof p.checkpoint.region === 'string' && known.has(p.checkpoint.region)) {
    const c = cpOf(p.checkpoint);
    if (c) checkpoint = { region: p.checkpoint.region, ...c };
  }
  const checkpoints: ProfileData['checkpoints'] = {};
  if (isObj(p.checkpoints)) {
    for (const [region, v] of Object.entries(p.checkpoints)) {
      const c = region.length < MAX_KEY ? cpOf(v) : null;
      if (c) checkpoints[region] = c;
    }
  }
  if (!checkpoints[checkpoint.region]) checkpoints[checkpoint.region] = { id: checkpoint.id, x: checkpoint.x, y: checkpoint.y };

  const stats = isObj(p.stats) ? p.stats : {};
  const profile: ProfileData = {
    level, xp, skillPoints, abilities, attributes,
    health: 0,
    quests,
    defeatedBosses: strList(p.defeatedBosses),
    killedEnemies: strList(p.killedEnemies),
    flags,
    collected: strList(p.collected),
    checkpoint,
    checkpoints,
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
