/** Pure data: legal player state transitions (no engine imports so it is unit-testable). */
export type PlayerState =
  | 'Idle' | 'Moving' | 'Jumping' | 'Falling' | 'Attacking' | 'Blocking'
  | 'Dodging' | 'Dashing' | 'TakingDamage' | 'Dead';

const FREE: PlayerState[] = ['Idle', 'Moving', 'Jumping', 'Falling'];
const FREE_PLUS = (extra: PlayerState[]): PlayerState[] => [...FREE, ...extra];

/** Explicit transition table: anything not listed here is rejected by the state machine. */
export const PLAYER_TRANSITIONS: Record<PlayerState, readonly PlayerState[]> = {
  Idle: FREE_PLUS(['Attacking', 'Blocking', 'Dodging', 'Dashing', 'TakingDamage', 'Dead']),
  Moving: FREE_PLUS(['Attacking', 'Blocking', 'Dodging', 'Dashing', 'TakingDamage', 'Dead']),
  Jumping: FREE_PLUS(['Attacking', 'Dashing', 'TakingDamage', 'Dead']),
  Falling: FREE_PLUS(['Attacking', 'Dashing', 'TakingDamage', 'Dead']),
  Attacking: FREE_PLUS(['Attacking', 'Blocking', 'Dodging', 'Dashing', 'TakingDamage', 'Dead']),
  Blocking: FREE_PLUS(['Dodging', 'TakingDamage', 'Dead']),
  Dodging: FREE_PLUS(['TakingDamage', 'Dead']),
  Dashing: FREE_PLUS(['Attacking', 'TakingDamage', 'Dead']),
  TakingDamage: FREE_PLUS(['Dead']),
  Dead: [],
};

