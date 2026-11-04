import type { EnemyKind } from '@/shared/types';
import { COLORS } from '@/shared/constants';

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
  style: { color: number; lineWidth: number; scale: number; accessory: string; accent: number; headRadius: number };
}

export const ENEMIES: Record<Exclude<EnemyKind, 'boss'>, EnemyDef> = {
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
};

export interface BossDef {
  id: string;
  name: string;
  maxHealth: number;
  attack: number;
  defense: number;
  width: number;
  height: number;
  walkSpeed: number;
  xp: number;
  gold: number;
  phaseThresholds: [number, number];
}

export const WARDEN: BossDef = {
  id: 'warden', name: 'Iron Warden Kaizo', maxHealth: 720, attack: 12, defense: 6,
  width: 56, height: 160, walkSpeed: 130, xp: 400, gold: 150, phaseThresholds: [0.66, 0.33],
};
