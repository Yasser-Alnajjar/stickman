import type { AttackDef } from '@/shared/types';
import { registerTranslations } from '@/i18n';
import { PRICE_BANDS } from './stats';
import { RARITIES, WEAPON_CATEGORIES, type WeaponDef } from './types';

/**
 * Runtime weapon registry. Core weapons register when `catalog/core.ts` loads; world packs add theirs through their
 * manifest (`weapons`). Nothing in the combat engine refers to a weapon by name: it consumes these definitions.
 */
export const WEAPONS: Record<string, WeaponDef> = {};
/** Registration order: starting kit, core shop weapons, then each pack's in campaign order. */
export const WEAPON_ORDER: string[] = [];

export const STARTING_WEAPON = 'fists';

const ID_RE = /^[a-z][a-z0-9_]{1,40}$/;
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const nonEmpty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;

function checkAttack(path: string, a: AttackDef, errs: string[]): void {
  if (!finite(a.damage) || a.damage <= 0) errs.push(`${path}: damage must be > 0`);
  for (const k of ['startup', 'active', 'recovery'] as const) if (!finite(a[k]) || a[k] < 0) errs.push(`${path}: ${k} must be >= 0`);
  if (!finite(a.active) || a.active <= 0) errs.push(`${path}: active must be > 0`);
  if (!a.hitbox || !finite(a.hitbox.w) || !finite(a.hitbox.h) || a.hitbox.w <= 0 || a.hitbox.h <= 0) errs.push(`${path}: invalid hitbox`);
  if (!a.knockback || !finite(a.knockback.x) || !finite(a.knockback.y)) errs.push(`${path}: invalid knockback`);
  if (!nonEmpty(a.anim)) errs.push(`${path}: missing animation`);
  if (a.energyCost !== undefined && (!finite(a.energyCost) || a.energyCost < 0)) errs.push(`${path}: invalid energyCost`);
  if (a.staminaCost !== undefined && (!finite(a.staminaCost) || a.staminaCost < 0)) errs.push(`${path}: invalid staminaCost`);
  if (a.projectile) {
    const p = a.projectile;
    if (![p.speed, p.w, p.h, p.life].every(finite) || p.speed <= 0 || p.life <= 0) errs.push(`${path}: invalid projectile`);
  }
}

/** Returns every problem with a definition (empty = valid). Used by registration and by the test suite. */
export function validateWeaponDef(def: WeaponDef): string[] {
  const errs: string[] = [];
  const at = (m: string): void => { errs.push(`${def.id}: ${m}`); };
  if (!ID_RE.test(def.id)) at('id must be lowercase snake_case');
  if (!nonEmpty(def.name) || !nonEmpty(def.description)) at('name and description are required');
  if (!nonEmpty(def.ar?.name) || !nonEmpty(def.ar?.description)) at('Arabic name and description are required');
  if (!nonEmpty(def.special?.ar?.name) || !nonEmpty(def.special?.ar?.description)) at('special needs Arabic text');
  if (!WEAPON_CATEGORIES.includes(def.category)) at(`unknown category ${def.category}`);
  if (!RARITIES.includes(def.rarity)) at(`unknown rarity ${def.rarity}`);
  if (!nonEmpty(def.icon)) at('icon is required');
  if (!nonEmpty(def.world)) at('world of origin is required');
  for (const k of ['damageScale', 'speed', 'comboGain'] as const) if (!finite(def[k]) || def[k] <= 0) at(`${k} must be > 0`);
  if (def.damageScale > 4 || def.speed > 2) at('stat multipliers are out of range');
  if (!Number.isInteger(def.maxLevel) || def.maxLevel < 1 || def.maxLevel > 10) at('maxLevel must be 1..10');
  if (def.upgradeCosts.length !== def.maxLevel - 1) at('upgradeCosts must list one price per level above 1');
  def.upgradeCosts.forEach((c, i) => {
    if (!Number.isInteger(c) || c <= 0) at('upgrade costs must be positive integers');
    if (i > 0 && c <= def.upgradeCosts[i - 1]) at('upgrade costs must increase');
  });
  if (def.sources.length === 0) at('at least one source is required');
  for (const s of def.sources) {
    if (s.type === 'shop') {
      const [lo, hi] = PRICE_BANDS[def.rarity];
      if (!Number.isInteger(s.price) || s.price < lo || s.price > hi) at(`shop price ${s.price} is outside the ${def.rarity} band ${lo}-${hi}`);
    }
  }

  // combo graph
  const { attacks, openers } = def.combo;
  if (Object.keys(attacks).length === 0) at('needs at least one normal attack');
  for (const [slot, id] of Object.entries(openers)) if (!attacks[id]) at(`opener ${slot} -> unknown attack ${id}`);
  for (const [id, a] of Object.entries(attacks)) {
    checkAttack(`${def.id}.${id}`, a, errs);
    for (const [slot, nx] of Object.entries(a.next ?? {})) if (nx && !attacks[nx]) at(`${id}.next.${slot} -> unknown attack ${nx}`);
  }
  if (def.combo.fallback && !attacks[def.combo.fallback]) at('fallback attack is missing');
  if (def.combo.dashAttack && !attacks[def.combo.dashAttack]) at('dash attack is missing');
  // a combo must make progress: following light links from the opener must terminate
  const seen = new Set<string>();
  let cur: string | undefined = openers.light;
  while (cur && attacks[cur] && !seen.has(cur)) { seen.add(cur); cur = attacks[cur].next?.light; }
  if (cur && seen.has(cur)) at('light combo loops forever');

  // special
  const sp = def.special;
  if (!['strike', 'slam', 'dash_flurry', 'projectile'].includes(sp.kind)) at(`unknown special kind ${sp.kind}`);
  if (!finite(sp.cooldown) || sp.cooldown < 1000) at('special cooldown must be >= 1000ms');
  if (!finite(sp.energyCost) || sp.energyCost < 0) at('special energy cost is invalid');
  checkAttack(`${def.id}.special`, sp.attack, errs);
  if (sp.kind === 'dash_flurry' && !(sp.dash && sp.dash.distance > 0 && sp.dash.duration > 0 && sp.dash.interval >= 40 && sp.dash.hitDamage > 0)) at('dash_flurry needs a valid dash');
  if (sp.kind === 'projectile' && !sp.projectile) at('projectile special needs a projectile');
  return errs;
}

export function registerWeapon(def: WeaponDef): void {
  if (WEAPONS[def.id]) throw new Error(`Duplicate weapon id "${def.id}"`);
  const errs = validateWeaponDef(def);
  if (errs.length) throw new Error(`Invalid weapon:\n${errs.join('\n')}`);
  WEAPONS[def.id] = def;
  WEAPON_ORDER.push(def.id);
  registerTranslations('ar', {
    [def.name]: def.ar.name, [def.description]: def.ar.description,
    [def.special.name]: def.special.ar.name, [def.special.description]: def.special.ar.description,
  });
}

export const weaponDef = (id: string): WeaponDef | undefined => WEAPONS[id];
