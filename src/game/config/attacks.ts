import type { AttackDef } from '@/shared/types';

const A = (d: AttackDef): AttackDef => d;

/** Player melee attacks and the combo graph (via `next`). */
export const PLAYER_ATTACKS: Record<string, AttackDef> = {
  punch1: A({
    id: 'punch1', name: 'Jab', damage: 8, hitbox: { w: 58, h: 40, ox: 46, oy: -12 },
    startup: 70, active: 80, recovery: 150, knockback: { x: 150, y: -30 }, hitStun: 230,
    staminaCost: 5, comboWindow: 280, hitStop: 45, shake: 0, anim: 'punch1', sfx: 'punch',
    next: { light: 'punch2', kick: 'combo_kick', heavy: 'heavy' },
  }),
  punch2: A({
    id: 'punch2', name: 'Cross', damage: 9, hitbox: { w: 62, h: 42, ox: 48, oy: -12 },
    startup: 75, active: 80, recovery: 160, knockback: { x: 190, y: -40 }, hitStun: 260,
    staminaCost: 5, comboWindow: 280, hitStop: 55, shake: 0, anim: 'punch2', sfx: 'punch',
    next: { light: 'combo_kick', kick: 'combo_kick', heavy: 'combo_heavy' },
  }),
  combo_kick: A({
    id: 'combo_kick', name: 'Roundhouse', damage: 12, hitbox: { w: 78, h: 48, ox: 52, oy: -4 },
    startup: 110, active: 100, recovery: 220, knockback: { x: 320, y: -120 }, hitStun: 320,
    staminaCost: 8, comboWindow: 320, hitStop: 70, shake: 0.003, anim: 'roundhouse', sfx: 'kick',
    next: { light: 'combo_heavy', kick: 'combo_heavy', heavy: 'combo_heavy' },
  }),
  combo_heavy: A({
    id: 'combo_heavy', name: 'Finisher', damage: 22, hitbox: { w: 92, h: 60, ox: 58, oy: -12 },
    startup: 230, active: 120, recovery: 400, knockback: { x: 560, y: -260 }, hitStun: 520,
    staminaCost: 14, lunge: 260, hitStop: 120, shake: 0.008, anim: 'heavy', sfx: 'heavy',
  }),
  kick: A({
    id: 'kick', name: 'Kick', damage: 11, hitbox: { w: 80, h: 44, ox: 54, oy: -2 },
    startup: 120, active: 90, recovery: 200, knockback: { x: 300, y: -90 }, hitStun: 300,
    staminaCost: 7, comboWindow: 300, hitStop: 65, shake: 0.002, anim: 'kick', sfx: 'kick',
    next: { light: 'punch2', kick: 'combo_kick', heavy: 'heavy' },
  }),
  heavy: A({
    id: 'heavy', name: 'Heavy Punch', damage: 20, hitbox: { w: 88, h: 60, ox: 56, oy: -12 },
    startup: 260, active: 110, recovery: 420, knockback: { x: 500, y: -230 }, hitStun: 480,
    staminaCost: 15, lunge: 220, hitStop: 110, shake: 0.007, anim: 'heavy', sfx: 'heavy',
  }),
  dash_attack: A({
    id: 'dash_attack', name: 'Dash Strike', damage: 14, hitbox: { w: 84, h: 52, ox: 54, oy: -10 },
    startup: 40, active: 150, recovery: 260, knockback: { x: 420, y: -140 }, hitStun: 380,
    staminaCost: 10, lunge: 520, hitStop: 80, shake: 0.005, anim: 'dash_attack', sfx: 'heavy',
  }),
  fire_punch: A({
    id: 'fire_punch', name: 'Fire Punch', damage: 24, hitbox: { w: 84, h: 78, ox: 56, oy: -22 },
    startup: 170, active: 130, recovery: 340, knockback: { x: 520, y: -330 }, hitStun: 560,
    hitStop: 120, shake: 0.009, lunge: 200, anim: 'uppercut', sfx: 'fire',
  }),
  lightning_dash: A({
    id: 'lightning_dash', name: 'Lightning Dash', damage: 18, hitbox: { w: 80, h: 80, ox: 0, oy: -6 },
    startup: 0, active: 200, recovery: 0, knockback: { x: 380, y: -200 }, hitStun: 450,
    hitStop: 60, shake: 0.004, anim: 'lightning', sfx: 'zap',
  }),
};

