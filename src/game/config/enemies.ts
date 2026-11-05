import type { BossId, EnemyKind, ItemId } from '@/shared/types';
import { COLORS } from '@/shared/constants';
import { BOSSES, ENEMIES } from '@/game/world/stores';

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  maxHealth: number;
  attack: number;
  defense: number;
  width: number;
  height: number;
  patrolSpeed: number;
  chaseSpeed: number;
  detectRange: number;
  detectHeight: number;
  loseRange: number;
  attackRange: number;
  attackCooldown: number;
  recoverTime: number;
  attacks: { id: string; weight: number; minRange?: number }[];
  /** 0..1: fraction of knockback ignored. */
  knockbackResist: number;
  /** Multiplier on hit-stun duration (0 = never staggered). */
  stunScale: number;
  xp: number;
  gold: number;
  dodgeChance?: number;
  dashApproach?: boolean;
  /** 0..1: fraction of frontal damage absorbed by a raised shield. Heavy hits break the guard. */
  guard?: number;
  /** Ranged fighters keep their distance and fire projectiles. */
  ranged?: { attackId: string; keepAway: number; range: number; speed: number; color: number };
  style: { color: number; lineWidth: number; scale: number; accessory: string; accent: number; headRadius: number };
}

/** Enemies every world may use. World packs add their own through their manifest (see world/registry.ts). */
const CORE_ENEMIES: Record<string, EnemyDef> = {
  basic: {
    kind: 'basic', name: 'Street Thug', maxHealth: 60, attack: 10, defense: 2,
    width: 28, height: 88, patrolSpeed: 60, chaseSpeed: 150, detectRange: 420, detectHeight: 160,
    loseRange: 760, attackRange: 58, attackCooldown: 1100, recoverTime: 250,
    attacks: [{ id: 'thug_jab', weight: 3 }, { id: 'thug_hook', weight: 2 }],
    knockbackResist: 0, stunScale: 1, xp: 20, gold: 4,
    style: { color: COLORS.basic, lineWidth: 5, scale: 1, accessory: 'headband', accent: 0xffe08a, headRadius: 10 },
  },
  fast: {
    kind: 'fast', name: 'Shadow Runner', maxHealth: 38, attack: 10, defense: 1,
    width: 24, height: 84, patrolSpeed: 110, chaseSpeed: 270, detectRange: 520, detectHeight: 180,
    loseRange: 900, attackRange: 60, attackCooldown: 650, recoverTime: 120,
    attacks: [{ id: 'fast_slash', weight: 1 }],
    knockbackResist: 0.1, stunScale: 0.8, xp: 28, gold: 6, dodgeChance: 0.45, dashApproach: true,
    style: { color: COLORS.fast, lineWidth: 3.5, scale: 0.95, accessory: 'scarf', accent: 0xff5ce1, headRadius: 9 },
  },
  heavy: {
    kind: 'heavy', name: 'Iron Brute', maxHealth: 190, attack: 12, defense: 6,
    width: 46, height: 110, patrolSpeed: 40, chaseSpeed: 85, detectRange: 460, detectHeight: 180,
    loseRange: 760, attackRange: 84, attackCooldown: 1600, recoverTime: 450,
    attacks: [{ id: 'heavy_slam', weight: 2 }, { id: 'heavy_swipe', weight: 2 }],
    knockbackResist: 0.75, stunScale: 0.35, xp: 60, gold: 12,
    style: { color: COLORS.heavy, lineWidth: 9, scale: 1.3, accessory: 'brute', accent: 0xe8fff4, headRadius: 10 },
  },
  archer: {
    kind: 'archer', name: 'Dock Slinger', maxHealth: 44, attack: 10, defense: 1,
    width: 26, height: 86, patrolSpeed: 50, chaseSpeed: 135, detectRange: 760, detectHeight: 220,
    loseRange: 1100, attackRange: 520, attackCooldown: 1700, recoverTime: 300,
    attacks: [{ id: 'archer_shot', weight: 1 }],
    knockbackResist: 0, stunScale: 1.2, xp: 34, gold: 7,
    ranged: { attackId: 'archer_shot', keepAway: 260, range: 560, speed: 520, color: 0xffe08a },
    style: { color: COLORS.archer, lineWidth: 4, scale: 0.98, accessory: 'hood', accent: 0xffe08a, headRadius: 9 },
  },
  guard: {
    kind: 'guard', name: 'Shield Guard', maxHealth: 130, attack: 11, defense: 5,
    width: 38, height: 100, patrolSpeed: 40, chaseSpeed: 105, detectRange: 440, detectHeight: 180,
    loseRange: 760, attackRange: 78, attackCooldown: 1300, recoverTime: 380,
    attacks: [{ id: 'guard_thrust', weight: 3 }, { id: 'guard_bash', weight: 2 }],
    knockbackResist: 0.5, stunScale: 0.6, xp: 52, gold: 10, guard: 0.8,
    style: { color: COLORS.guard, lineWidth: 6, scale: 1.12, accessory: 'shield', accent: 0xcfd6ff, headRadius: 10 },
  },
  blade: {
    kind: 'blade', name: 'Night Blade', maxHealth: 78, attack: 13, defense: 2,
    width: 24, height: 86, patrolSpeed: 120, chaseSpeed: 300, detectRange: 560, detectHeight: 200,
    loseRange: 980, attackRange: 64, attackCooldown: 800, recoverTime: 140,
    attacks: [{ id: 'blade_slash', weight: 3 }, { id: 'blade_lunge', weight: 2, minRange: 90 }],
    knockbackResist: 0.1, stunScale: 0.7, xp: 66, gold: 12, dodgeChance: 0.6, dashApproach: true,
    style: { color: COLORS.blade, lineWidth: 3.8, scale: 1, accessory: 'blade', accent: 0xff5c7a, headRadius: 9 },
  },
};

