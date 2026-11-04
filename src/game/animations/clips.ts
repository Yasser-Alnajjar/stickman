import { clamp01, copyPose, easeIn, easeInOut, easeOut, lerpPose, makePose, STANCE, type Pose } from './pose';

/* ----------------------------------------------------------------------------
 * Locomotion & reaction poses. Every function writes into `out`.
 * -------------------------------------------------------------------------- */

export function poseIdle(out: Pose, t: number): Pose {
  const b = Math.sin(t * 2.2);
  return Object.assign(out, makePose({
    lean: 0.07 + b * 0.015, head: b * 0.03,
    aU: 0.45 + b * 0.05, aL: 1.85 + b * 0.06, bU: 0.18, bL: 1.65 - b * 0.05,
    fU: 0.36 + b * 0.02, fL: 0.04, gU: -0.3 - b * 0.02, gL: -0.58,
    sy: 1 + b * 0.006,
  }));
}

function leg(phase: number, amp: number, bend: number): [number, number] {
  const thigh = Math.sin(phase) * amp;
  const lift = Math.max(0, Math.cos(phase));
  return [thigh, thigh - 0.12 - lift * bend];
}

/** Walk/run cycle; `amp` 0.5..1.1 controls stride, `phase` in radians. */
export function poseMove(out: Pose, phase: number, amp: number, run: number): Pose {
  const [fU, fL] = leg(phase, amp, 0.8 + run * 0.9);
  const [gU, gL] = leg(phase + Math.PI, amp, 0.8 + run * 0.9);
  const swing = Math.sin(phase) * (0.55 + run * 0.4);
  const bob = Math.abs(Math.sin(phase)) * 0.03;
  return Object.assign(out, makePose({
    lean: 0.06 + run * 0.28 + bob,
    head: -run * 0.12,
    aU: -swing * (1 + run * 0.4), aL: -swing * (1 + run * 0.4) + 0.5 + run * 0.9,
    bU: swing * (1 + run * 0.4), bL: swing * (1 + run * 0.4) + 0.5 + run * 0.9,
    fU, fL, gU, gL,
    sy: 1 + Math.cos(phase * 2) * 0.012,
  }));
}

export function poseJump(out: Pose, vy: number): Pose {
  const k = clamp01((-vy) / 800);
  return Object.assign(out, makePose({
    lean: 0.12 - k * 0.04, aU: 2.5, aL: 2.9, bU: 1.8, bL: 2.4,
    fU: 1.1 + k * 0.2, fL: 0.25, gU: -0.15, gL: -1.05 - k * 0.2,
    sy: 1 + k * 0.08, sx: 1 - k * 0.04,
  }));
}

export function poseFall(out: Pose, vy: number): Pose {
  const k = clamp01(vy / 900);
  return Object.assign(out, makePose({
    lean: 0.05, aU: 1.3 + k * 0.6, aL: 1.6 + k * 0.8, bU: -0.9 - k * 0.3, bL: -0.4,
    fU: 0.55, fL: 0.1, gU: -0.55, gL: -0.9,
    sy: 1 + k * 0.1, sx: 1 - k * 0.05,
  }));
}

export function poseLand(out: Pose, p: number): Pose {
  const c = Math.sin(clamp01(p) * Math.PI);
  return Object.assign(out, makePose({
    lean: 0.35 * c, aU: 0.9, aL: 1.5, bU: 0.5, bL: 1.3,
    fU: 0.9 * c + 0.1, fL: -0.3 * c, gU: -0.6 * c, gL: -1.3 * c,
    sx: 1 + 0.16 * c, sy: 1 - 0.16 * c,
  }));
}

export function poseBlock(out: Pose, t: number): Pose {
  const b = Math.sin(t * 9) * 0.01;
  return Object.assign(out, makePose({
    lean: -0.05, head: 0.1, aU: 0.7 + b, aL: 2.35, bU: 0.9, bL: 2.5,
    fU: 0.65, fL: 0.1, gU: -0.5, gL: -0.9, sy: 0.97,
  }));
}

