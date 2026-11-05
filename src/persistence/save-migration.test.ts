import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION, migrate, serializeSave, validateSave } from './save-schema';
import { collectedKey, legacyPickupRegion } from './legacy-v1';
import { createProfile, startCheckpoint } from '@/game/systems/progression/profile';
import { REGIONS } from '@/game/config/regions';
import { spawnKey } from '@/game/systems/world/spawn-rules';
import { WORLD_PACKS } from '@/game/world/stores';

/** A save exactly as a version-1 build of the game wrote it (bare pickup ids, one checkpoint, three worlds). */
function v1Save(): Record<string, unknown> {
  const p = createProfile() as unknown as Record<string, unknown>;
  delete p.checkpoints;
  return {
    version: 1, savedAt: 1_700_000_000_000,
    profile: {
      ...p, level: 6, xp: 40, skillPoints: 2, health: 120,
      defeatedBosses: ['warden', 'marrow'],
      killedEnemies: ['city:e1', 'city:e2', 'docks:dk1', 'docks:dk2', 'foundry:fd1'],
      collected: ['chest_plaza', 'keycard', 'dk_chest_roofA', 'dk_chest_crane', 'fd_chest_forge'],
      flags: { gate_open: true, [`campaign_complete:ignis`]: true },
      checkpoint: { region: 'foundry', id: 'fd_gate', x: 640, y: 960 },
      inventory: { items: { health_tonic: 3, keycard: 1, warden_core: 1 }, gold: 410 },
      quests: { clean_streets: { status: 'completed', progress: [5] } },
    },
  };
}

describe('save v1 -> v2 migration', () => {
  it('keeps every kill, boss, flag, item and quest of an existing player', () => {
    const res = migrate(JSON.parse(JSON.stringify(v1Save())));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const p = res.save.profile;
    expect(res.save.version).toBe(CURRENT_SAVE_VERSION);
    expect(p.level).toBe(6);
    expect(p.defeatedBosses).toEqual(['warden', 'marrow']);
    expect(p.killedEnemies).toEqual(['city:e1', 'city:e2', 'docks:dk1', 'docks:dk2', 'foundry:fd1']);
    expect(p.flags.gate_open).toBe(true);
    expect(p.inventory.gold).toBe(410);
    expect(p.inventory.items).toMatchObject({ health_tonic: 3, keycard: 1, warden_core: 1 });
    expect(p.quests.clean_streets.status).toBe('completed');
  });

  it('collected items stay collected, now qualified by their own region', () => {
    const res = migrate(JSON.parse(JSON.stringify(v1Save())));
    expect(res.ok && res.save.profile.collected.sort()).toEqual(['city:chest_plaza', 'city:keycard', 'docks:dk_chest_roofA', 'docks:dk_chest_crane', 'foundry:fd_chest_forge'].sort());
  });

  it('the frozen legacy table agrees with the real pickups of the original three worlds', () => {
    for (const id of ['city', 'docks', 'foundry']) for (const pk of REGIONS[id].pickups) expect(legacyPickupRegion(pk.id), `${id}.${pk.id}`).toBe(id);
  });

  it('the checkpoint is preserved and becomes that region\'s own entry', () => {
    const res = migrate(JSON.parse(JSON.stringify(v1Save())));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.profile.checkpoint).toEqual({ region: 'foundry', id: 'fd_gate', x: 640, y: 960 });
    expect(res.save.profile.checkpoints.foundry).toEqual({ id: 'fd_gate', x: 640, y: 960 });
  });

  it('save -> restart -> load -> save -> load is lossless', () => {
    const first = migrate(JSON.parse(JSON.stringify(v1Save())));
    if (!first.ok) throw new Error(first.error);
    const second = migrate(JSON.parse(JSON.stringify(serializeSave(first.save.profile))));
    if (!second.ok) throw new Error(second.error);
    expect(second.save.profile).toEqual(first.save.profile);
  });

  it('already-qualified ids are never double-prefixed', () => {
    const f = v1Save() as { profile: { collected: string[] } };
    f.profile.collected = ['city:chest_plaza', 'chest_roof2'];
    const res = migrate(f);
    expect(res.ok && res.save.profile.collected.sort()).toEqual(['city:chest_plaza', 'city:chest_roof2']);
  });
});

