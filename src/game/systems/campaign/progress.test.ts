import { describe, expect, it } from 'vitest';
import { buildCampaign } from './progress';
import { createProfile } from '@/game/systems/progression/profile';
import { migrate, serializeSave } from '@/persistence/save-schema';
import { WORLD_PACKS } from '@/game/world/worlds';
import type { BossId } from '@/shared/types';
import type { WorldPack } from '@/game/world/types';

const statuses = (p: ReturnType<typeof createProfile>, packs?: WorldPack[]) => buildCampaign(p, packs).worlds.map((w) => w.status);

describe('campaign progress', () => {
  it('new player: first world available, the rest locked, 0%', () => {
    const c = buildCampaign(createProfile());
    expect(c.worlds.map((w) => w.status)).toEqual(['unlocked', 'locked', 'locked']);
    expect(c.total).toBe(WORLD_PACKS.length);
    expect(c.completed).toBe(0);
    expect(c.percent).toBe(0);
    expect(c.current?.number).toBe(1);
    expect(c.worlds[1].requiresBossName).toBe('Iron Warden Kaizo');
  });

  it('defeating a boss completes its world and unlocks the next, no further', () => {
    const p = createProfile();
    p.defeatedBosses = ['warden'];
    expect(statuses(p)).toEqual(['completed', 'unlocked', 'locked']);
    p.defeatedBosses = ['warden', 'marrow'];
    expect(statuses(p)).toEqual(['completed', 'completed', 'unlocked']);
  });

  it('does not unlock out of order', () => {
    const p = createProfile();
    p.defeatedBosses = ['ignis'];
    expect(statuses(p)).toEqual(['unlocked', 'locked', 'completed']);
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
    p.defeatedBosses = ['warden', 'marrow'];
    p.checkpoint = { region: 'foundry', id: 'fd_gate', x: 640, y: 900 };
    const r = migrate(JSON.parse(JSON.stringify(serializeSave(p))));
    expect(r.ok && buildCampaign(r.save.profile)).toEqual(buildCampaign(p));
  });

  it('a newly registered pack is listed automatically, locked until the previous boss falls', () => {
    const extra: WorldPack = {
      id: 'extra', themes: [],
      regions: [
        { ...WORLD_PACKS[2].regions[0], id: 'x_city' as never, name: 'Extra City' },
        { ...WORLD_PACKS[2].regions[1], id: 'x_arena' as never, boss: { id: 'extra' as BossId, x: 1, barrierX: 1 } },
      ],
    };
    const packs = [...WORLD_PACKS, extra];
    const p = createProfile();
    p.defeatedBosses = ['warden', 'marrow'];
    expect(buildCampaign(p, packs).total).toBe(4);
    expect(statuses(p, packs)).toEqual(['completed', 'completed', 'unlocked', 'locked']);
    p.defeatedBosses.push('ignis');
    const c = buildCampaign(p, packs);
    expect(c.worlds[3].status).toBe('unlocked');
    expect(c.percent).toBe(75);
  });
});