/** Enemy attacks. */
export const ENEMY_ATTACKS: Record<string, AttackDef> = {
  thug_jab: A({
    id: 'thug_jab', name: 'Thug Jab', damage: 8, hitbox: { w: 56, h: 40, ox: 44, oy: -12 },
    startup: 300, active: 90, recovery: 380, knockback: { x: 170, y: -40 }, hitStun: 260,
    hitStop: 50, shake: 0.002, anim: 'punch1', sfx: 'punch', telegraph: true,
  }),
  thug_hook: A({
    id: 'thug_hook', name: 'Thug Hook', damage: 11, hitbox: { w: 66, h: 46, ox: 48, oy: -8 },
    startup: 420, active: 100, recovery: 480, knockback: { x: 260, y: -90 }, hitStun: 340,
    hitStop: 65, shake: 0.003, anim: 'punch2', sfx: 'punch', telegraph: true,
  }),
  fast_slash: A({
    id: 'fast_slash', name: 'Flurry', damage: 6, hitbox: { w: 60, h: 40, ox: 46, oy: -10 },
    startup: 150, active: 70, recovery: 90, knockback: { x: 120, y: -30 }, hitStun: 200,
    hitStop: 35, shake: 0, anim: 'punch1', sfx: 'punch', chain: 'fast_kick',
  }),
  fast_kick: A({
    id: 'fast_kick', name: 'Flurry Kick', damage: 8, hitbox: { w: 76, h: 44, ox: 52, oy: -2 },
    startup: 110, active: 80, recovery: 380, knockback: { x: 260, y: -80 }, hitStun: 280,
    hitStop: 50, shake: 0.002, anim: 'kick', sfx: 'kick',
  }),
  heavy_slam: A({
    id: 'heavy_slam', name: 'Brute Slam', damage: 22, hitbox: { w: 110, h: 90, ox: 66, oy: -18 },
    startup: 650, active: 140, recovery: 700, knockback: { x: 560, y: -300 }, hitStun: 500,
    hitStop: 100, shake: 0.008, anim: 'slam', sfx: 'slam', telegraph: true, superArmor: true,
  }),
  heavy_swipe: A({
    id: 'heavy_swipe', name: 'Brute Swipe', damage: 14, hitbox: { w: 100, h: 60, ox: 60, oy: -10 },
    startup: 450, active: 110, recovery: 560, knockback: { x: 380, y: -120 }, hitStun: 380,
    hitStop: 80, shake: 0.005, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true,
  }),
  archer_shot: A({
    id: 'archer_shot', name: 'Sling Shot', damage: 9, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 },
    startup: 520, active: 60, recovery: 240, knockback: { x: 220, y: -60 }, hitStun: 280,
    hitStop: 40, shake: 0, anim: 'punch1', sfx: 'punch', telegraph: true,
  }),
  guard_thrust: A({
    id: 'guard_thrust', name: 'Guard Thrust', damage: 11, hitbox: { w: 96, h: 40, ox: 66, oy: -14 },
    startup: 420, active: 100, recovery: 520, knockback: { x: 300, y: -80 }, hitStun: 360,
    hitStop: 70, shake: 0.003, anim: 'punch2', sfx: 'heavy', telegraph: true, lunge: 140,
  }),
  guard_bash: A({
    id: 'guard_bash', name: 'Shield Bash', damage: 15, hitbox: { w: 84, h: 90, ox: 54, oy: -14 },
    startup: 560, active: 120, recovery: 680, knockback: { x: 520, y: -240 }, hitStun: 480,
    hitStop: 90, shake: 0.006, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true,
  }),
  blade_slash: A({
    id: 'blade_slash', name: 'Night Slash', damage: 8, hitbox: { w: 70, h: 44, ox: 50, oy: -8 },
    startup: 190, active: 70, recovery: 80, knockback: { x: 140, y: -40 }, hitStun: 220,
    hitStop: 40, shake: 0, anim: 'punch1', sfx: 'punch', chain: 'blade_cross',
  }),
  blade_cross: A({
    id: 'blade_cross', name: 'Night Cross', damage: 8, hitbox: { w: 74, h: 44, ox: 52, oy: -8 },
    startup: 140, active: 70, recovery: 80, knockback: { x: 160, y: -50 }, hitStun: 220,
    hitStop: 40, shake: 0, anim: 'punch2', sfx: 'punch', chain: 'blade_finish',
  }),
  blade_finish: A({
    id: 'blade_finish', name: 'Night Finish', damage: 12, hitbox: { w: 84, h: 52, ox: 58, oy: -4 },
    startup: 210, active: 90, recovery: 520, knockback: { x: 340, y: -140 }, hitStun: 320,
    hitStop: 60, shake: 0.002, anim: 'kick', sfx: 'kick', telegraph: true,
  }),
  blade_lunge: A({
    id: 'blade_lunge', name: 'Shadow Lunge', damage: 14, hitbox: { w: 90, h: 46, ox: 58, oy: -8 },
    startup: 360, active: 120, recovery: 620, knockback: { x: 360, y: -120 }, hitStun: 340,
    hitStop: 60, shake: 0.002, anim: 'dash_attack', sfx: 'heavy', telegraph: true, lunge: 640,
  }),
  /* ---- Boss ---- */
  boss_swing1: A({
    id: 'boss_swing1', name: 'Warden Swing', damage: 8, hitbox: { w: 140, h: 100, ox: 100, oy: -30 },
    startup: 520, active: 110, recovery: 120, knockback: { x: 380, y: -120 }, hitStun: 380,
    hitStop: 70, shake: 0.006, anim: 'punch1', sfx: 'heavy', telegraph: true, superArmor: true, chain: 'boss_swing2',
  }),
  boss_swing2: A({
    id: 'boss_swing2', name: 'Warden Backhand', damage: 8, hitbox: { w: 150, h: 100, ox: 104, oy: -30 },
    startup: 360, active: 110, recovery: 120, knockback: { x: 420, y: -140 }, hitStun: 380,
    hitStop: 70, shake: 0.006, anim: 'punch2', sfx: 'heavy', superArmor: true, chain: 'boss_swing3',
  }),
  boss_swing3: A({
    id: 'boss_swing3', name: 'Warden Smash', damage: 12, hitbox: { w: 170, h: 120, ox: 112, oy: -20 },
    startup: 440, active: 140, recovery: 900, knockback: { x: 650, y: -300 }, hitStun: 560,
    hitStop: 110, shake: 0.012, anim: 'slam', sfx: 'slam', superArmor: true,
  }),
  boss_slam: A({
    id: 'boss_slam', name: 'Warden Slam', damage: 18, hitbox: { w: 220, h: 130, ox: 120, oy: -10 },
    startup: 950, active: 140, recovery: 900, knockback: { x: 700, y: -380 }, hitStun: 600,
    hitStop: 130, shake: 0.016, anim: 'slam', sfx: 'slam', telegraph: true, superArmor: true,
  }),
  boss_charge: A({
    id: 'boss_charge', name: 'Warden Charge', damage: 16, hitbox: { w: 130, h: 150, ox: 70, oy: -20 },
    startup: 0, active: 900, recovery: 0, knockback: { x: 760, y: -300 }, hitStun: 600,
    hitStop: 130, shake: 0.014, anim: 'boss_charge', sfx: 'slam', superArmor: true,
  }),
  boss_leap: A({
    id: 'boss_leap', name: 'Warden Leap', damage: 18, hitbox: { w: 300, h: 100, ox: 0, oy: 30 },
    startup: 0, active: 160, recovery: 0, knockback: { x: 720, y: -380 }, hitStun: 600,
    hitStop: 140, shake: 0.018, anim: 'slam', sfx: 'slam', superArmor: true,
  }),
  boss_wave: A({
    id: 'boss_wave', name: 'Shockwave', damage: 10, hitbox: { w: 60, h: 46, ox: 0, oy: 0 },
    startup: 0, active: 4000, recovery: 0, knockback: { x: 420, y: -320 }, hitStun: 420,
    hitStop: 60, shake: 0.006, anim: 'slam', sfx: 'slam',
  }),
};

