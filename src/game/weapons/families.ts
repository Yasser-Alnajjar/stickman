import type { AttackDef, ProjectileSpec } from '@/shared/types';
import { PLAYER_ATTACKS } from '@/game/config/attacks';
import type { SpecialDef, WaveSpec, WeaponCategory, WeaponCombo } from './types';

/**
 * Combat templates for the weapon families. A family is pure data: its attacks (with `next` links forming the combo
 * graph), its openers and its special ability. Weapons in `catalog/` pick a family and tune power, reach, speed and
 * element; the combat engine only ever reads the resulting definitions.
 */

const base = (id: string, name: string, o: Partial<AttackDef> & { damage: number }): AttackDef => ({
  hitbox: { w: 80, h: 50, ox: 50, oy: -10 },
  startup: 100, active: 80, recovery: 160, knockback: { x: 240, y: -60 }, hitStun: 280,
  hitStop: 55, shake: 0, anim: 'sword_slash1', sfx: 'slash', staminaCost: 6, comboWindow: 300,
  ...o, id, name,
});

/** The shared quick kick every armed player keeps on the kick button. */
const KICK: AttackDef = { ...PLAYER_ATTACKS.kick, id: 'wp_kick', name: 'Kick', next: undefined, comboWindow: 200 };

const hb = (w: number, h: number, ox: number, oy = -10): AttackDef['hitbox'] => ({ w, h, ox, oy });

/* ------------------------------------------------------------------------------------------------ sword */

const SWORD: Record<string, AttackDef> = {
  sword_1: base('sword_1', 'Slash', {
    damage: 11, hitbox: hb(86, 50, 54), startup: 90, active: 80, recovery: 150, knockback: { x: 260, y: -60 },
    anim: 'sword_slash1', next: { light: 'sword_2', kick: 'wp_kick', heavy: 'sword_heavy' },
  }),
  sword_2: base('sword_2', 'Backslash', {
    damage: 12, hitbox: hb(90, 50, 56), startup: 90, active: 80, recovery: 160, knockback: { x: 280, y: -70 },
    anim: 'sword_slash2', next: { light: 'sword_3', kick: 'wp_kick', heavy: 'sword_heavy' },
  }),
  sword_3: base('sword_3', 'Rising Cleave', {
    damage: 20, hitbox: hb(100, 72, 60, -18), startup: 160, active: 110, recovery: 360, knockback: { x: 480, y: -240 },
    hitStun: 420, hitStop: 100, shake: 0.005, staminaCost: 10, lunge: 180, anim: 'sword_cleave', comboWindow: undefined,
  }),
  sword_heavy: base('sword_heavy', 'Overhead Chop', {
    damage: 22, hitbox: hb(92, 70, 58, -14), startup: 250, active: 110, recovery: 420, knockback: { x: 450, y: -260 },
    hitStun: 440, hitStop: 100, shake: 0.006, staminaCost: 14, lunge: 160, anim: 'sword_overhead', sfx: 'chop', comboWindow: undefined,
  }),
  wp_kick: KICK,
};

const SWORD_WAVE: WaveSpec = {
  speed: 760, w: 64, h: 104, life: 380, color: 0xbfe4ff, pierce: -1, oy: -16, damageMult: 0.6,
};

/* ------------------------------------------------------------------------------------------------ daggers */

