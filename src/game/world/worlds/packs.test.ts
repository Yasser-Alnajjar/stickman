import { describe, expect, it } from 'vitest';
import { BUILTIN_PATTERNS } from '@/game/config/enemies';
import '@/game/config/items';
import { ENEMY_ATTACKS } from '@/game/config/attacks';
import { REGIONS } from '@/game/config/regions';
import { AR } from '@/i18n/ar';
import { ACCESSORIES } from '@/game/animations/accessories';
import { BOSSES, BOSS_MOVES, ENEMIES, ITEMS, QUESTS, THEMES, WORLD_PACKS } from '../stores';
import { allRegionIds, packOfRegion } from '../registry';
import { SPAWN } from '../linker';
import { loadedPackIds, loadPack, trimPacks, unloadPack } from '../loader';

describe('world pack registry', () => {
  it('ten worlds, unique ids, one boss and one arena each', () => {
    expect(WORLD_PACKS.length).toBe(10);
    for (const key of ['id', 'cityRegion', 'arenaRegion', 'cityTheme', 'arenaTheme'] as const) expect(new Set(WORLD_PACKS.map((p) => p[key])).size, key).toBe(10);
    expect(new Set(WORLD_PACKS.map((p) => p.boss.id)).size).toBe(10);
    expect(Object.keys(BOSSES).length).toBe(10);
    expect(new Set(allRegionIds()).size).toBe(20);
    for (const p of WORLD_PACKS) {
      expect(REGIONS[p.cityRegion].boss, p.id).toBeUndefined();
      expect(REGIONS[p.arenaRegion].boss?.id, p.id).toBe(p.boss.id);
      expect(REGIONS[p.cityRegion].theme).toBe(p.cityTheme);
      expect(REGIONS[p.arenaRegion].theme).toBe(p.arenaTheme);
    }
  });

  it('every pack has localized names, descriptions and a boss subtitle', () => {
    for (const p of WORLD_PACKS) for (const k of [p.name, p.description, p.tagline, p.doorLabel, p.boss.name, p.boss.subtitle, REGIONS[p.arenaRegion].name]) expect(AR[k], `${p.id}: "${k}"`).toBeTruthy();
  });

  it('spawn tables only use registered enemies; summons and quests reference real things', () => {
    for (const r of Object.values(REGIONS)) for (const s of r.spawns) expect(ENEMIES[s.kind], `${r.id}.${s.id}`).toBeDefined();
    for (const b of Object.values(BOSSES)) {
      for (const k of b.summon?.kinds ?? []) expect(ENEMIES[k], `${b.id} summon ${k}`).toBeDefined();
      expect(ITEMS[b.drop], `${b.id} drop`).toBeDefined();
    }
    for (const q of Object.values(QUESTS)) {
      for (const o of q.objectives) {
        if (o.type === 'kill' && o.target !== 'any') expect(ENEMIES[o.target], `${q.id}`).toBeDefined();
        if (o.type === 'collect') expect(ITEMS[o.target], `${q.id}`).toBeDefined();
        if (o.type === 'boss') expect(BOSSES[o.target], `${q.id}`).toBeDefined();
      }
      for (const i of Object.keys(q.reward.items ?? {})) expect(ITEMS[i], `${q.id} reward`).toBeDefined();
      expect(WORLD_PACKS.some((p) => p.id === q.world), q.id).toBe(true);
    }
    for (const r of Object.values(REGIONS)) for (const p of r.pickups) expect(ITEMS[p.item], `${r.id}.${p.id}`).toBeDefined();
  });

  it('every enemy attack, accessory and boss pattern resolves', () => {
    for (const e of Object.values(ENEMIES)) {
      for (const a of e.attacks) expect(ENEMY_ATTACKS[a.id], `${e.kind}.${a.id}`).toBeDefined();
      if (e.ranged) expect(ENEMY_ATTACKS[e.ranged.attackId], e.kind).toBeDefined();
      expect(ACCESSORIES[e.style.accessory], `${e.kind} accessory`).toBeDefined();
    }
    for (const b of Object.values(BOSSES)) {
      expect(ACCESSORIES[b.style.accessory], `${b.id} accessory`).toBeDefined();
      for (const base of ['swing1', 'swing2', 'swing3', 'slam', 'charge', 'leap', 'wave']) expect(ENEMY_ATTACKS[`${b.prefix}_${base}`], `${b.id}.${base}`).toBeDefined();
      for (const p of b.patterns) {
        const custom = BOSS_MOVES[b.id]?.[p.id];
        expect((BUILTIN_PATTERNS as readonly string[]).includes(p.id) || !!custom, `${b.id} pattern ${p.id}`).toBe(true);
        if (p.id === 'volley') expect(b.volley, b.id).toBeDefined();
        if (['volley', 'rain', 'pillars', 'whirl'].includes(p.id)) expect(ENEMY_ATTACKS[`${b.prefix}_${p.id}`], `${b.id}.${p.id}`).toBeDefined();
      }
    }
  });

  it('every new boss has its own scripted moves, not just a re-tuned attack set', () => {
    for (const p of WORLD_PACKS.slice(3)) {
      const custom = p.boss.patterns.filter((x) => !(BUILTIN_PATTERNS as readonly string[]).includes(x.id));
      expect(custom.length, p.boss.id).toBeGreaterThanOrEqual(4);
      expect(Object.keys(BOSS_MOVES[p.boss.id]).length, p.boss.id).toBeGreaterThanOrEqual(4);
    }
    const sets = WORLD_PACKS.slice(3).map((p) => Object.keys(BOSS_MOVES[p.boss.id]).sort().join());
    expect(new Set(sets).size).toBe(7);
  });

  it('difficulty rises with every world (enemy scale, boss health)', () => {
    let prevScale = 0, prevBoss = 0;
    for (const p of WORLD_PACKS) {
      const s = REGIONS[p.cityRegion].enemyScale!;
      expect(s.hp, p.id).toBeGreaterThanOrEqual(prevScale);
      expect(p.boss.maxHealth, p.id).toBeGreaterThan(prevBoss);
      prevScale = s.hp; prevBoss = p.boss.maxHealth;
    }
  });

  it('new worlds introduce their own enemies and spawn all of them', () => {
    for (const p of WORLD_PACKS.slice(3)) expect(Object.keys(p.enemies ?? {}).length, p.id).toBeGreaterThanOrEqual(3);
    for (const p of WORLD_PACKS.slice(3)) {
      const kinds = new Set(REGIONS[p.cityRegion].spawns.map((s) => s.kind));
      for (const k of Object.keys(p.enemies!)) expect(kinds.has(k), `${p.id} never spawns ${k}`).toBe(true);
    }
  });
});

