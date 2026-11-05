import { ATTACK_ANIMS } from './clips';
import { clamp01, easeInOut, easeOut, makePose, STANCE, type Pose } from './pose';
import type { WeaponCategory } from '@/game/weapons/types';

/**
 * Attack poses and weapon angles for the armed attack animations. Arm poses are registered into the shared
 * ATTACK_ANIMS table (so the existing sampler drives them); the weapon's own orientation is sampled separately by
 * `weaponAngles` because it must start from the weapon's rest angle, not from the generic stance.
 */
const mk = (windup: Partial<Pose>, strike: Partial<Pose>): { windup: Pose; strike: Pose } => ({
  windup: makePose({ ...STANCE, ...windup }),
  strike: makePose({ ...STANCE, ...strike }),
});

interface Ang { wa: number; wb?: number }
export const WEAPON_ANGLES: Record<string, { windup: Ang; strike: Ang }> = {};
const def = (name: string, windup: Partial<Pose>, strike: Partial<Pose>, angles: { windup: Ang; strike: Ang }): void => {
  ATTACK_ANIMS[name] = mk(windup, strike);
  WEAPON_ANGLES[name] = angles;
};

/* sword ------------------------------------------------------------------------------------------ */
def('sword_slash1',
  { lean: -0.15, aU: 2.2, aL: 2.6, bU: 0.3, bL: 1.8, fU: 0.5, fL: 0.1 },
  { lean: 0.35, aU: 1.3, aL: 1.2, bU: 0.1, bL: 1.6, fU: 0.85, fL: 0.2, gU: -0.55, gL: -0.75, shift: 8 },
  { windup: { wa: 2.9 }, strike: { wa: 1.25 } });
def('sword_slash2',
  { lean: 0.05, aU: 0.7, aL: 0.5, bU: 0.4, bL: 1.7, fU: 0.5, fL: 0.1, gU: -0.5, gL: -0.9 },
  { lean: 0.3, aU: 1.75, aL: 1.9, bU: -0.2, bL: 1.2, fU: 0.8, fL: 0.2, gU: -0.65, gL: -0.9, shift: 8 },
  { windup: { wa: 0.5 }, strike: { wa: 2.1 } });
def('sword_cleave',
  { lean: -0.1, aU: 0.1, aL: -0.3, bU: 0.2, bL: 1.5, fU: 0.9, fL: 0.5, gU: -0.7, gL: -1.1, drop: 8 },
  { lean: 0.5, aU: 2.5, aL: 2.8, bU: 0.6, bL: 1.8, fU: 0.5, fL: 0.1, gU: -0.4, gL: -0.5, shift: 14, sy: 1.05 },
  { windup: { wa: -0.2 }, strike: { wa: 2.7 } });
def('sword_overhead',
  { lean: -0.4, aU: 2.9, aL: 3.1, bU: 2.2, bL: 2.8, fU: 0.4, fL: 0.1, gU: -0.5, gL: -0.8, sy: 1.04 },
  { lean: 0.6, aU: 1.1, aL: 0.9, bU: 0.9, bL: 1.1, fU: 1.0, fL: 0.4, gU: -0.85, gL: -0.9, shift: 12, drop: 8 },
  { windup: { wa: 3.05 }, strike: { wa: 0.85 } });
def('sword_crescent',
  { lean: -0.5, aU: 2.6, aL: 3.0, bU: 2.0, bL: 2.6, fU: 0.4, fL: 0.1, gU: -0.6, gL: -0.9, rot: -0.08, sy: 1.04 },
  { lean: 0.75, aU: 1.5, aL: 1.5, bU: 1.0, bL: 1.3, fU: 1.0, fL: 0.4, gU: -0.9, gL: -1.0, shift: 20, sx: 1.08 },
  { windup: { wa: 3.1 }, strike: { wa: 1.5 } });

