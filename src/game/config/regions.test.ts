import { describe, expect, it } from 'vitest';
import { REGIONS, type RegionDef } from './regions';
import { PLAYER_CFG } from './player';
import { GRAVITY } from '@/shared/constants';

interface Surface { id: string; x0: number; x1: number; top: number }

const MAX_RISE = (PLAYER_CFG.jumpVelocity ** 2) / (2 * GRAVITY) - 18; // safety margin
const V = PLAYER_CFG.jumpVelocity;
/** Horizontal reach of a full jump that lands `rise` px above the take-off surface (80% speed efficiency, minus a margin). */
function reach(rise: number): number {
  const disc = V * V - 2 * GRAVITY * rise;
  if (disc < 0) return 0;
  const t = (V + Math.sqrt(disc)) / GRAVITY;
  return 0.8 * PLAYER_CFG.runSpeed * t - 20;
}

function surfaces(r: RegionDef): Surface[] {
  const out: Surface[] = [];
  for (const s of r.solids) if (s.kind !== 'wall' && s.kind !== 'gate') out.push({ id: s.id, x0: s.x, x1: s.x + s.w, top: s.y });
  for (const o of r.oneWays) out.push({ id: o.id, x0: o.x, x1: o.x + o.w, top: o.y });
  return out;
}

function reachable(r: RegionDef): Set<string> {
  const all = surfaces(r);
  const ground = all.filter((s) => s.id.startsWith('ground'));
  const seen = new Set<string>(ground.map((g) => g.id));
  const queue = [...ground];
  while (queue.length) {
    const a = queue.pop()!;
    for (const b of all) {
      if (seen.has(b.id)) continue;
      const gap = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1));
      const rise = a.top - b.top; // positive = b is higher
      const ok = rise <= MAX_RISE && gap <= reach(rise);
      if (ok) { seen.add(b.id); queue.push(b); }
    }
  }
  return seen;
}

describe.each(Object.values(REGIONS))('region $id layout', (region) => {
  it('every platform can be reached with the player\'s jump limits', () => {
    const seen = reachable(region);
    const unreachable = surfaces(region).filter((s) => !seen.has(s.id)).map((s) => s.id);
    expect(unreachable).toEqual([]);
  });

  it('ground covers the whole region without gaps', () => {
    const g = region.solids.filter((s) => s.id.startsWith('ground')).sort((a, b) => a.x - b.x);
    expect(g[0].x).toBe(0);
    for (let i = 1; i < g.length; i++) expect(g[i].x).toBe(g[i - 1].x + g[i - 1].w);
    expect(g[g.length - 1].x + g[g.length - 1].w).toBe(region.width);
  });

  it('pickups, spawns, NPCs and checkpoints lie inside the region', () => {
    const inside = (x: number): boolean => x > 0 && x < region.width;
    region.pickups.forEach((p) => expect(inside(p.x)).toBe(true));
    region.spawns.forEach((p) => expect(inside(p.x)).toBe(true));
    region.npcs.forEach((p) => expect(inside(p.x)).toBe(true));
    region.checkpoints.forEach((p) => expect(inside(p.x)).toBe(true));
  });

  it('ids are unique', () => {
    const ids = [...region.solids.map((s) => s.id), ...region.oneWays.map((s) => s.id), ...region.decor.map((s) => s.id)];
    expect(new Set(ids).size).toBe(ids.length);
    const pk = region.pickups.map((p) => p.id);
    expect(new Set(pk).size).toBe(pk.length);
  });
});

describe('city specifics', () => {
  const city = REGIONS.city;
  it('hidden room has enough headroom for the player', () => {
    const ceiling = city.solids.find((s) => s.id === 'ceilW')!;
    const floor = city.solids.find((s) => s.id === 'roofW')!;
    expect(floor.y - (ceiling.y + ceiling.h)).toBeGreaterThanOrEqual(PLAYER_CFG.height + 8);
  });
  it('keycard and beacon exist and the exit requires crossing the gate', () => {
    expect(city.pickups.some((p) => p.item === 'keycard')).toBe(true);
    expect(city.zones.some((z) => z.id === 'beacon' && z.kind === 'reach')).toBe(true);
    const gate = city.solids.find((s) => s.kind === 'gate')!;
    const exit = city.zones.find((z) => z.kind === 'exit')!;
    expect(gate.x).toBeLessThan(exit.x);
    expect(gate.h).toBeGreaterThan(MAX_RISE + 88);
  });
});

describe('world graph', () => {
  const all = Object.values(REGIONS);
  it('every exit leads to an existing region and spawn point', () => {
    for (const r of all) for (const z of r.zones.filter((z) => z.kind === 'exit')) {
      expect(REGIONS[z.to!], `${r.id}.${z.id}`).toBeDefined();
      expect(REGIONS[z.to!].spawnPoints[z.spawn!], `${r.id}.${z.id} -> ${z.to}.${z.spawn}`).toBeDefined();
    }
  });
  it('spawn ids are unique per region (they key the persistent kill list)', () => {
    for (const r of all) {
      const ids = r.spawns.map((s) => s.id);
      expect(new Set(ids).size, r.id).toBe(ids.length);
      expect(ids.every((id) => !id.includes(':')), r.id).toBe(true);
    }
  });
  it('has three boss arenas, each with a distinct boss and enough regular enemies overall', () => {
    const bosses = all.filter((r) => r.boss).map((r) => r.boss!.id);
    expect(new Set(bosses).size).toBe(3);
    expect(all.reduce((n, r) => n + r.spawns.length, 0)).toBeGreaterThanOrEqual(80);
  });
  it('arena exits that lead onward stay locked behind their boss', () => {
    for (const r of all.filter((r) => r.boss)) for (const z of r.zones.filter((z) => z.id === 'to_next')) expect(z.requiresBoss).toBe(r.boss!.id);
  });
  it('enemy placement never starts inside the first 450px of a stage entry', () => {
    for (const r of all) for (const s of r.spawns) if (r.id !== 'city') expect(s.x, `${r.id}.${s.id}`).toBeGreaterThan(700);
  });
});
