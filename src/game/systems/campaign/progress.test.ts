import { describe, expect, it } from 'vitest';
import { buildCampaign, isWorldUnlocked, regionAccess } from './progress';
import { createProfile } from '@/game/systems/progression/profile';
import { migrate, serializeSave } from '@/persistence/save-schema';
import { WORLD_PACKS } from '@/game/world/stores';
import type { WorldPackMeta } from '@/game/world/types';

const statuses = (p: ReturnType<typeof createProfile>, packs?: WorldPackMeta[]) => buildCampaign(p, packs).worlds.map((w) => w.status);
const bosses = WORLD_PACKS.map((p) => p.boss.id);

describe('campaign progress', () => {
  it('has the ten worlds in order', () => {
    expect(WORLD_PACKS.map((p) => p.name)).toEqual(['Neon Street', 'Rust Docks', 'Ember Foundry', 'Jade Ruins', 'Frostpeak Station', 'Dune Kingdom', 'Helios Ring', 'Hollow Wood', 'Cogwork Depths', 'Aether Citadel']);
    expect(bosses.length).toBe(10);
  });

  it('new player: world 1 available, worlds 2-10 locked, 0%', () => {
    const c = buildCampaign(createProfile());
    expect(c.worlds.map((w) => w.status)).toEqual(['unlocked', ...Array(9).fill('locked')]);
    expect(c.total).toBe(10);
    expect(c.completed).toBe(0);
    expect(c.percent).toBe(0);
    expect(c.current?.number).toBe(1);
    expect(c.worlds[1].requiresBossName).toBe('Iron Warden Kaizo');
  });

  it('defeating a boss completes its world and unlocks exactly the next one', () => {
    for (let i = 0; i < 10; i++) {
      const p = createProfile();
      p.defeatedBosses = bosses.slice(0, i + 1);
      const s = statuses(p);
      expect(s.filter((x) => x === 'completed').length).toBe(i + 1);
      if (i < 9) { expect(s[i + 1]).toBe('unlocked'); expect(s.slice(i + 2).every((x) => x === 'locked')).toBe(true); }
    }
  });

  it('does not unlock out of order', () => {
    const p = createProfile();
    p.defeatedBosses = ['ignis'];
    expect(statuses(p).slice(0, 4)).toEqual(['unlocked', 'locked', 'completed', 'unlocked']);
  });

  it('highlights the world of the saved checkpoint and flags the arena', () => {
    const p = createProfile();
    p.defeatedBosses = ['warden'];
    p.checkpoint = { region: 'docks', id: 'dock_gate', x: 640, y: 900 };
    expect(buildCampaign(p).current?.number).toBe(2);
    p.checkpoint = { region: 'tyrant_arena', id: 'quay', x: 100, y: 900 };
    const c = buildCampaign(p);
    expect(c.current?.number).toBe(2);
    expect(c.current?.inArena).toBe(true);
  });

  it('is identical after a save round trip', () => {
    const p = createProfile();
    p.defeatedBosses = bosses.slice(0, 5);
    p.checkpoint = { region: 'frostpeak', id: 'fp_gate', x: 640, y: 900 };
    const r = migrate(JSON.parse(JSON.stringify(serializeSave(p))));
    expect(r.ok && buildCampaign(r.save.profile)).toEqual(buildCampaign(p));
  });

  it('a newly registered pack is listed automatically, locked until the previous boss falls', () => {
    const extra: WorldPackMeta = { ...WORLD_PACKS[9], id: 'extra', name: 'Extra', cityRegion: 'x_city', arenaRegion: 'x_arena', boss: { ...WORLD_PACKS[9].boss, id: 'extra_boss' } };
    const packs = [...WORLD_PACKS, extra];
    const p = createProfile();
    p.defeatedBosses = bosses.slice(0, 9);
    expect(buildCampaign(p, packs).total).toBe(11);
    expect(statuses(p, packs)).toEqual([...Array(9).fill('completed'), 'unlocked', 'locked']);
    p.defeatedBosses.push(bosses[9]);
    expect(buildCampaign(p, packs).worlds[10].status).toBe('unlocked');
  });

  it('region access: unknown regions and locked worlds are refused', () => {
    const p = createProfile();
    expect(regionAccess(p, 'nowhere')).toBeUndefined();
    expect(regionAccess(p, 'city')?.unlocked).toBe(true);
    expect(regionAccess(p, 'docks')?.unlocked).toBe(false);
    expect(regionAccess(p, 'zephyros_arena')?.unlocked).toBe(false);
    p.defeatedBosses = ['warden'];
    expect(regionAccess(p, 'docks')?.unlocked).toBe(true);
    expect(isWorldUnlocked(p, 2)).toBe(false);
  });
});