/** Built-in patterns are the names below; a pack may add any other name and script it in its content module (`moves`). */
export type BossPattern = string;
export const BUILTIN_PATTERNS = ['combo', 'slam', 'charge', 'leap', 'volley', 'rain', 'pillars', 'teleport', 'whirl'] as const;

export interface BossDef {
  id: BossId;
  name: string;
  subtitle: string;
  /** Attack ids are `${prefix}_swing1`, `${prefix}_slam` ... (see attacks.ts). */
  prefix: string;
  maxHealth: number;
  attack: number;
  defense: number;
  width: number;
  height: number;
  walkSpeed: number;
  xp: number;
  gold: number;
  drop: ItemId;
  phaseThresholds: [number, number];
  /** Patterns by weight; `from` is the first phase in which the pattern is available. */
  patterns: { id: BossPattern; weight: number; from?: number }[];
  /** Reinforcements called in when entering `phase`. */
  summon?: { phase: number; kinds: string[] };
  /** Multiplier on the telegraph/rest tempo per phase (lower = faster). */
  tempo: [number, number, number];
  style: { color: number; lineWidth: number; scale: number; accessory: string; accent: number; headRadius: number };
  eye: number;
  /** Optional pulsing halo around the boss while the fight is on (part of its visual identity). */
  aura?: { color: number; r: number };
  /** Projectile barrage settings for the `volley` pattern. */
  volley?: { speed: number; w: number; h: number; color: number; heights: number[]; aim: boolean; rounds: [number, number, number]; fan: [number, number, number]; burn?: { dps: number; duration: number } };
}


Object.assign(ENEMIES, CORE_ENEMIES);

export { BOSSES, ENEMIES };

/** Boss ids in campaign order. */
export function bossOrder(): BossId[] {
  return Object.keys(BOSSES);
}

// Loads the world-pack manifests (and with them every boss, quest and item) whenever this module is used.
import '@/game/world/worlds';