export const ALL_ATTACKS: Record<string, AttackDef> = { ...PLAYER_ATTACKS, ...ENEMY_ATTACKS };

/**
 * Every boss shares one attack set so the Boss class stays data-driven. The Warden's `boss_*` set is the
 * baseline; other bosses get scaled clones plus the extra moves only they use (volley/rain/pillars/...).
 */
export function bossSet(prefix: string, dmg: number, extras: Record<string, Partial<AttackDef>>, tune: Record<string, Partial<AttackDef>> = {}): void {
  for (const base of ['swing1', 'swing2', 'swing3', 'slam', 'charge', 'leap', 'wave']) {
    const src = ENEMY_ATTACKS[`boss_${base}`];
    const id = `${prefix}_${base}`;
    ENEMY_ATTACKS[id] = {
      ...src, ...tune[base], id, damage: Math.round((tune[base]?.damage ?? src.damage) * dmg),
      chain: tune[base]?.chain ?? (src.chain ? src.chain.replace('boss_', `${prefix}_`) : undefined),
    };
  }
  const blank: AttackDef = {
    id: '', name: '', damage: 10, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 }, startup: 0, active: 100, recovery: 0,
    knockback: { x: 400, y: -250 }, hitStun: 450, hitStop: 80, shake: 0.008, anim: 'slam', sfx: 'slam', superArmor: true,
  };
  for (const [k, o] of Object.entries(extras)) ENEMY_ATTACKS[`${prefix}_${k}`] = { ...blank, ...o, id: `${prefix}_${k}`, name: `${prefix} ${k}` };
}

