import type { BossId, ProfileData, RegionId } from '@/shared/types';
import type { WorldPack } from '@/game/world/types';
import type { RegionDef } from '@/game/config/regions';
import { WORLD_PACKS } from '@/game/world/worlds';
import { BOSSES } from '@/game/config/enemies';

export type WorldStatus = 'completed' | 'unlocked' | 'locked';

export interface WorldEntry {
  /** 1-based position in campaign order. */
  number: number;
  packId: string;
  /** English source names (run through t() when displayed). */
  name: string;
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

/** A world is its pack's first region (the city) plus its boss arena, if any. Built purely from registered packs. */
function describe(pack: WorldPack): { city: RegionDef; arena?: RegionDef; bossId?: BossId } {
  const arena = pack.regions.find((r) => r.boss);
  const city = pack.regions.find((r) => r !== arena) ?? pack.regions[0];
  return { city, arena, bossId: arena?.boss?.id };
}

export function entrySpawn(city: RegionDef, number: number): string | undefined {
  if (number === 1) return undefined;
  return ['from_west', 'entry'].find((k) => k in city.spawnPoints);
}

/**
 * Derives the whole campaign view from the save. Rules: world 1 is always available, world N unlocks when world N-1's
 * boss is defeated, a world is completed when its own boss is defeated. Nothing is stored beyond existing save data
 * (`defeatedBosses` and `checkpoint`), so new packs appear automatically.
 */
export function buildCampaign(profile: ProfileData, packs: WorldPack[] = WORLD_PACKS): CampaignSummary {
  const defeated = new Set(profile.defeatedBosses);
  const cpRegion = profile.checkpoint.region;
  const parts = packs.map(describe);
  const worlds: WorldEntry[] = parts.map((d, i) => {
    const prev = parts[i - 1];
    const done = !!d.bossId && defeated.has(d.bossId);
    const open = i === 0 || !prev.bossId || defeated.has(prev.bossId);
    const regions = packs[i].regions.map((r) => r.id);
    const status: WorldStatus = done ? 'completed' : open ? 'unlocked' : 'locked';
    return {
      number: i + 1, packId: packs[i].id, name: d.city.name,
      bossId: d.bossId, bossName: d.bossId ? BOSSES[d.bossId]?.name : undefined,
      cityTheme: d.city.theme, arenaTheme: d.arena?.theme,
      cityRegion: d.city.id, arenaRegion: d.arena?.id,
      status,
      current: status !== 'locked' && regions.includes(cpRegion),
      inArena: status !== 'locked' && d.arena?.id === cpRegion,
      requiresBossName: status === 'locked' && prev?.bossId ? BOSSES[prev.bossId]?.name : undefined,
      spawn: entrySpawn(d.city, i + 1),
    };
  });
  const completed = worlds.filter((w) => w.status === 'completed').length;
  return {
    worlds, total: worlds.length, completed,
    percent: worlds.length ? Math.floor((completed / worlds.length) * 100) : 0,
    current: worlds.find((w) => w.current),
  };
}