describe('region links', () => {
  it('city -> arena -> next city, with reciprocal exits and valid spawns', () => {
    WORLD_PACKS.forEach((p, i) => {
      const city = REGIONS[p.cityRegion], arena = REGIONS[p.arenaRegion];
      const exits = (r: typeof city): Record<string, { to: string; spawn: string; req?: string }> => Object.fromEntries(r.zones.filter((z) => z.kind === 'exit').map((z) => [z.id, { to: z.to!, spawn: z.spawn!, req: z.requiresBoss }]));
      const ce = exits(city), ae = exits(arena);
      expect(ce.to_arena).toMatchObject({ to: p.arenaRegion, spawn: SPAWN.arenaEntry });
      expect(ae.to_back).toMatchObject({ to: p.cityRegion, spawn: SPAWN.cityFromArena });
      if (i > 0) expect(ce.to_prev).toMatchObject({ to: WORLD_PACKS[i - 1].arenaRegion }); else expect(ce.to_prev).toBeUndefined();
      if (i < 9) expect(ae.to_next).toMatchObject({ to: WORLD_PACKS[i + 1].cityRegion, spawn: SPAWN.cityFromPrev, req: p.boss.id }); else expect(ae.to_next).toBeUndefined();
      expect(Object.keys(ce).length).toBe(i > 0 ? 2 : 1);
      for (const r of [city, arena]) for (const z of r.zones.filter((z) => z.kind === 'exit')) {
        expect(REGIONS[z.to!], `${r.id}.${z.id}`).toBeDefined();
        expect(REGIONS[z.to!].spawnPoints[z.spawn!], `${r.id}.${z.id} -> ${z.to}.${z.spawn}`).toBeDefined();
      }
    });
  });

  it('you can walk from world 1 to world 10 using exits alone', () => {
    const seen = new Set<string>(), queue = [WORLD_PACKS[0].cityRegion];
    while (queue.length) { const id = queue.pop()!; if (seen.has(id)) continue; seen.add(id); for (const z of REGIONS[id].zones) if (z.kind === 'exit') queue.push(z.to!); }
    expect([...seen].sort()).toEqual(allRegionIds().sort());
  });

  it('a world is its pack: regions resolve back to their owner', () => {
    for (const p of WORLD_PACKS) { expect(packOfRegion(p.cityRegion)?.id).toBe(p.id); expect(packOfRegion(p.arenaRegion)?.id).toBe(p.id); }
  });
});

describe('lazy loading and eviction', () => {
  it('trim keeps only the requested worlds and reloading restores them; nothing accumulates', async () => {
    const all = WORLD_PACKS.map((p) => p.id);
    trimPacks([all[0], all[1]]);
    expect(loadedPackIds().sort()).toEqual([all[0], all[1]].sort());
    expect(REGIONS[WORLD_PACKS[5].cityRegion]).toBeUndefined();
    expect(THEMES[WORLD_PACKS[5].cityTheme]).toBeUndefined();
    expect(BOSS_MOVES[WORLD_PACKS[5].boss.id]).toBeUndefined();
    for (let i = 0; i < 5; i++) { await loadPack(all[7]); unloadPack(all[7]); }
    expect(Object.keys(REGIONS).length).toBe(4);
    await loadPack(all[7]);
    expect(REGIONS[WORLD_PACKS[7].arenaRegion].boss?.id).toBe(WORLD_PACKS[7].boss.id);
    for (const id of all) await loadPack(id);
    expect(Object.keys(REGIONS).length).toBe(20);
  });
});
