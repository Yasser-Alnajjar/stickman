import type { AttackDef, Element, ProjectileSpec } from '@/shared/types';
import { COLORS } from '@/shared/constants';
import { FAMILY_COMBOS, FAMILY_SPECIALS, FAMILY_TUNING, FISTS_COMBO, FISTS_SPECIAL } from './families';
import { upgradeCostsFor, MAX_WEAPON_LEVEL } from './stats';
import type { Rarity, SpecialDef, WeaponArt, WeaponCategory, WeaponCombo, WeaponDef, WeaponSource } from './types';

/** Default power multiplier per rarity: later worlds' enemies and bosses have far more health, so power must climb too. */
export const RARITY_POWER: Record<Rarity, number> = { common: 1, uncommon: 1.25, rare: 1.6, epic: 2.1, legendary: 2.8 };

const ELEMENT_COLOR: Record<Element, number> = {
  physical: 0xb98cff, fire: 0xff8a3a, lightning: COLORS.lightning, ice: COLORS.ice,
};
const ELEMENT_EFFECT: Record<Element, WeaponDef['elementEffect']> = {
  physical: undefined,
  fire: { burn: { dps: 4, duration: 2500 } },
  lightning: { stagger: 260 },
  ice: { stagger: 380 },
};

export interface WeaponSpec {
  id: string;
  name: string;
  description: string;
  ar: { name: string; description: string };
  category: Exclude<WeaponCategory, 'fists'>;
  world: string;
  rarity: Rarity;
  sources: WeaponSource[];
  art: WeaponArt;
  element?: Element;
  /** Overrides the rarity default. */
  power?: number;
  /** Attack speed multiplier. */
  speed?: number;
  /** Multiplies melee reach. */
  reach?: number;
  comboGain?: number;
  /** Multiplies special cooldown (<1 = more frequent). */
  specialCooldown?: number;
  /** Replaces the family's special name/description (a weapon-specific signature move). */
  special?: Partial<Pick<SpecialDef, 'name' | 'description' | 'ar'>>;
}

function reachAttack(a: AttackDef, k: number): AttackDef {
  if (k === 1 || a.hitbox.ox < -1000) return a;
  const w = Math.round(a.hitbox.w * k);
  const ox = a.radial ? a.hitbox.ox : Math.round(a.hitbox.ox * k);
  return { ...a, hitbox: { ...a.hitbox, w, ox } };
}

function tint(p: ProjectileSpec | undefined, color: number): ProjectileSpec | undefined {
  return p ? { ...p, color } : p;
}

/** Builds a full definition from a family template. Combat data is cloned so variants never share mutable state. */
export function defineWeapon(s: WeaponSpec): WeaponDef {
  const element = s.element ?? 'physical';
  const color = ELEMENT_COLOR[element];
  const reach = s.reach ?? 1;
  const baseCombo = FAMILY_COMBOS[s.category];
  const attacks: Record<string, AttackDef> = {};
  for (const [id, a] of Object.entries(baseCombo.attacks)) {
    const r = reachAttack(a, reach);
    attacks[id] = r.projectile ? { ...r, projectile: tint(r.projectile, color) } : r;
  }
  const combo: WeaponCombo = { ...baseCombo, attacks };
  const fam = FAMILY_SPECIALS[s.category];
  const special: SpecialDef = {
    ...fam,
    ...s.special,
    cooldown: Math.round(fam.cooldown * (s.specialCooldown ?? 1)),
    attack: reachAttack(fam.attack, reach),
    waves: fam.waves?.map((w) => ({ ...w })),
    projectile: tint(fam.projectile, color),
    dash: fam.dash ? { ...fam.dash } : undefined,
  };
  const tune = FAMILY_TUNING[s.category];
  const light = attacks[combo.openers.light];
  const heavy = attacks[combo.openers.heavy];
  return {
    id: s.id, name: s.name, description: s.description, ar: s.ar,
    category: s.category, icon: tune.icon, world: s.world, rarity: s.rarity,
    combo, special, element, elementEffect: ELEMENT_EFFECT[element],
    damageScale: s.power ?? RARITY_POWER[s.rarity],
    speed: s.speed ?? tune.speed, comboGain: s.comboGain ?? tune.comboGain,
    maxLevel: MAX_WEAPON_LEVEL, upgradeCosts: upgradeCostsFor(s.rarity),
    sources: s.sources, art: s.art,
    sfx: { swing: light.sfx, heavy: heavy.sfx, special: 'special' },
    vfx: { trail: s.art.glow ?? s.art.primary, impact: element === 'physical' ? 0xffffff : color },
  };
}

/** The unarmed starting kit: wraps the game's original combo untouched, so existing combat is exactly preserved. */
export const FISTS: WeaponDef = {
  id: 'fists', name: 'Bare Fists', description: 'Your own two hands: a fast, reliable punch combo that never runs out of energy.',
  ar: { name: 'القبضتان', description: 'يداك العاريتان: سلسلة لكمات سريعة وموثوقة لا تستهلك الطاقة.' },
  category: 'fists', icon: '👊', world: 'core', rarity: 'common',
  combo: FISTS_COMBO, special: FISTS_SPECIAL, element: 'physical',
  damageScale: 1, speed: 1, comboGain: 0.08,
  maxLevel: MAX_WEAPON_LEVEL, upgradeCosts: upgradeCostsFor('common'),
  sources: [{ type: 'start' }],
  art: { primary: 0xf4f7ff, accent: 0xff4d5e },
  sfx: { swing: 'punch', heavy: 'heavy', special: 'special' },
  vfx: { trail: 0xffffff, impact: 0xffffff },
};
