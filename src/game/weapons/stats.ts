import type { AttackDef } from '@/shared/types';
import type { Rarity, WeaponDef, WeaponStats } from './types';

export const MAX_WEAPON_LEVEL = 5;

/** Per-level gains, applied to normal attacks, combos and specials alike. */
export const LEVEL_GAIN = { damage: 0.08, speed: 0.025, special: 0.1, cost: 0.04, combo: 0.05 } as const;

/** Shop price bands per rarity (Gold Coins). Validation rejects prices outside the band. */
export const PRICE_BANDS: Record<Rarity, [number, number]> = {
  common: [100, 250],
  uncommon: [300, 600],
  rare: [700, 1200],
  epic: [1500, 2500],
  legendary: [3000, 5000],
};

/** Base upgrade price per rarity; the curve below multiplies it. */
const UPGRADE_BASE: Record<Rarity, number> = { common: 50, uncommon: 80, rare: 140, epic: 260, legendary: 420 };
const UPGRADE_CURVE = [1, 1.8, 3, 4.6] as const;

/** Gold Coins needed to reach level 2, 3, 4, 5. Increases gradually and is derived, so every weapon is consistent. */
export function upgradeCostsFor(rarity: Rarity): number[] {
  return UPGRADE_CURVE.map((k) => Math.round((UPGRADE_BASE[rarity] * k) / 5) * 5);
}

export function clampLevel(level: number, def: Pick<WeaponDef, 'maxLevel'>): number {
  return Number.isFinite(level) ? Math.min(def.maxLevel, Math.max(1, Math.floor(level))) : 1;
}

export function weaponStats(def: WeaponDef, level: number): WeaponStats {
  const n = clampLevel(level, def) - 1;
  return {
    damageMult: def.damageScale * (1 + LEVEL_GAIN.damage * n),
    speedMult: def.speed * (1 + LEVEL_GAIN.speed * n),
    specialMult: 1 + LEVEL_GAIN.special * n,
    costMult: 1 - LEVEL_GAIN.cost * n,
    comboGain: def.comboGain * (1 + LEVEL_GAIN.combo * n),
  };
}

/** Cost to go from `level` to `level + 1`, or `null` at the cap. */
export function nextUpgradeCost(def: WeaponDef, level: number): number | null {
  const lv = clampLevel(level, def);
  return lv >= def.maxLevel ? null : (def.upgradeCosts[lv - 1] ?? null);
}

/** Attack timings sped up by the weapon's speed (startup and recovery shrink; the active window is unchanged). */
export function scaleAttackTiming(def: AttackDef, speedMult: number, costMult: number): AttackDef {
  if (speedMult === 1 && costMult === 1) return def;
  return {
    ...def,
    startup: Math.round(def.startup / speedMult),
    recovery: Math.round(def.recovery / speedMult),
    comboWindow: def.comboWindow,
    staminaCost: def.staminaCost === undefined ? undefined : Math.max(1, Math.round(def.staminaCost * costMult)),
    energyCost: def.energyCost === undefined ? undefined : Math.max(1, Math.round(def.energyCost * costMult)),
  };
}

/** Longest chain of `next` links starting at `id` following light inputs (cycle-safe). */
export function lightChain(def: WeaponDef): AttackDef[] {
  const out: AttackDef[] = [];
  const seen = new Set<string>();
  let id: string | undefined = def.combo.openers.light;
  while (id && !seen.has(id)) {
    seen.add(id);
    const a: AttackDef | undefined = def.combo.attacks[id];
    if (!a) break;
    out.push(a);
    id = a.next?.light;
  }
  return out;
}

export interface WeaponSummary {
  /** Average damage per hit across the light chain, scaled by rarity and level. */
  damage: number;
  /** Hits per second across the light chain. */
  attackSpeed: number;
  /** Longest forward reach in px (projectile weapons: travel distance). */
  range: number;
  /** Raw damage per second across the light chain (before attack stat and combo scaling). */
  dps: number;
  specialCooldown: number;
  specialCost: number;
}

/** Numbers shown in the inventory and shop. Pure and level-aware. */
export function summarize(def: WeaponDef, level: number): WeaponSummary {
  const st = weaponStats(def, level);
  const chain = lightChain(def);
  const dmg = chain.reduce((s, a) => s + a.damage, 0) * st.damageMult;
  const time = chain.reduce((s, a) => {
    const sc = scaleAttackTiming(a, st.speedMult, 1);
    return s + sc.startup + sc.active + sc.recovery;
  }, 0);
  const reach = Math.max(
    ...chain.map((a) => (a.projectile ? a.projectile.speed * (a.projectile.life / 1000) : a.hitbox.ox + a.hitbox.w / 2)),
  );
  const n = Math.max(1, chain.length);
  return {
    damage: Math.round((dmg / n) * 10) / 10,
    attackSpeed: Math.round((n / (time / 1000)) * 100) / 100,
    range: Math.round(reach),
    dps: Math.round((dmg / (time / 1000)) * 10) / 10,
    specialCooldown: def.special.cooldown,
    specialCost: Math.max(1, Math.round(def.special.energyCost * st.costMult)),
  };
}
