import { describe, expect, it } from 'vitest';
import { createProfile, addItem } from '@/game/systems/progression/profile';
import { acceptQuest, applyQuestEvent, completeQuest, questState } from './quest-engine';
import { QUESTS } from '@/game/config/quests';

describe('quest engine', () => {
  it('kill quest counts, becomes ready, then pays out', () => {
    const p = createProfile();
    expect(acceptQuest(p, 'clean_streets')).toBe(true);
    for (let i = 0; i < 4; i++) applyQuestEvent(p, { type: 'kill', target: 'basic' });
    expect(p.quests.clean_streets.status).toBe('active');
    const ready = applyQuestEvent(p, { type: 'kill', target: 'fast' });
    expect(ready).toEqual(['clean_streets']);
    const done = completeQuest(p, 'clean_streets');
    expect(done?.xp).toBe(QUESTS.clean_streets.reward.xp);
    expect(p.inventory.items.health_tonic).toBe(2);
    expect(p.quests.clean_streets.status).toBe('completed');
    expect(completeQuest(p, 'clean_streets')).toBeNull();
  });

  it('kills before accepting do not count', () => {
    const p = createProfile();
    applyQuestEvent(p, { type: 'kill', target: 'basic' });
    acceptQuest(p, 'clean_streets');
    expect(p.quests.clean_streets.progress[0]).toBe(0);
  });

  it('collect quest is seeded from inventory', () => {
    const p = createProfile();
    addItem(p, 'keycard');
    acceptQuest(p, 'lost_keycard');
    expect(p.quests.lost_keycard.status).toBe('ready');
    completeQuest(p, 'lost_keycard');
    expect(p.flags.gate_open).toBe(true);
  });

  it('reach quest and boss quest gating', () => {
    const p = createProfile();
    acceptQuest(p, 'rooftop_signal');
    applyQuestEvent(p, { type: 'reach', target: 'beacon' });
    expect(p.quests.rooftop_signal.status).toBe('ready');
    expect(questState(p, QUESTS.defeat_warden)).toBe('locked');
    addItem(p, 'keycard');
    acceptQuest(p, 'lost_keycard');
    completeQuest(p, 'lost_keycard');
    expect(questState(p, QUESTS.defeat_warden)).toBe('available');
    acceptQuest(p, 'defeat_warden');
    applyQuestEvent(p, { type: 'boss', target: 'warden' });
    expect(p.quests.defeat_warden.status).toBe('ready');
  });
});