const DAGGER_NEXT = (light: string): AttackDef['next'] => ({ light, kick: 'wp_kick', heavy: 'dagger_heavy' });
const DAGGERS: Record<string, AttackDef> = {
  dagger_1: base('dagger_1', 'Stab', {
    damage: 6, hitbox: hb(58, 36, 36, -8), startup: 40, active: 50, recovery: 70, knockback: { x: 110, y: -20 },
    hitStun: 180, hitStop: 25, staminaCost: 3, comboWindow: 240, anim: 'dagger_l', sfx: 'stab', next: DAGGER_NEXT('dagger_2'),
  }),
  dagger_2: base('dagger_2', 'Counter Stab', {
    damage: 6, hitbox: hb(58, 36, 36, -8), startup: 40, active: 50, recovery: 70, knockback: { x: 110, y: -20 },
    hitStun: 180, hitStop: 25, staminaCost: 3, comboWindow: 240, anim: 'dagger_r', sfx: 'stab', next: DAGGER_NEXT('dagger_3'),
  }),
  dagger_3: base('dagger_3', 'Twin Slice', {
    damage: 7, hitbox: hb(62, 40, 38, -8), startup: 45, active: 50, recovery: 75, knockback: { x: 130, y: -30 },
    hitStun: 190, hitStop: 28, staminaCost: 3, comboWindow: 240, anim: 'dagger_l', sfx: 'stab', next: DAGGER_NEXT('dagger_4'),
  }),
  dagger_4: base('dagger_4', 'Whirl Slice', {
    damage: 7, hitbox: hb(62, 40, 38, -8), startup: 45, active: 55, recovery: 80, knockback: { x: 140, y: -30 },
    hitStun: 200, hitStop: 28, staminaCost: 4, comboWindow: 260, anim: 'dagger_r', sfx: 'stab', next: DAGGER_NEXT('dagger_5'),
  }),
  dagger_5: base('dagger_5', 'Cross Slash', {
    damage: 13, hitbox: hb(74, 48, 42, -8), startup: 100, active: 80, recovery: 280, knockback: { x: 360, y: -150 },
    hitStun: 340, hitStop: 70, shake: 0.002, staminaCost: 7, lunge: 140, anim: 'dagger_cross', sfx: 'slash', comboWindow: undefined,
  }),
  dagger_heavy: base('dagger_heavy', 'Twin Stab', {
    damage: 14, hitbox: hb(66, 40, 42, -8), startup: 130, active: 70, recovery: 260, knockback: { x: 300, y: -90 },
    hitStun: 300, hitStop: 60, staminaCost: 6, lunge: 200, anim: 'dagger_cross', sfx: 'stab', comboWindow: undefined,
  }),
  wp_kick: KICK,
};

/* ------------------------------------------------------------------------------------------------ axe */

const AXE: Record<string, AttackDef> = {
  axe_1: base('axe_1', 'Chop', {
    damage: 17, hitbox: hb(92, 66, 56, -12), startup: 220, active: 100, recovery: 330, knockback: { x: 420, y: -150 },
    hitStun: 380, hitStop: 85, shake: 0.004, staminaCost: 11, comboWindow: 340, armorBreak: true,
    anim: 'axe_chop', sfx: 'chop', next: { light: 'axe_2', kick: 'wp_kick', heavy: 'axe_heavy' },
  }),
  axe_2: base('axe_2', 'Backswing', {
    damage: 19, hitbox: hb(100, 64, 60, -12), startup: 240, active: 100, recovery: 360, knockback: { x: 460, y: -160 },
    hitStun: 400, hitStop: 90, shake: 0.005, staminaCost: 12, comboWindow: 340, armorBreak: true,
    anim: 'axe_back', sfx: 'chop', next: { light: 'axe_3', kick: 'wp_kick', heavy: 'axe_heavy' },
  }),
  axe_3: base('axe_3', 'Cleaving Smash', {
    damage: 32, hitbox: hb(104, 80, 62, -16), startup: 330, active: 130, recovery: 560, knockback: { x: 620, y: -300 },
    hitStun: 520, hitStop: 130, shake: 0.01, staminaCost: 18, lunge: 160, armorBreak: true, stagger: 500,
    anim: 'axe_smash', sfx: 'smash', comboWindow: undefined,
  }),
  axe_heavy: base('axe_heavy', 'Overhead Chop', {
    damage: 28, hitbox: hb(96, 84, 58, -16), startup: 340, active: 110, recovery: 520, knockback: { x: 560, y: -280 },
    hitStun: 480, hitStop: 120, shake: 0.008, staminaCost: 16, armorBreak: true, stagger: 400,
    anim: 'axe_smash', sfx: 'smash', comboWindow: undefined,
  }),
  wp_kick: KICK,
};