describe('region-aware persistence', () => {
  it('two worlds can reuse a pickup id without conflict', () => {
    const p = createProfile();
    p.collected.push(collectedKey('city', 'chest_plaza'));
    expect(p.collected.includes(collectedKey('jade_ruins', 'chest_plaza'))).toBe(false);
    p.collected.push(collectedKey('jade_ruins', 'chest_plaza'));
    const res = validateSave(JSON.parse(JSON.stringify(serializeSave(p))));
    expect(res.ok && res.save.profile.collected.length).toBe(2);
  });

  it('every pickup and spawn key in the game is unique across all ten worlds', () => {
    const pk = new Set<string>(), sk = new Set<string>();
    for (const r of Object.values(REGIONS)) {
      for (const x of r.pickups) pk.add(collectedKey(r.id, x.id));
      for (const x of r.spawns) sk.add(spawnKey(r.id, x.id));
    }
    expect(pk.size).toBe(Object.values(REGIONS).reduce((n, r) => n + r.pickups.length, 0));
    expect(sk.size).toBe(Object.values(REGIONS).reduce((n, r) => n + r.spawns.length, 0));
  });

  it('every registered region is a valid checkpoint region (new worlds never reset the player)', () => {
    for (const p of WORLD_PACKS) for (const id of [p.cityRegion, p.arenaRegion]) {
      const prof = createProfile();
      prof.checkpoint = { region: id, id: 'lamp', x: 1234, y: 900 };
      const res = validateSave(JSON.parse(JSON.stringify(serializeSave(prof))));
      expect(res.ok && res.save.profile.checkpoint, id).toEqual({ region: id, id: 'lamp', x: 1234, y: 900 });
    }
  });

  it('an unknown active checkpoint region falls back to the start but keeps per-region progress', () => {
    const prof = createProfile();
    prof.checkpoint = { region: 'future_region', id: 'x', x: 10, y: 10 };
    prof.checkpoints = { future_region: { id: 'x', x: 10, y: 10 }, docks: { id: 'dock_gate', x: 640, y: 960 } };
    const res = validateSave(JSON.parse(JSON.stringify(serializeSave(prof))));
    if (!res.ok) throw new Error(res.error);
    expect(res.save.profile.checkpoint).toMatchObject({ region: startCheckpoint().region, id: 'start' });
    expect(res.save.profile.checkpoints.future_region).toEqual({ id: 'x', x: 10, y: 10 });
    expect(res.save.profile.checkpoints.docks).toEqual({ id: 'dock_gate', x: 640, y: 960 });
  });

  it('a lamp in one world never overwrites another world\'s saved lamp', () => {
    const prof = createProfile();
    prof.checkpoints.docks = { id: 'dock_gate', x: 640, y: 960 };
    prof.checkpoints.jade_ruins = { id: 'jr_gate', x: 640, y: 960 };
    prof.checkpoint = { region: 'jade_ruins', id: 'jr_stair', x: 2700, y: 960 };
    prof.checkpoints.jade_ruins = { id: 'jr_stair', x: 2700, y: 960 };
    const res = validateSave(JSON.parse(JSON.stringify(serializeSave(prof))));
    expect(res.ok && res.save.profile.checkpoints.docks).toEqual({ id: 'dock_gate', x: 640, y: 960 });
  });
});

describe('no silent truncation', () => {
  it('a 10-world campaign\'s worth of progress survives a round trip intact', () => {
    const prof = createProfile();
    prof.killedEnemies = Array.from({ length: 6000 }, (_, i) => `region${i % 20}:spawn${i}`);
    prof.collected = Array.from({ length: 1500 }, (_, i) => `region${i % 20}:chest${i}`);
    prof.defeatedBosses = Array.from({ length: 400 }, (_, i) => `boss${i}`);
    const res = migrate(JSON.parse(JSON.stringify(serializeSave(prof))));
    if (!res.ok) throw new Error(res.error);
    expect(res.save.profile.killedEnemies.length).toBe(6000);
    expect(res.save.profile.collected.length).toBe(1500);
    expect(res.save.profile.defeatedBosses.length).toBe(400);
  });

  it('really long campaign flags are kept up to a generous key length', () => {
    const prof = createProfile();
    prof.flags[`campaign_complete:${'x'.repeat(80)}`] = true;
    const res = validateSave(JSON.parse(JSON.stringify(serializeSave(prof))));
    expect(res.ok && Object.keys(res.save.profile.flags).length).toBe(1);
  });
});