export function poseHurt(out: Pose, p: number): Pose {
  const k = 1 - easeOut(clamp01(p));
  return Object.assign(out, makePose({
    lean: -0.45 * k - 0.1, head: -0.35 * k, aU: -0.9 * k + 0.2, aL: -0.5 * k + 0.6, bU: -1.2 * k, bL: -0.8 * k,
    fU: 0.3, fL: -0.1, gU: -0.55 * k - 0.2, gL: -0.9 * k - 0.3, shift: -6 * k, sy: 0.97,
  }));
}

/** Death: stagger, topple backwards and lie flat. p: 0..1 */
export function poseDead(out: Pose, p: number): Pose {
  const fall = easeIn(clamp01(p / 0.8));
  const settle = clamp01((p - 0.8) / 0.2);
  return Object.assign(out, makePose({
    lean: -0.2 - fall * 0.2, head: -0.2, aU: -1 + fall * 0.4, aL: -0.4 - fall, bU: -1.3, bL: -0.6 - fall * 0.6,
    fU: 0.5 + fall * 0.3, fL: 0.2 + fall * 0.3, gU: -0.4, gL: -0.9 + fall * 0.2,
    rot: -fall * (Math.PI / 2) * 1.0,
    drop: fall * 30 + settle * 4, shift: -fall * 14,
  }));
}

/** dir: +1 rolling forward, -1 rolling backward (relative to facing). */
export function poseDodge(out: Pose, p: number, dir: number): Pose {
  const a = easeOut(clamp01(p));
  return Object.assign(out, makePose({
    lean: 0.9, head: 0.4, aU: 0.4, aL: 1.9, bU: 0.2, bL: 1.7,
    fU: 1.7, fL: 0.6, gU: 1.3, gL: 0.2,
    rot: a * Math.PI * 2 * dir, drop: 24, sy: 0.9,
  }));
}

export function poseDash(out: Pose, _t: number): Pose {
  return Object.assign(out, makePose({
    lean: 0.75, head: -0.2, aU: -1.0, aL: -0.7, bU: -1.4, bL: -1.0,
    fU: 1.2, fL: 0.9, gU: -1.2, gL: -1.6, sx: 1.12, sy: 0.92,
  }));
}

export function poseLightning(out: Pose, t: number): Pose {
  const j = Math.sin(t * 90) * 0.06;
  return Object.assign(out, makePose({
    lean: 1.35 + j, head: -0.3, aU: 1.4, aL: 1.5, bU: -1.5, bL: -1.3,
    fU: 0.6, fL: 0.3, gU: -1.5, gL: -1.9, sx: 1.2, sy: 0.85, drop: 14,
  }));
}

export function poseStun(out: Pose, t: number): Pose {
  const w = Math.sin(t * 10);
  return Object.assign(out, makePose({
    lean: -0.1 + w * 0.12, head: w * 0.4, aU: -0.2, aL: 0.2, bU: -0.4, bL: 0.1,
    fU: 0.15, fL: 0.05, gU: -0.2, gL: -0.3,
  }));
}

export function posePointing(out: Pose, t: number): Pose {
  const b = Math.sin(t * 2);
  return Object.assign(out, poseIdle(out, t), { aU: 1.5, aL: 1.6 + b * 0.04 });
}

/* ----------------------------------------------------------------------------
 * Attack animations: a windup (anticipation) pose and a strike (impact) pose.
 * The sampler is driven by the attack's own startup/active/recovery timings so
 * the visuals are always synchronised with the hitbox.
 * -------------------------------------------------------------------------- */

interface AttackAnim { windup: Pose; strike: Pose }
const mk = (windup: Partial<Pose>, strike: Partial<Pose>): AttackAnim => ({
  windup: makePose({ ...STANCE, ...windup }),
  strike: makePose({ ...STANCE, ...strike }),
});

