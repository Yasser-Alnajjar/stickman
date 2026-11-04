/** Pure data: legal enemy state transitions (no engine imports so it is unit-testable). */
export type EnemyState = 'Idle' | 'Patrol' | 'Detect' | 'Chase' | 'Attack' | 'Recover' | 'Dodge' | 'Hit' | 'Stunned' | 'Dead';

const ALL: EnemyState[] = ['Idle', 'Patrol', 'Detect', 'Chase', 'Attack', 'Recover', 'Dodge', 'Hit', 'Stunned', 'Dead'];
const to = (...s: EnemyState[]): EnemyState[] => s;

export const ENEMY_TRANSITIONS: Record<EnemyState, readonly EnemyState[]> = {
  Idle: to('Patrol', 'Detect', 'Chase', 'Hit', 'Stunned', 'Dead'),
  Patrol: to('Idle', 'Detect', 'Chase', 'Hit', 'Stunned', 'Dead'),
  Detect: to('Chase', 'Idle', 'Hit', 'Stunned', 'Dead'),
  Chase: to('Attack', 'Recover', 'Patrol', 'Idle', 'Dodge', 'Hit', 'Stunned', 'Dead'),
  Attack: to('Recover', 'Chase', 'Hit', 'Stunned', 'Dead'),
  Recover: to('Chase', 'Attack', 'Idle', 'Dodge', 'Hit', 'Stunned', 'Dead'),
  Dodge: to('Chase', 'Recover', 'Stunned', 'Dead'),
  Hit: to('Chase', 'Recover', 'Stunned', 'Hit', 'Dead'),
  Stunned: to('Chase', 'Recover', 'Hit', 'Dead'),
  Dead: ALL.filter(() => false),
};

