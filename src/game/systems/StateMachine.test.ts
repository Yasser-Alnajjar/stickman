import { describe, expect, it } from 'vitest';
import { StateMachine } from './StateMachine';
import { PLAYER_TRANSITIONS, type PlayerState } from '@/game/entities/player/transitions';
import { ENEMY_TRANSITIONS } from '@/game/entities/enemies/transitions';

describe('StateMachine', () => {
  const table = { A: ['B'], B: ['A', 'C'], C: [] } as const;
  it('rejects invalid transitions and keeps state', () => {
    const sm = new StateMachine<'A' | 'B' | 'C'>('A', table);
    expect(sm.transition('C')).toBe(false);
    expect(sm.state).toBe('A');
    expect(sm.transition('B')).toBe(true);
    expect(sm.transition('C')).toBe(true);
    expect(sm.transition('A')).toBe(false); // terminal
  });
  it('resets elapsed on transition and calls onEnter', () => {
    const seen: string[] = [];
    const sm = new StateMachine<'A' | 'B' | 'C'>('A', table, (to, from) => seen.push(`${from}>${to}`));
    sm.tick(100);
    sm.transition('B');
    expect(sm.elapsed).toBe(0);
    expect(seen).toEqual(['A>B']);
  });
});

describe('transition tables', () => {
  it('player: Dead is terminal and every state can reach Dead', () => {
    expect(PLAYER_TRANSITIONS.Dead).toEqual([]);
    (Object.keys(PLAYER_TRANSITIONS) as PlayerState[]).filter((s) => s !== 'Dead').forEach((s) => expect(PLAYER_TRANSITIONS[s]).toContain('Dead'));
  });
  it('player: conflicting actions are forbidden', () => {
    expect(PLAYER_TRANSITIONS.Blocking).not.toContain('Attacking');
    expect(PLAYER_TRANSITIONS.Dodging).not.toContain('Attacking');
    expect(PLAYER_TRANSITIONS.Dodging).not.toContain('Dashing');
    expect(PLAYER_TRANSITIONS.TakingDamage).not.toContain('Attacking');
    expect(PLAYER_TRANSITIONS.Jumping).not.toContain('Blocking');
  });
  it('enemy: Dead is terminal, Attack must be entered from Chase/Recover', () => {
    expect(ENEMY_TRANSITIONS.Dead).toEqual([]);
    const into = (Object.keys(ENEMY_TRANSITIONS) as (keyof typeof ENEMY_TRANSITIONS)[]).filter((s) => ENEMY_TRANSITIONS[s].includes('Attack'));
    expect(into.sort()).toEqual(['Chase', 'Recover']);
  });
});