/* daggers ---------------------------------------------------------------------------------------- */
def('dagger_l',
  { lean: 0.1, aU: 0.3, aL: 1.3, bU: 0.5, bL: 1.7, fU: 0.5, fL: 0.1, gU: -0.4, gL: -0.7 },
  { lean: 0.4, aU: 1.5, aL: 1.57, bU: 0.4, bL: 1.5, fU: 0.85, fL: 0.2, gU: -0.6, gL: -0.8, shift: 9 },
  { windup: { wa: 1.4, wb: 1.5 }, strike: { wa: 1.57, wb: 1.5 } });
def('dagger_r',
  { lean: 0.1, aU: 0.5, aL: 1.7, bU: 0.3, bL: 1.3, fU: 0.5, fL: 0.1, gU: -0.4, gL: -0.7 },
  { lean: 0.4, aU: 0.5, aL: 1.6, bU: 1.5, bL: 1.57, fU: 0.8, fL: 0.2, gU: -0.6, gL: -0.8, shift: 9 },
  { windup: { wa: 1.5, wb: 1.4 }, strike: { wa: 1.5, wb: 1.57 } });
def('dagger_cross',
  { lean: -0.1, aU: 0.9, aL: 0.4, bU: 0.9, bL: 0.4, fU: 0.6, fL: 0.2, gU: -0.6, gL: -0.9, drop: 4 },
  { lean: 0.6, aU: 1.6, aL: 2.0, bU: 1.6, bL: 2.0, fU: 1.0, fL: 0.4, gU: -0.9, gL: -1.0, shift: 16, sx: 1.06 },
  { windup: { wa: 0.5, wb: 0.5 }, strike: { wa: 2.1, wb: 1.1 } });

/* axe -------------------------------------------------------------------------------------------- */
def('axe_chop',
  { lean: -0.35, aU: 2.7, aL: 3.0, bU: 2.0, bL: 2.6, fU: 0.4, fL: 0.1, gU: -0.5, gL: -0.8, sy: 1.03 },
  { lean: 0.55, aU: 1.2, aL: 1.0, bU: 1.0, bL: 1.2, fU: 0.95, fL: 0.3, gU: -0.8, gL: -0.9, shift: 10, drop: 6 },
  { windup: { wa: 3.0 }, strike: { wa: 1.0 } });
def('axe_back',
  { lean: 0.1, aU: 0.3, aL: -0.2, bU: 0.2, bL: 0.3, fU: 0.6, fL: 0.3, gU: -0.6, gL: -1.0, rot: 0.06 },
  { lean: 0.4, aU: 1.5, aL: 1.6, bU: 1.2, bL: 1.4, fU: 0.9, fL: 0.3, gU: -0.7, gL: -0.9, shift: 12, rot: -0.1 },
  { windup: { wa: 0.2 }, strike: { wa: 1.6 } });
def('axe_smash',
  { lean: -0.5, aU: 2.9, aL: 3.1, bU: 2.4, bL: 2.9, fU: 0.4, fL: 0.1, gU: -0.5, gL: -0.8, drop: 6, sy: 1.05 },
  { lean: 0.75, aU: 0.9, aL: 0.6, bU: 0.8, bL: 0.7, fU: 1.0, fL: 0.4, gU: -0.9, gL: -1.0, shift: 14, drop: 14, sy: 0.94 },
  { windup: { wa: 3.1 }, strike: { wa: 0.7 } });
def('axe_slam',
  { lean: -0.6, aU: 3.0, aL: 3.1, bU: 2.7, bL: 3.0, fU: 0.5, fL: 0.2, gU: -0.6, gL: -0.9, drop: 4, sy: 1.07 },
  { lean: 0.95, aU: 0.6, aL: 0.3, bU: 0.5, bL: 0.3, fU: 1.1, fL: 0.5, gU: -1.0, gL: -1.2, shift: 14, drop: 22, sy: 0.9 },
  { windup: { wa: 3.1 }, strike: { wa: 0.15 } });

