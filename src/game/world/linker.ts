import type { RegionDef, Rect4, ZoneDef } from '@/game/config/regions';
import type { DecorDef } from '@/game/config/regions';
import type { WorldPackMeta } from './types';

const DEFAULT_BACK: Rect4 = { x: 60, y: 820, w: 110, h: 140 };
const defaultForward = (w: number): Rect4 => ({ x: w - 230, y: 820, w: 110, h: 140 });

/** Spawn names the linker relies on. Region builders must provide them (checked by worlds.test.ts). */
export const SPAWN = {
  /** In every arena: where you appear when walking in from the city. */
  arenaEntry: 'entry',
  /** In every arena: where you appear when walking back from the next world. */
  arenaFromNext: 'from_east',
  /** In every city: where you appear when coming back from your own boss arena. */
  cityFromArena: 'from_arena',
  /** In every city except the first: where you appear when arriving from the previous world's arena. */
  cityFromPrev: 'from_west',
} as const;

/**
 * Adds the campaign's exits from pack order alone. A world never names its neighbours; adding world N+1 changes
 * nothing in world N's source, only what this function derives when N is linked.
 *
 *   previous arena -> city -> arena -> next city
 */
export function linkWorld(packs: WorldPackMeta[], index: number, city: RegionDef, arena: RegionDef): void {
  const pack = packs[index], prev = packs[index - 1], next = packs[index + 1];
  const has = (r: RegionDef, id: string): boolean => r.zones.some((z) => z.id === id);
  const exit = (id: string, r: Rect4, to: string, spawn: string, requiresBoss?: string): ZoneDef =>
    ({ id, kind: 'exit', x: r.x, y: r.y, w: r.w, h: r.h, to, spawn, ...(requiresBoss ? { requiresBoss } : {}) });

  if (!has(city, 'to_arena')) city.zones.push(exit('to_arena', city.portals?.forward ?? defaultForward(city.width), pack.arenaRegion, SPAWN.arenaEntry));
  if (prev && !has(city, 'to_prev')) city.zones.push(exit('to_prev', city.portals?.back ?? DEFAULT_BACK, prev.arenaRegion, SPAWN.arenaFromNext));

  if (!has(arena, 'to_back')) arena.zones.push(exit('to_back', { x: 40, y: 820, w: 110, h: 140 }, pack.cityRegion, SPAWN.cityFromArena));
  if (next && !has(arena, 'to_next')) {
    const door: DecorDef = { id: 'd_next', kind: 'door', x: arena.width - 160, y: 820, w: 110, h: 140, seed: 7919 * 977, text: next.doorLabel };
    arena.decor.push(door);
    arena.zones.push(exit('to_next', door, next.cityRegion, SPAWN.cityFromPrev, pack.boss.id));
  }
}
