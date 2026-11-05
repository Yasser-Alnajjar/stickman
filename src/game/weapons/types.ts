import type { AttackDef, Element, ProjectileSpec, SfxName } from '@/shared/types';

/** Weapon families. Every family has its own combo, special ability and silhouette. `fists` is the unarmed starting kit. */
export type WeaponCategory = 'fists' | 'sword' | 'daggers' | 'axe' | 'spear' | 'staff' | 'hammer';
export const WEAPON_CATEGORIES: readonly WeaponCategory[] = ['fists', 'sword', 'daggers', 'axe', 'spear', 'staff', 'hammer'];

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/** Which attack the three attack buttons start, and how the chain continues (each AttackDef's `next`). */
export interface WeaponCombo {
  attacks: Record<string, AttackDef>;
  openers: { light: string; kick: string; heavy: string };
  /** Attack used when a dash is converted into a strike. Defaults to the shared dash strike. */
  dashAttack?: string;
  /** Used instead of an attack the player cannot pay for (staffs fall back to a staff bash when out of energy). */
  fallback?: string;
}

/** A ground-hugging or flying wave released by a special ability. */
export type WaveSpec = ProjectileSpec;

/**
 * The closed set of special-ability behaviours the combat engine implements. A weapon (including those added by
 * future world packs) picks a kind and tunes it; the engine never looks at weapon names.
 *  - strike:      a single powerful attack (optionally releasing waves)
 *  - slam:        a radial ground impact (optionally releasing shockwaves)
 *  - dash_flurry: an invulnerable dash that hits repeatedly and ends with a finisher
 *  - projectile:  casts one large elemental projectile that bursts on impact
 */
export type SpecialKind = 'strike' | 'slam' | 'dash_flurry' | 'projectile';

export interface SpecialDef {
  kind: SpecialKind;
  /** English text is also the localisation key (see weapon `ar`). */
  name: string;
  description: string;
  ar: { name: string; description: string };
  /** ms. */
  cooldown: number;
  /** Energy spent per cast. */
  energyCost: number;
  /** Timing, hitbox, damage, knockback and animation of the main hit (or the cast / finisher). */
  attack: AttackDef;
  /** dash_flurry only. */
  dash?: { distance: number; duration: number; interval: number; hitDamage: number };
  /** Waves released when the active phase begins (strike / slam). */
  waves?: WaveSpec[];
  /** projectile only. */
  projectile?: ProjectileSpec;
}

/** Procedural weapon art: the family decides the geometry, these tune proportions and palette. */
export interface WeaponArt {
  /** Main material colour (blade, head, shaft). */
  primary: number;
  /** Secondary colour (guard, binding, gem). */
  accent: number;
  /** Energy glow colour; omitted for plain weapons. */
  glow?: number;
  /** Overall length multiplier. */
  length?: number;
  /** Family-specific silhouette variant (0..2): blade edge, axe head, crystal shape...). */
  variant?: number;
}

export type WeaponSource =
  | { type: 'start' }
  | { type: 'boss'; boss: string }
  | { type: 'quest'; quest: string }
  | { type: 'chest'; region: string; pickup: string }
  /** Purchasable for Gold Coins once the world `unlockPack` (default: the weapon's own world) is reachable. */
  | { type: 'shop'; price: number; unlockPack?: string };

export interface WeaponDef {
  id: string;
  /** English name = localisation key. */
  name: string;
  description: string;
  ar: { name: string; description: string };
  category: WeaponCategory;
  icon: string;
  /** World pack id the weapon belongs to, or `core`. */
  world: string;
  rarity: Rarity;
  combo: WeaponCombo;
  special: SpecialDef;
  element: Element;
  /** Applied to every normal hit of an elemental weapon. */
  elementEffect?: { burn?: { dps: number; duration: number }; stagger?: number };
  /** Multiplier on all base damage (rarity / tier power). */
  damageScale: number;
  /** Attack speed multiplier (1 = the family template). */
  speed: number;
  /** Combo damage gained per consecutive hit (default 0.08). */
  comboGain: number;
  maxLevel: number;
  /** Gold Coins to reach level 2..maxLevel (length = maxLevel - 1, strictly increasing). */
  upgradeCosts: number[];
  sources: WeaponSource[];
  art: WeaponArt;
  sfx: { swing: SfxName; heavy: SfxName; special: SfxName };
  vfx: { trail: number; impact: number };
}

/** What a level of upgrades does to a weapon (all derived, never stored). */
export interface WeaponStats {
  damageMult: number;
  speedMult: number;
  specialMult: number;
  costMult: number;
  comboGain: number;
}
