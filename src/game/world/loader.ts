import '@/game/world/worlds';
import { REGIONS, THEMES, BOSS_MOVES, WORLD_PACKS } from './stores';
import { linkWorld } from './linker';
import { packOfRegion } from './registry';
import type { WorldPackContent, WorldPackMeta, WorldTheme } from './types';

/**
 * On-demand world loading. A manifest is always resident; a world's code (themes, level builders, boss scripts) is
 * fetched with a dynamic import the first time it is needed, and its *regions* (the big arrays of platforms, decor
 * and spawns) are only built while the world is adjacent to where the player is. `trimPacks` drops the rest.
 */

interface Loaded { regionIds: string[]; themeIds: string[]; bossId: string }

const loaded = new Map<string, Loaded>();
const building = new Map<string, Promise<void>>();
/** Module code is cached forever (small); only the data built from it is evicted. */
const contentCache = new Map<string, Promise<WorldPackContent>>();

function metaOf(packId: string): WorldPackMeta {
  const m = WORLD_PACKS.find((p) => p.id === packId);
  if (!m) throw new Error(`Unknown world pack "${packId}"`);
  return m;
}

/** Fetches a pack's content module (cached). Does not build regions and registers nothing. */
export function packContent(packId: string): Promise<WorldPackContent> {
  let p = contentCache.get(packId);
  if (!p) contentCache.set(packId, (p = metaOf(packId).load()));
  return p;
}

export function isPackLoaded(packId: string): boolean {
  return loaded.has(packId);
}

export function loadedPackIds(): string[] {
  return [...loaded.keys()];
}

/** Builds and registers a pack's regions, themes and boss scripts, and links them into the campaign. */
export function loadPack(packId: string): Promise<void> {
  if (loaded.has(packId)) return Promise.resolve();
  let job = building.get(packId);
  if (!job) {
    job = (async () => {
      const content = await packContent(packId);
      const index = WORLD_PACKS.findIndex((p) => p.id === packId);
      const meta = WORLD_PACKS[index];
      const [city, arena] = content.buildRegions();
      linkWorld(WORLD_PACKS, index, city, arena);
      REGIONS[city.id] = city;
      REGIONS[arena.id] = arena;
      for (const t of content.themes) THEMES[t.id] = t;
      if (content.moves) BOSS_MOVES[meta.boss.id] = content.moves;
      loaded.set(packId, { regionIds: [city.id, arena.id], themeIds: content.themes.map((t) => t.id), bossId: meta.boss.id });
    })().finally(() => building.delete(packId));
    building.set(packId, job);
  }
  return job;
}

/** Makes sure the pack that owns `regionId` is loaded. Rejects for ids no pack defines. */
export async function ensureRegion(regionId: string): Promise<void> {
  const pack = packOfRegion(regionId);
  if (!pack) throw new Error(`Unknown region "${regionId}"`);
  await loadPack(pack.id);
}

/** Forgets a pack's built regions and registered themes/scripts. Its code stays cached for a cheap reload. */
export function unloadPack(packId: string): void {
  const l = loaded.get(packId);
  if (!l) return;
  for (const id of l.regionIds) delete REGIONS[id];
  for (const id of l.themeIds) delete THEMES[id];
  delete BOSS_MOVES[l.bossId];
  loaded.delete(packId);
}

/**
 * Evicts every loaded pack except `keep` (the one being played, its two neighbours, and the first world whose
 * theme paints the main menu). Called on every world start, so memory stays flat however far the campaign goes.
 */
export function trimPacks(keep: Iterable<string>): void {
  const k = new Set(keep);
  for (const id of [...loaded.keys()]) if (!k.has(id)) unloadPack(id);
}

/** The pack ids worth keeping while `regionId` is being played: itself, its neighbours and the first world. */
export function neighbourhood(regionId: string): string[] {
  const i = WORLD_PACKS.findIndex((p) => p.cityRegion === regionId || p.arenaRegion === regionId);
  const ids = new Set<string>();
  if (WORLD_PACKS[0]) ids.add(WORLD_PACKS[0].id);
  for (const j of [i - 1, i, i + 1]) if (WORLD_PACKS[j]) ids.add(WORLD_PACKS[j].id);
  return [...ids];
}

/** A theme for UI previews: loads the pack's module but registers nothing and builds no regions. */
export async function themeAsync(themeId: string): Promise<WorldTheme | undefined> {
  const live = THEMES[themeId];
  if (live) return live;
  const pack = WORLD_PACKS.find((p) => p.cityTheme === themeId || p.arenaTheme === themeId);
  if (!pack) return undefined;
  return (await packContent(pack.id)).themes.find((t) => t.id === themeId);
}

/** Loads every pack (tests and tooling only; the game never does this). */
export async function loadAllPacks(): Promise<void> {
  for (const p of WORLD_PACKS) await loadPack(p.id);
}
