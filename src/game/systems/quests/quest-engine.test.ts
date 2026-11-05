import { describe, expect, it } from 'vitest';
import { createProfile, addItem } from '@/game/systems/progression/profile';
import { applyQuestEvent, lockInfo, prerequisite, questLog, questOrder, questState, settleQuests } from './quest-engine';
import { QUESTS } from '@/game/config/quests';
import { migrate, serializeSave } from '@/persistence/save-schema';
import { WORLD_PACKS } from '@/game/world/worlds';

type Profile = ReturnType<typeof createProfile>;

/** Plays a quest to completion through real events, the way gameplay does. */
function finish(p: Profile, id: string): void {
  settleQuests(p);
  for (const o of QUESTS[id].objectives) {
    if (o.type === 'kill') for (let i = 0; i < o.count; i++) applyQuestEvent(p, { type: 'kill', target: o.target === 'any' ? 'basic' : (o.target as never) });
    if (o.type === 'reach') applyQuestEvent(p, { type: 'reach', target: o.target });
    if (o.type === 'collect') applyQuestEvent(p, { type: 'collect', target: o.target as never, count: o.count });
    if (o.type === 'boss') { p.defeatedBosses.push(o.target); applyQuestEvent(p, { type: 'boss', target: o.target }); }
  }
  settleQuests(p);
}

describe('quest line', () => {
  it('every quest is in the order exactly once and belongs to a real world', () => {
    expect([...questOrder()].sort()).toEqual(Object.keys(QUESTS).sort());
    for (const q of Object.values(QUESTS)) expect(WORLD_PACKS.some((w) => w.id === q.world), q.id).toBe(true);
  });

  it('a new profile starts only the first quest; the rest are locked with a reason', () => {
    const p = createProfile();
    expect(settleQuests(p).started).toEqual(['clean_streets']);
    const log = questLog(p);
    expect(log.map((e) => e.state)).toEqual(['active', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked']);
    expect(log[0].current).toBe(true);
    expect(log[1].lock).toEqual({ kind: 'quest', quest: 'clean_streets' });
    expect(questState(p, QUESTS.rooftop_signal)).toBe('locked');
  });

  it('kills progress automatically, complete and pay out, and unlock the next quest', () => {
    const p = createProfile();
    settleQuests(p);
    for (let i = 0; i < 4; i++) applyQuestEvent(p, { type: 'kill', target: 'basic' });
    expect(p.quests.clean_streets.progress[0]).toBe(4);
    expect(p.quests.rooftop_signal).toBeUndefined();
    const ev = applyQuestEvent(p, { type: 'kill', target: 'fast' });
    expect(ev.objectives).toEqual([{ id: 'clean_streets', index: 0 }]);
    const res = settleQuests(p);
    expect(res.completed.map((c) => c.id)).toEqual(['clean_streets']);
    expect(res.started).toEqual(['rooftop_signal']);
    expect(p.inventory.items.health_tonic).toBe(2);
    expect(p.quests.rooftop_signal.status).toBe('active');
  });

  it('rewards are paid once', () => {
    const p = createProfile();
    finish(p, 'clean_streets');
    const snap = [p.xp, p.level, p.inventory.gold, p.inventory.items.health_tonic].join();
    for (let i = 0; i < 3; i++) { applyQuestEvent(p, { type: 'kill', target: 'basic' }); settleQuests(p); }
    expect(settleQuests(p).completed).toEqual([]);
    expect([p.xp, p.level, p.inventory.gold, p.inventory.items.health_tonic].join()).toBe(snap);
  });

  it('collect quests are seeded from carried items and finish immediately', () => {
    const p = createProfile();
    finish(p, 'clean_streets');
    addItem(p, 'keycard'); // picked up before the quest begins (e.g. found the hidden room early)
    finish(p, 'rooftop_signal');
    expect(p.quests.lost_keycard.status).toBe('completed');
    expect(p.flags.gate_open).toBe(true);
    expect(p.quests.defeat_warden.status).toBe('active');
  });

  it('a later-world quest waits for its world as well as the previous quest', () => {
    const q = createProfile();
    for (const id of ['clean_streets', 'rooftop_signal', 'lost_keycard', 'defeat_warden']) q.quests[id] = { status: 'completed', progress: QUESTS[id].objectives.map((o) => o.count) };
    expect(prerequisite('dock_sweep')).toBe('defeat_warden');
    expect(lockInfo(q, QUESTS.dock_sweep)).toEqual({ kind: 'world', world: 'rust_docks' });
    q.defeatedBosses.push('warden');
    expect(lockInfo(q, QUESTS.dock_sweep)).toBeNull();
    expect(settleQuests(q).started).toEqual(['dock_sweep']);
  });

  it('migrates an old save: ready quests are paid, completed stay completed, progress is kept', () => {
    const p = createProfile();
    p.quests = {
      clean_streets: { status: 'completed', progress: [5] },
      rooftop_signal: { status: 'ready', progress: [1] }, // was waiting for an NPC turn-in
      lost_keycard: { status: 'active', progress: [0] },
    };
    const loaded = migrate(JSON.parse(JSON.stringify(serializeSave(p))));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const prof = loaded.save.profile;
    const res = settleQuests(prof);
    expect(res.completed.map((c) => c.id)).toEqual(['rooftop_signal']);
    expect(prof.quests.clean_streets.status).toBe('completed');
    expect(prof.quests.lost_keycard.status).toBe('active');
    expect(settleQuests(prof)).toEqual({ started: [], completed: [] });
  });

  it('quest state survives a save round trip', () => {
    const p = createProfile();
    finish(p, 'clean_streets');
    const r = migrate(JSON.parse(JSON.stringify(serializeSave(p))));
    expect(r.ok && questLog(r.save.profile).map((e) => e.state)).toEqual(questLog(p).map((e) => e.state));
  });
});