/* spear ------------------------------------------------------------------------------------------ */
def('spear_thrust',
  { lean: -0.1, aU: 0.3, aL: 1.0, bU: 0.5, bL: 1.3, fU: 0.5, fL: 0.1, gU: -0.5, gL: -0.9 },
  { lean: 0.32, aU: 1.5, aL: 1.57, bU: 1.3, bL: 1.5, fU: 0.95, fL: 0.3, gU: -0.7, gL: -0.9, shift: 10 },
  { windup: { wa: 1.45 }, strike: { wa: 1.5 } });
def('spear_thrust2',
  { lean: -0.05, aU: 0.4, aL: 1.2, bU: 0.6, bL: 1.4, fU: 0.5, fL: 0.1, gU: -0.5, gL: -0.9 },
  { lean: 0.35, aU: 1.6, aL: 1.75, bU: 1.4, bL: 1.6, fU: 1.0, fL: 0.3, gU: -0.7, gL: -0.9, shift: 12 },
  { windup: { wa: 1.7 }, strike: { wa: 1.65 } });
def('spear_lunge',
  { lean: -0.2, aU: 0.1, aL: 0.8, bU: 0.3, bL: 1.0, fU: 0.7, fL: 0.4, gU: -0.7, gL: -1.1, drop: 6 },
  { lean: 0.65, aU: 1.5, aL: 1.55, bU: 1.3, bL: 1.5, fU: 1.25, fL: 0.5, gU: -1.0, gL: -1.2, shift: 18, sx: 1.08 },
  { windup: { wa: 1.35 }, strike: { wa: 1.45 } });
def('spear_rush',
  { lean: -0.25, aU: 0.0, aL: 0.7, bU: 0.2, bL: 0.9, fU: 0.8, fL: 0.4, gU: -0.8, gL: -1.2, drop: 8 },
  { lean: 0.85, aU: 1.5, aL: 1.55, bU: 1.3, bL: 1.5, fU: 1.4, fL: 0.6, gU: -1.2, gL: -1.4, shift: 22, sx: 1.14, sy: 0.92 },
  { windup: { wa: 1.35 }, strike: { wa: 1.5 } });

/* staff ------------------------------------------------------------------------------------------ */
def('staff_cast',
  { lean: -0.12, aU: 0.5, aL: 1.3, bU: 0.6, bL: 1.5, fU: 0.5, fL: 0.1, gU: -0.4, gL: -0.7 },
  { lean: 0.25, aU: 1.5, aL: 1.6, bU: 1.2, bL: 1.5, fU: 0.8, fL: 0.2, gU: -0.6, gL: -0.8, shift: 6 },
  { windup: { wa: 2.3 }, strike: { wa: 1.35 } });
def('staff_cast2',
  { lean: -0.05, aU: 0.8, aL: 2.2, bU: 0.9, bL: 2.3, fU: 0.5, fL: 0.1, gU: -0.4, gL: -0.7 },
  { lean: 0.28, aU: 1.6, aL: 1.7, bU: 1.3, bL: 1.6, fU: 0.85, fL: 0.2, gU: -0.6, gL: -0.8, shift: 6 },
  { windup: { wa: 3.0 }, strike: { wa: 1.5 } });
def('staff_charge',
  { lean: -0.3, aU: 2.7, aL: 3.0, bU: 2.4, bL: 2.8, fU: 0.4, fL: 0.1, gU: -0.5, gL: -0.8, sy: 1.04 },
  { lean: 0.5, aU: 1.4, aL: 1.5, bU: 1.2, bL: 1.4, fU: 0.95, fL: 0.3, gU: -0.8, gL: -0.9, shift: 12, drop: 4 },
  { windup: { wa: 3.1 }, strike: { wa: 1.45 } });