/* ------------------------------------------------------------------------------------------------ spear */

const SPEAR: Record<string, AttackDef> = {
  spear_1: base('spear_1', 'Thrust', {
    damage: 11, hitbox: hb(128, 26, 84, -12), startup: 100, active: 90, recovery: 180, knockback: { x: 240, y: -30 },
    hitStun: 260, hitStop: 50, staminaCost: 6, comboWindow: 300, anim: 'spear_thrust', sfx: 'stab',
    next: { light: 'spear_2', kick: 'wp_kick', heavy: 'spear_heavy' },
  }),
  spear_2: base('spear_2', 'Double Thrust', {
    damage: 12, hitbox: hb(134, 26, 88, -12), startup: 90, active: 90, recovery: 190, knockback: { x: 260, y: -30 },
    hitStun: 270, hitStop: 55, staminaCost: 6, comboWindow: 300, anim: 'spear_thrust2', sfx: 'stab',
    next: { light: 'spear_3', kick: 'wp_kick', heavy: 'spear_heavy' },
  }),
  spear_3: base('spear_3', 'Lunging Skewer', {
    damage: 19, hitbox: hb(160, 34, 98, -12), startup: 190, active: 110, recovery: 330, knockback: { x: 520, y: -160 },
    hitStun: 420, hitStop: 90, shake: 0.004, staminaCost: 10, lunge: 320, anim: 'spear_lunge', sfx: 'stab', comboWindow: undefined,
  }),
  spear_heavy: base('spear_heavy', 'Vault Thrust', {
    damage: 21, hitbox: hb(176, 38, 106, -12), startup: 260, active: 110, recovery: 400, knockback: { x: 480, y: -170 },
    hitStun: 420, hitStop: 100, shake: 0.004, staminaCost: 13, lunge: 260, anim: 'spear_lunge', sfx: 'stab', comboWindow: undefined,
  }),
  wp_kick: KICK,
};

/* ------------------------------------------------------------------------------------------------ staff */

const BOLT: ProjectileSpec = { speed: 760, w: 30, h: 18, life: 650, color: 0xb98cff, pierce: 0, oy: -22 };
const ORB: ProjectileSpec = { ...BOLT, speed: 560, w: 46, h: 40, life: 760, burst: { radius: 70, damageMult: 0.6 } };
const BIG_ORB: ProjectileSpec = { ...BOLT, speed: 520, w: 54, h: 48, life: 820, burst: { radius: 96, damageMult: 0.7 } };

