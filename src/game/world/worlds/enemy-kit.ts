import type { AttackDef, SfxName } from '@/shared/types';
import type { EnemyDef } from '@/game/config/enemies';

/**
 * Helpers for writing a world's enemies and attacks as plain data. Archetypes carry the *behaviour* the shared
 * Enemy AI understands (patrol/chase tuning, guard, dodge, ranged); a world supplies stats, attacks and a look.
 */

export type Archetype = 'grunt' | 'runner' | 'brute' | 'shooter' | 'guard' | 'assassin';

type Base = Omit<EnemyDef, 'kind' | 'name' | 'attacks' | 'style' | 'xp' | 'gold'>;

const BASE: Record<Archetype, Base> = {
  grunt: { maxHealth: 60, attack: 10, defense: 2, width: 28, height: 88, patrolSpeed: 60, chaseSpeed: 150, detectRange: 420, detectHeight: 160, loseRange: 760, attackRange: 58, attackCooldown: 1100, recoverTime: 250, knockbackResist: 0, stunScale: 1 },
  runner: { maxHealth: 40, attack: 10, defense: 1, width: 24, height: 84, patrolSpeed: 110, chaseSpeed: 270, detectRange: 520, detectHeight: 180, loseRange: 900, attackRange: 60, attackCooldown: 650, recoverTime: 120, knockbackResist: 0.1, stunScale: 0.8, dodgeChance: 0.45, dashApproach: true },
  brute: { maxHealth: 190, attack: 12, defense: 6, width: 46, height: 110, patrolSpeed: 40, chaseSpeed: 85, detectRange: 460, detectHeight: 180, loseRange: 760, attackRange: 84, attackCooldown: 1600, recoverTime: 450, knockbackResist: 0.75, stunScale: 0.35 },
  shooter: { maxHealth: 44, attack: 10, defense: 1, width: 26, height: 86, patrolSpeed: 50, chaseSpeed: 135, detectRange: 760, detectHeight: 220, loseRange: 1100, attackRange: 520, attackCooldown: 1700, recoverTime: 300, knockbackResist: 0, stunScale: 1.2 },
  guard: { maxHealth: 130, attack: 11, defense: 5, width: 38, height: 100, patrolSpeed: 40, chaseSpeed: 105, detectRange: 440, detectHeight: 180, loseRange: 760, attackRange: 78, attackCooldown: 1300, recoverTime: 380, knockbackResist: 0.5, stunScale: 0.6, guard: 0.8 },
  assassin: { maxHealth: 78, attack: 13, defense: 2, width: 24, height: 86, patrolSpeed: 120, chaseSpeed: 300, detectRange: 560, detectHeight: 200, loseRange: 980, attackRange: 64, attackCooldown: 800, recoverTime: 140, knockbackResist: 0.1, stunScale: 0.7, dodgeChance: 0.6, dashApproach: true },
};

export interface EnemyOpts extends Partial<Base> {
  /** Attack ids with weights; ids must be defined in the pack's `enemyAttacks`. */
  attacks: { id: string; weight: number; minRange?: number }[];
  xp: number;
  gold: number;
  style: EnemyDef['style'];
  guard?: number;
  dodgeChance?: number;
  dashApproach?: boolean;
  ranged?: EnemyDef['ranged'];
}

export function enemy(kind: string, name: string, arch: Archetype, o: EnemyOpts): EnemyDef {
  return { ...BASE[arch], ...o, kind, name };
}

export interface AtkOpts extends Partial<AttackDef> { damage: number }

/** An attack with sensible defaults; give only what makes it different. */
export function atk(id: string, name: string, o: AtkOpts): AttackDef {
  return {
    hitbox: { w: 60, h: 42, ox: 46, oy: -10 }, startup: 300, active: 90, recovery: 400,
    knockback: { x: 200, y: -60 }, hitStun: 280, hitStop: 55, shake: 0.002, anim: 'punch1', sfx: 'punch' as SfxName,
    ...o, id, name,
  };
}

/** Builds quest `kill` objectives etc. stay in manifests; this is only to keep arena/city code terse. */
export const sp = (id: string, kind: string, x: number, y?: number, patrol = 150): { id: string; kind: string; x: number; y?: number; patrol: number } => ({ id, kind, x, y, patrol });
