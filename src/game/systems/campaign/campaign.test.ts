import { describe, expect, it } from 'vitest';
import { campaignBosses, completionFlag, isCampaignComplete, recordCompletion, shouldRecordCompletion } from './campaign';
import { createProfile } from '@/game/systems/progression/profile';
import { migrate, serializeSave } from '@/persistence/save-schema';
import type { BossId } from '@/shared/types';

describe('campaign completion', () => {
  const all = campaignBosses();

  it('derives the campaign from the world packs in order', () => {
    expect(all).toEqual(['warden', 'marrow', 'ignis']);
  });

  it('is not complete until every boss is defeated', () => {
    const p = createProfile();
    p.defeatedBosses = ['warden', 'marrow'];
    expect(isCampaignComplete(p)).toBe(false);
    expect(shouldRecordCompletion(p)).toBe(false);
    p.defeatedBosses.push('ignis');
    expect(shouldRecordCompletion(p)).toBe(true);
  });

  it('records completion once only', () => {
    const p = createProfile();
    p.defeatedBosses = [...all];
    recordCompletion(p);
    expect(shouldRecordCompletion(p)).toBe(false);
  });

  it('survives a save round trip and keeps progress', () => {
    const p = createProfile();
    p.defeatedBosses = [...all];
    p.inventory.gold = 123;
    recordCompletion(p);
    const res = migrate(JSON.parse(JSON.stringify(serializeSave(p))));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.profile.flags[completionFlag('ignis')]).toBe(true);
    expect(res.save.profile.inventory.gold).toBe(123);
    expect(shouldRecordCompletion(res.save.profile)).toBe(false);
  });

  it('a newly added stage reopens the campaign and completes again later', () => {
    const p = createProfile();
    p.defeatedBosses = [...all];
    recordCompletion(p);
    const extended = [...all, 'newboss' as BossId];
    expect(isCampaignComplete(p, extended)).toBe(false);
    expect(shouldRecordCompletion(p, extended)).toBe(false);
    p.defeatedBosses.push('newboss');
    expect(shouldRecordCompletion(p, extended)).toBe(true);
    recordCompletion(p, extended);
    expect(shouldRecordCompletion(p, extended)).toBe(false);
  });
});