const STAFF: Record<string, AttackDef> = {
  staff_1: base('staff_1', 'Arcane Bolt', {
    damage: 8, hitbox: hb(1, 1, -5000), startup: 150, active: 40, recovery: 170, knockback: { x: 150, y: -30 },
    hitStun: 220, hitStop: 25, staminaCost: undefined, energyCost: 3, comboWindow: 280, anim: 'staff_cast', sfx: 'magic',
    projectile: BOLT, next: { light: 'staff_2', kick: 'wp_kick', heavy: 'staff_heavy' },
  }),
  staff_2: base('staff_2', 'Twin Bolt', {
    damage: 9, hitbox: hb(1, 1, -5000), startup: 130, active: 40, recovery: 170, knockback: { x: 160, y: -30 },
    hitStun: 230, hitStop: 25, staminaCost: undefined, energyCost: 3, comboWindow: 280, anim: 'staff_cast2', sfx: 'magic',
    projectile: { ...BOLT, oy: -34 }, next: { light: 'staff_3', kick: 'wp_kick', heavy: 'staff_heavy' },
  }),
  staff_3: base('staff_3', 'Arcane Burst', {
    damage: 16, hitbox: hb(1, 1, -5000), startup: 240, active: 50, recovery: 330, knockback: { x: 380, y: -160 },
    hitStun: 380, hitStop: 70, shake: 0.003, staminaCost: undefined, energyCost: 7, anim: 'staff_cast', sfx: 'magic',
    projectile: ORB, comboWindow: undefined,
  }),
  staff_heavy: base('staff_heavy', 'Charged Orb', {
    damage: 22, hitbox: hb(1, 1, -5000), startup: 380, active: 50, recovery: 420, knockback: { x: 420, y: -200 },
    hitStun: 420, hitStop: 90, shake: 0.005, staminaCost: undefined, energyCost: 10, stagger: 350, anim: 'staff_charge',
    sfx: 'magic', projectile: BIG_ORB, comboWindow: undefined,
  }),
  staff_bash: base('staff_bash', 'Staff Bash', {
    damage: 5, hitbox: hb(72, 44, 44, -10), startup: 140, active: 80, recovery: 260, knockback: { x: 200, y: -40 },
    hitStun: 240, hitStop: 40, staminaCost: 4, anim: 'staff_bash', sfx: 'punch', comboWindow: undefined,
  }),
  wp_kick: KICK,
};

/* ------------------------------------------------------------------------------------------------ hammer */

const HAMMER: Record<string, AttackDef> = {
  hammer_1: base('hammer_1', 'Smash', {
    damage: 24, hitbox: hb(96, 80, 58, -16), startup: 320, active: 120, recovery: 520, knockback: { x: 560, y: -260 },
    hitStun: 520, hitStop: 120, shake: 0.008, staminaCost: 16, comboWindow: 380, stagger: 450,
    anim: 'hammer_smash', sfx: 'smash', next: { light: 'hammer_2', kick: 'wp_kick', heavy: 'hammer_heavy' },
  }),
  hammer_2: base('hammer_2', 'Crushing Blow', {
    damage: 36, hitbox: hb(190, 90, 0, -6), startup: 420, active: 140, recovery: 700, knockback: { x: 680, y: -340 },
    hitStun: 620, hitStop: 150, shake: 0.012, staminaCost: 22, radial: true, stagger: 800,
    anim: 'hammer_slam', sfx: 'smash', comboWindow: undefined,
  }),
  hammer_heavy: base('hammer_heavy', 'Ground Pound', {
    damage: 30, hitbox: hb(170, 84, 0, -6), startup: 380, active: 130, recovery: 620, knockback: { x: 620, y: -320 },
    hitStun: 560, hitStop: 130, shake: 0.01, staminaCost: 19, radial: true, stagger: 650,
    anim: 'hammer_slam', sfx: 'smash', comboWindow: undefined,
  }),
  wp_kick: KICK,
};

/* ------------------------------------------------------------------------------------------------ specials */

const spec = (kind: SpecialDef['kind'], o: Omit<SpecialDef, 'kind'>): SpecialDef => ({ kind, ...o });

