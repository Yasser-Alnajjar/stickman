import { describe, expect, it } from 'vitest';
import { comboScale, computeDamage } from './damage';
import { ComboController } from './ComboController';
import { PLAYER_ATTACKS } from '@/game/config/attacks';

const base = { baseDamage: 10, attackerAttack: 10, targetDefense: 0, comboScale: 1, multiplier: 1, block: 'none' as const, blockFactor: 0.15 };

describe('damage', () => {
  it('applies attack, defense, combo and block', () => {
    expect(computeDamage(base)).toBe(10);
    expect(computeDamage({ ...base, attackerAttack: 20 })).toBe(16);
    expect(computeDamage({ ...base, targetDefense: 5 })).toBe(8);
    expect(computeDamage({ ...base, comboScale: comboScale(5) })).toBe(14);
    expect(computeDamage({ ...base, block: 'block' })).toBe(2);
    expect(computeDamage({ ...base, block: 'perfect' })).toBe(0);
    expect(computeDamage({ ...base, vulnerable: true })).toBe(15);
  });
  it('never deals less than 1 unblocked', () => {
    expect(computeDamage({ ...base, baseDamage: 1, targetDefense: 50 })).toBe(1);
  });
});

describe('combo controller', () => {
  it('chains Punch -> Punch -> Kick -> Heavy', () => {
    const c = new ComboController();
    const seq: string[] = [];
    let id = c.resolve('light', false);
    for (let i = 0; i < 4; i++) {
      seq.push(id);
      c.onAttackStarted(id);
      c.onAttackEnded();
      id = c.resolve('light', false);
    }
    expect(seq).toEqual(['punch1', 'punch2', 'combo_kick', 'combo_heavy']);
  });
  it('finisher has no follow-up and chain resets after the window', () => {
    const c = new ComboController();
    c.onAttackStarted('combo_heavy');
    c.onAttackEnded();
    expect(c.resolve('light', false)).toBe('punch1');
    c.onAttackStarted('punch1');
    c.onAttackEnded();
    c.update(PLAYER_ATTACKS.punch1.comboWindow! + 10);
    expect(c.resolve('light', false)).toBe('punch1');
  });
  it('input buffer expires and hit counter resets', () => {
    const c = new ComboController();
    c.push('light');
    c.update(500);
    expect(c.buffered).toBeNull();
    c.registerHit();
    c.registerHit();
    expect(c.scale()).toBeCloseTo(1.16);
    c.update(5000);
    expect(c.hits).toBe(0);
  });
});
