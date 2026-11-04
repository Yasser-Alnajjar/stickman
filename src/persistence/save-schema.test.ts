import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION, migrate, serializeSave, validateSave } from './save-schema';
import { addXp, createProfile, upgradeAbility } from '@/game/systems/progression/profile';

describe('save schema', () => {
  it('round-trips a valid profile', () => {
    const p = createProfile();
    addXp(p, 300);
    upgradeAbility(p, 'fire_punch');
    const res = validateSave(JSON.parse(JSON.stringify(serializeSave(p))));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.save.profile.level).toBe(p.level);
      expect(res.save.profile.abilities.fire_punch).toBe(1);
    }
  });

  it('rejects garbage and wrong versions', () => {
    expect(validateSave(null).ok).toBe(false);
    expect(validateSave('x').ok).toBe(false);
    expect(validateSave({ version: 99, profile: {} }).ok).toBe(false);
    expect(migrate({ version: CURRENT_SAVE_VERSION + 1, profile: {} }).ok).toBe(false);
    expect(migrate({}).ok).toBe(false);
  });

  it('sanitises out-of-range values and unknown ids', () => {
    const f = JSON.parse(JSON.stringify(serializeSave(createProfile())));
    f.profile.level = 9999;
    f.profile.xp = -5;
    f.profile.inventory.items = { health_tonic: 5, hax: 999 };
    f.profile.quests = { nope: { status: 'active', progress: [1] } };
    f.profile.skillPoints = 0;
    const res = validateSave(f);
    // level 9999 clamps to 10, but spent points (0) + 0 != consistent total; allowed (less than earned).
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.save.profile.level).toBe(10);
      expect(res.save.profile.xp).toBe(0);
      expect(res.save.profile.inventory.items).toEqual({ health_tonic: 5 });
      expect(res.save.profile.quests).toEqual({});
    }
  });

  it('rejects impossible skill-point totals', () => {
    const f = JSON.parse(JSON.stringify(serializeSave(createProfile())));
    f.profile.skillPoints = 50;
    expect(validateSave(f).ok).toBe(false);
  });
});