const SPECIALS: Record<Exclude<WeaponCategory, 'fists'>, SpecialDef> = {
  sword: spec('strike', {
    name: 'Crescent Slash', description: 'A powerful forward slash that cuts every enemy in front of you and sends a crescent wave ahead.',
    ar: { name: 'الشطبة الهلالية', description: 'شطبة أمامية قوية تقطع كل الأعداء أمامك وترسل موجة هلالية.' },
    cooldown: 7000, energyCost: 24,
    attack: base('sword_special', 'Crescent Slash', {
      damage: 30, hitbox: hb(210, 96, 118, -12), startup: 200, active: 150, recovery: 320, knockback: { x: 700, y: -300 },
      hitStun: 520, hitStop: 110, shake: 0.008, staminaCost: undefined, lunge: 220, anim: 'sword_crescent', sfx: 'special', comboWindow: undefined,
    }),
    waves: [SWORD_WAVE],
  }),
  daggers: spec('dash_flurry', {
    name: 'Shadow Flurry', description: 'Dash through enemies in a rapid blur of stabs, invulnerable while moving, ending with a cross slash.',
    ar: { name: 'عاصفة الظل', description: 'اندفع عبر الأعداء بوابل من الطعنات السريعة، محصّن أثناء الحركة، وتنتهي بشطبة متقاطعة.' },
    cooldown: 6500, energyCost: 22,
    dash: { distance: 330, duration: 300, interval: 70, hitDamage: 7 },
    attack: base('dagger_special', 'Shadow Flurry', {
      damage: 14, hitbox: hb(84, 56, 44, -8), startup: 0, active: 90, recovery: 220, knockback: { x: 420, y: -200 },
      hitStun: 380, hitStop: 80, shake: 0.004, staminaCost: undefined, anim: 'dagger_cross', sfx: 'special', comboWindow: undefined,
    }),
  }),
  axe: spec('slam', {
    name: 'Earthsplitter', description: 'Smash the ground in a powerful area impact that breaks shields and staggers everything nearby.',
    ar: { name: 'شاقّ الأرض', description: 'اضرب الأرض بتأثير واسع قوي يكسر الدروع ويُربك كل من حولك.' },
    cooldown: 9000, energyCost: 30,
    attack: base('axe_special', 'Earthsplitter', {
      damage: 42, hitbox: hb(320, 110, 0, 0), startup: 440, active: 160, recovery: 560, knockback: { x: 600, y: -420 },
      hitStun: 640, hitStop: 150, shake: 0.018, staminaCost: undefined, radial: true, armorBreak: true, stagger: 900,
      anim: 'axe_slam', sfx: 'special', comboWindow: undefined,
    }),
  }),
  spear: spec('strike', {
    name: 'Piercing Rush', description: 'Lunge forward with a long piercing thrust that skewers every enemy in a line.',
    ar: { name: 'الاندفاعة الثاقبة', description: 'اندفع للأمام بطعنة طويلة ثاقبة تخترق كل الأعداء في خط واحد.' },
    cooldown: 7000, energyCost: 22,
    attack: base('spear_special', 'Piercing Rush', {
      damage: 28, hitbox: hb(360, 40, 210, -12), startup: 170, active: 130, recovery: 360, knockback: { x: 500, y: -180 },
      hitStun: 440, hitStop: 100, shake: 0.006, staminaCost: undefined, lunge: 460, anim: 'spear_rush', sfx: 'special', comboWindow: undefined,
    }),
  }),
  staff: spec('projectile', {
    name: 'Elemental Nova', description: 'Cast a huge elemental orb that detonates in an area where it hits.',
    ar: { name: 'النوفا العنصرية', description: 'أطلق كرة عنصرية ضخمة تنفجر في منطقة واسعة عند الإصابة.' },
    cooldown: 8000, energyCost: 30,
    attack: base('staff_special', 'Elemental Nova', {
      damage: 34, hitbox: hb(1, 1, -5000), startup: 260, active: 60, recovery: 380, knockback: { x: 520, y: -260 },
      hitStun: 520, hitStop: 120, shake: 0.008, staminaCost: undefined, anim: 'staff_charge', sfx: 'special', comboWindow: undefined,
    }),
    projectile: { speed: 600, w: 58, h: 58, life: 900, color: 0xb98cff, pierce: 0, oy: -26, burst: { radius: 150, damageMult: 0.8 } },
  }),
  hammer: spec('slam', {
    name: 'Quake', description: 'Slam the ground to send a shockwave that rolls out both ways and staggers nearby enemies.',
    ar: { name: 'الزلزال', description: 'اضرب الأرض لتنطلق موجة صدمة في الاتجاهين تُربك الأعداء القريبين.' },
    cooldown: 10000, energyCost: 28,
    attack: base('hammer_special', 'Quake', {
      damage: 30, hitbox: hb(260, 100, 0, 0), startup: 460, active: 150, recovery: 640, knockback: { x: 640, y: -360 },
      hitStun: 620, hitStop: 140, shake: 0.016, staminaCost: undefined, radial: true, stagger: 800,
      anim: 'hammer_slam', sfx: 'special', comboWindow: undefined,
    }),
    waves: [{ speed: 520, w: 74, h: 50, life: 700, color: 0xd9b36a, pierce: -1, ground: true, bothSides: true, damageMult: 0.7 }],
  }),
};

