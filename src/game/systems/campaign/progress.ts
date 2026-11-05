import type { BossId, ProfileData, RegionId } from '@/shared/types';
import type { WorldPackMeta } from '@/game/world/types';
import { WORLD_PACKS, BOSSES } from '@/game/world/stores';
import '@/game/world/worlds';
import { SPAWN } from '@/game/world/linker';

export type WorldStatus = 'completed' | 'unlocked' | 'locked';

export interface WorldEntry {
  /** 1-based position in campaign order. */
  number: number;
  packId: string;
  /** English source names (run through t() when displayed). */
  name: string;
  description: string;
  bossId?: BossId;
  bossName?: string;
  /** Theme ids used to paint the thumbnail. */
  cityTheme: string;
  arenaTheme?: string;
  cityRegion: RegionId;
  arenaRegion?: RegionId;
  status: WorldStatus;
  /** The saved checkpoint is inside this world. Independent of `status`: a finished world can still be current. */
  current: boolean;
  /** Current and the checkpoint is in the boss arena. */
  inArena: boolean;
  /** Locked only: name of the boss that guards the way in. */
  requiresBossName?: string;
  /** Entry spawn when starting this world from the map. */
  spawn?: string;
}

export interface CampaignSummary {
  worlds: WorldEntry[];
  total: number;
  completed: number;
  percent: number;
  current?: WorldEntry;
}

/** The spawn used when starting a world from the map: world 1 uses its default start, later worlds their entrance. */
export function entrySpawn(number: number): string | undefined {
  return number === 1 ? undefined : SPAWN.cityFromPrev;
}

/** Whether the world at `index` may be entered: the first always, the others once the previous world's boss is down. */
export function isWorldUnlocked(profile: ProfileData, index: number, packs: WorldPackMeta[] = WORLD_PACKS): boolean {
  if (index <= 0) return index === 0 && packs.length > 0;
  const prev = packs[index - 1];
  return !!prev && profile.defeatedBosses.includes(prev.boss.id);
}

/**
 * Derives the whole campaign view from the save and the registered manifests. Rules: world 1 is always available,
 * world N unlocks when world N-1's boss is defeated, a world is completed when its own boss is defeated. Nothing is
 * stored beyond existing save data (`defeatedBosses` and `checkpoint`), so new packs appear automatically.
 * Needs no region data: it works on manifests alone, so no world has to be loaded to draw the map.
 */
export function buildCampaign(profile: ProfileData, packs: WorldPackMeta[] = WORLD_PACKS): CampaignSummary {
  const defeated = new Set(profile.defeatedBosses);
  const cpRegion = profile.checkpoint.region;
  const worlds: WorldEntry[] = packs.map((pack, i) => {
    const prev = packs[i - 1];
    const done = defeated.has(pack.boss.id);
    const status: WorldStatus = done ? 'completed' : isWorldUnlocked(profile, i, packs) ? 'unlocked' : 'locked';
    return {
      number: i + 1, packId: pack.id, name: pack.name, description: pack.description,
      bossId: pack.boss.id, bossName: BOSSES[pack.boss.id]?.name ?? pack.boss.name,
      cityTheme: pack.cityTheme, arenaTheme: pack.arenaTheme,
      cityRegion: pack.cityRegion, arenaRegion: pack.arenaRegion,
      status,
      current: status !== 'locked' && (pack.cityRegion === cpRegion || pack.arenaRegion === cpRegion),
      inArena: status !== 'locked' && pack.arenaRegion === cpRegion,
      requiresBossName: status === 'locked' && prev ? prev.boss.name : undefined,
      spawn: entrySpawn(i + 1),
    };
  });
  const completed = worlds.filter((w) => w.status === 'completed').length;
  return {
    worlds, total: worlds.length, completed,
    percent: worlds.length ? Math.floor((completed / worlds.length) * 100) : 0,
    current: worlds.find((w) => w.current),
  };
}

/** The pack that owns a region plus whether the player may be there; `undefined` for unknown regions. */
export function regionAccess(profile: ProfileData, regionId: string, packs: WorldPackMeta[] = WORLD_PACKS): { pack: WorldPackMeta; index: number; unlocked: boolean } | undefined {
  const index = packs.findIndex((p) => p.cityRegion === regionId || p.arenaRegion === regionId);
  if (index < 0) return undefined;
  return { pack: packs[index], index, unlocked: isWorldUnlocked(profile, index, packs) };
}