def('staff_bash',
  { lean: -0.2, aU: 2.0, aL: 2.5, bU: 1.6, bL: 2.2, fU: 0.5, fL: 0.1, gU: -0.5, gL: -0.8 },
  { lean: 0.4, aU: 1.2, aL: 1.0, bU: 1.0, bL: 1.2, fU: 0.85, fL: 0.2, gU: -0.7, gL: -0.9, shift: 8 },
  { windup: { wa: 2.7 }, strike: { wa: 0.9 } });

/* hammer ----------------------------------------------------------------------------------------- */
def('hammer_smash',
  { lean: -0.45, aU: 2.7, aL: 3.0, bU: 2.2, bL: 2.8, fU: 0.4, fL: 0.1, gU: -0.5, gL: -0.8, drop: 4 },
  { lean: 0.65, aU: 1.0, aL: 0.8, bU: 0.9, bL: 1.0, fU: 1.0, fL: 0.4, gU: -0.85, gL: -0.95, shift: 12, drop: 10 },
  { windup: { wa: 3.0 }, strike: { wa: 0.9 } });
def('hammer_slam',
  { lean: -0.6, aU: 3.0, aL: 3.1, bU: 2.7, bL: 3.0, fU: 0.5, fL: 0.2, gU: -0.6, gL: -0.9, sy: 1.07 },
  { lean: 0.9, aU: 0.6, aL: 0.3, bU: 0.5, bL: 0.3, fU: 1.1, fL: 0.5, gU: -1.0, gL: -1.2, shift: 12, drop: 22, sy: 0.9 },
  { windup: { wa: 3.1 }, strike: { wa: 0.1 } });

/* Rest angle of each family's weapon while idle / moving (pose convention: 0 down, PI/2 forward, PI up). */
export const REST_ANGLE: Record<WeaponCategory, { wa: number; wb: number }> = {
  fists: { wa: 0, wb: 0 },
  sword: { wa: 2.35, wb: 0 },
  daggers: { wa: 1.45, wb: 1.2 },
  axe: { wa: 2.7, wb: 0 },
  spear: { wa: 1.95, wb: 0 },
  staff: { wa: 3.0, wb: 0 },
  hammer: { wa: 2.65, wb: 0 },
};

/** Weapon orientation during an attack: from the rest angle into the windup, through the strike, and back. */
export function weaponAngles(out: Pose, anim: string, phase: 'startup' | 'active' | 'recovery', p: number, rest: { wa: number; wb: number }): void {
  const a = WEAPON_ANGLES[anim];
  if (!a) { out.wa = rest.wa; out.wb = rest.wb; return; }
  const wU = a.windup.wa, sU = a.strike.wa;
  const wB = a.windup.wb ?? rest.wb, sB = a.strike.wb ?? rest.wb;
  const lerp = (x: number, y: number, k: number): number => x + (y - x) * k;
  if (phase === 'startup') { const k = easeOut(clamp01(p)); out.wa = lerp(rest.wa, wU, k); out.wb = lerp(rest.wb, wB, k); }
  else if (phase === 'active') { const k = easeOut(clamp01(p * 3)); out.wa = lerp(wU, sU, k); out.wb = lerp(wB, sB, k); }
  else { const k = easeInOut(clamp01(p)); out.wa = lerp(sU, rest.wa, k); out.wb = lerp(sB, rest.wb, k); }
}

/** The dagger special: a low, fast lean with both blades thrust forward. */
export function poseFlurry(out: Pose, t: number): Pose {
  const j = Math.sin(t * 70) * 0.18;
  return Object.assign(out, makePose({
    lean: 1.0, head: -0.25, aU: 1.5 + j, aL: 1.57, bU: 1.45 - j, bL: 1.55,
    fU: 1.0, fL: 0.5, gU: -1.3, gL: -1.7, sx: 1.14, sy: 0.9, drop: 10, wa: 1.57, wb: 1.5,
  }));
}