export const ATTACK_ANIMS: Record<string, AttackAnim> = {
  punch1: mk(
    { lean: -0.12, aU: -0.5, aL: 1.9, bU: 0.4, bL: 2.0, fU: 0.5, fL: 0.1 },
    { lean: 0.32, aU: 1.52, aL: 1.57, bU: 0.1, bL: 2.0, fU: 0.85, fL: 0.2, gU: -0.55, gL: -0.75, shift: 8 },
  ),
  punch2: mk(
    { lean: -0.05, aU: 0.4, aL: 2.0, bU: -0.7, bL: 1.5, fU: 0.5, fL: 0.1, gU: -0.5, gL: -0.9 },
    { lean: 0.42, aU: 0.3, aL: 2.0, bU: 1.5, bL: 1.58, fU: 0.5, fL: 0.1, gU: -0.7, gL: -0.9, shift: 10, head: 0.05 },
  ),
  kick: mk(
    { lean: -0.2, fU: -0.3, fL: -1.3, gU: 0.1, gL: 0, aU: 1.0, aL: 1.9, bU: -0.6, bL: -0.2 },
    { lean: -0.4, fU: 1.45, fL: 1.58, gU: 0.05, gL: 0, aU: 1.1, aL: 1.6, bU: -1.0, bL: -0.5, shift: 4 },
  ),
  roundhouse: mk(
    { lean: -0.3, fU: -0.6, fL: -1.6, gU: 0.1, gL: 0.05, aU: 1.4, aL: 1.9, bU: -1.1, bL: -0.7, drop: 4 },
    { lean: -0.55, fU: 1.55, fL: 1.5, gU: 0.1, gL: 0.05, aU: 1.5, aL: 1.8, bU: -1.4, bL: -1.0, rot: 0.12, shift: 6 },
  ),
  heavy: mk(
    { lean: -0.5, aU: 0.5, aL: 1.6, bU: -1.7, bL: -1.3, fU: 0.5, fL: 0.35, gU: -0.55, gL: -1.0, drop: 8 },
    { lean: 0.6, aU: 0.2, aL: 1.9, bU: 1.45, bL: 1.55, fU: 1.0, fL: 0.4, gU: -0.85, gL: -0.9, shift: 14, head: 0.08 },
  ),
  dash_attack: mk(
    { lean: 0.5, aU: -0.8, aL: 0.5, bU: 0.3, bL: 1.9, fU: 1.0, fL: 0.5, gU: -1.0, gL: -1.4 },
    { lean: 0.8, aU: 1.55, aL: 1.57, bU: -0.8, bL: -0.7, fU: 1.2, fL: 0.7, gU: -1.2, gL: -1.5, shift: 14, sx: 1.1, sy: 0.94 },
  ),
  uppercut: mk(
    { lean: -0.3, aU: -0.3, aL: -0.1, bU: 0.4, bL: 1.8, fU: 0.9, fL: 0.7, gU: -0.7, gL: -1.2, drop: 14 },
    { lean: 0.28, aU: 2.55, aL: 2.75, bU: -0.6, bL: -0.4, fU: 0.5, fL: 0.1, gU: -0.3, gL: -0.4, shift: 10, sy: 1.08, drop: 0 },
  ),
  slam: mk(
    { lean: -0.45, aU: 2.9, aL: 3.0, bU: 2.7, bL: 3.0, fU: 0.3, fL: 0.1, gU: -0.4, gL: -0.6, sy: 1.04 },
    { lean: 0.75, aU: 0.8, aL: 0.5, bU: 0.9, bL: 0.6, fU: 0.9, fL: 0.3, gU: -0.8, gL: -1.0, drop: 12, sy: 0.94, shift: 10 },
  ),
  boss_charge: mk(
    { lean: 0.9 },
    { lean: 1.0, aU: 1.3, aL: 1.5, bU: 1.2, bL: 1.4, fU: 1.25, fL: 0.6, gU: -1.2, gL: -1.7, drop: 10 },
  ),
  lightning: mk({}, {}),
};

const tmp = makePose();

/** Samples an attack animation. `phase`: startup/active/recovery, `p`: 0..1 progress within the phase. */
export function poseAttack(out: Pose, anim: string, phase: 'startup' | 'active' | 'recovery', p: number): Pose {
  const a = ATTACK_ANIMS[anim] ?? ATTACK_ANIMS.punch1;
  if (phase === 'startup') return lerpPose(out, STANCE, a.windup, easeOut(clamp01(p)));
  if (phase === 'active') return lerpPose(out, a.windup, a.strike, easeOut(clamp01(p * 3)));
  return lerpPose(out, a.strike, copyPose(tmp, STANCE), easeInOut(clamp01(p)));
}
