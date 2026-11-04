import { describe, expect, it } from 'vitest';
import {
  addItem, addXp, checkAbilityUpgrade, createProfile, deriveStats, removeItem, upgradeAbility, upgradeAttribute,
} from './profile';
import { xpToNext } from '@/game/config/progression';

describe('progression', () => {
  it('starts at level 1 with one skill point', () => {
    const p = createProfile();
    expect(p.level).toBe(1);
    expect(p.skillPoints).toBe(1);
  });

  it('levels up across multiple thresholds and grants skill points', () => {
    const p = createProfile();
    const r = addXp(p, xpToNext(1) + xpToNext(2) + 5);
    expect(r.levelsGained).toBe(2);
    expect(p.level).toBe(3);
    expect(p.xp).toBe(5);
    expect(p.skillPoints).toBe(3);
  });

  it('caps at max level', () => {
    const p = createProfile();
    addXp(p, 1_000_000);
    expect(p.level).toBe(10);
    expect(p.xp).toBeLessThan(xpToNext(10));
  });

  it('enforces ability level requirements and point costs', () => {
    const p = createProfile();
    expect(checkAbilityUpgrade(p, 'lightning_dash').ok).toBe(false);
    expect(upgradeAbility(p, 'fire_punch')).toBe(true);
    expect(p.abilities.fire_punch).toBe(1);
    expect(p.skillPoints).toBe(0);
    expect(upgradeAbility(p, 'fire_punch')).toBe(false);
  });

  it('attribute upgrades change derived stats', () => {
    const p = createProfile();
    const before = deriveStats(p);
    expect(upgradeAttribute(p, 'vitality')).toBe(true);
    expect(deriveStats(p).maxHealth).toBe(before.maxHealth + 15);
  });

  it('level raises derived stats', () => {
    const p = createProfile();
    const before = deriveStats(p);
    addXp(p, 500);
    const after = deriveStats(p);
    expect(after.maxHealth).toBeGreaterThan(before.maxHealth);
    expect(after.attack).toBeGreaterThan(before.attack);
  });

  it('inventory add/remove', () => {
    const p = createProfile();
    addItem(p, 'health_tonic', 2);
    expect(removeItem(p, 'health_tonic', 3)).toBe(false);
    expect(removeItem(p, 'health_tonic', 2)).toBe(true);
    expect(p.inventory.items.health_tonic).toBeUndefined();
  });
});