/** Bare Fists: the unarmed starting kit gets a haymaker as its special. */
export const FISTS_SPECIAL: SpecialDef = spec('strike', {
  name: 'Haymaker', description: 'Wind up and land a crushing lunging punch that staggers the target.',
  ar: { name: 'اللكمة القاضية', description: 'استعد ثم وجّه لكمة ساحقة مندفعة تُربك الهدف.' },
  cooldown: 8000, energyCost: 20,
  attack: base('fists_special', 'Haymaker', {
    damage: 26, hitbox: hb(104, 72, 62, -14), startup: 260, active: 120, recovery: 420, knockback: { x: 640, y: -320 },
    hitStun: 520, hitStop: 120, shake: 0.008, staminaCost: undefined, lunge: 300, stagger: 350,
    anim: 'heavy', sfx: 'special', comboWindow: undefined,
  }),
});

/* ------------------------------------------------------------------------------------------------ exports */

export interface FamilyKit {
  combo: WeaponCombo;
  special: SpecialDef;
  /** Template attack speed and combo gain for the family. */
  speed: number;
  comboGain: number;
}

const kit = (attacks: Record<string, AttackDef>, openers: WeaponCombo['openers'], extra: Partial<WeaponCombo> = {}): WeaponCombo =>
  ({ attacks, openers, ...extra });

export const FAMILY_COMBOS: Record<Exclude<WeaponCategory, 'fists'>, WeaponCombo> = {
  sword: kit(SWORD, { light: 'sword_1', kick: 'wp_kick', heavy: 'sword_heavy' }),
  daggers: kit(DAGGERS, { light: 'dagger_1', kick: 'wp_kick', heavy: 'dagger_heavy' }),
  axe: kit(AXE, { light: 'axe_1', kick: 'wp_kick', heavy: 'axe_heavy' }),
  spear: kit(SPEAR, { light: 'spear_1', kick: 'wp_kick', heavy: 'spear_heavy' }),
  staff: kit(STAFF, { light: 'staff_1', kick: 'wp_kick', heavy: 'staff_heavy' }, { fallback: 'staff_bash' }),
  hammer: kit(HAMMER, { light: 'hammer_1', kick: 'wp_kick', heavy: 'hammer_heavy' }),
};

export const FAMILY_SPECIALS = SPECIALS;

/** Family defaults: daggers hit fast and ramp their combo harder; hammers and axes are slow. */
export const FAMILY_TUNING: Record<Exclude<WeaponCategory, 'fists'>, { speed: number; comboGain: number; icon: string }> = {
  sword: { speed: 1, comboGain: 0.08, icon: '🗡️' },
  daggers: { speed: 1, comboGain: 0.12, icon: '🔪' },
  axe: { speed: 1, comboGain: 0.07, icon: '🪓' },
  spear: { speed: 1, comboGain: 0.08, icon: '🔱' },
  staff: { speed: 1, comboGain: 0.07, icon: '🪄' },
  hammer: { speed: 1, comboGain: 0.06, icon: '🔨' },
};

/** The unarmed kit is the game's original combat, untouched: its combo graph is the shared PLAYER_ATTACKS table. */
export const FISTS_COMBO: WeaponCombo = {
  attacks: PLAYER_ATTACKS,
  openers: { light: 'punch1', kick: 'kick', heavy: 'heavy' },
  dashAttack: 'dash_attack',
};
