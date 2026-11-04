/**
 * Pose model for the procedural stickman skeleton.
 *
 * All limb angles are absolute, measured from "straight down", positive toward the facing direction.
 *   0 = hanging down, PI/2 = pointing forward horizontally, PI = straight up, negative = backwards.
 * Arm "a" is the lead arm, "b" the rear arm. Leg "f" is the front leg, "g" the back leg.
 */
export interface Pose {
  lean: number;   // torso lean (rad), positive = forward
  head: number;   // head tilt relative to torso
  aU: number; aL: number;
  bU: number; bL: number;
  fU: number; fL: number;
  gU: number; gL: number;
  rot: number;    // whole-body rotation around the hip (rad)
  drop: number;   // vertical offset (px, positive = down)
  sx: number; sy: number; // squash & stretch around the feet
  shift: number;  // forward body offset (px)
}

export const makePose = (o: Partial<Pose> = {}): Pose => ({
  lean: 0, head: 0, aU: 0, aL: 0, bU: 0, bL: 0, fU: 0, fL: 0, gU: 0, gL: 0,
  rot: 0, drop: 0, sx: 1, sy: 1, shift: 0, ...o,
});

export const POSE_KEYS = Object.keys(makePose()) as (keyof Pose)[];

export function copyPose(out: Pose, src: Pose): Pose {
  for (const k of POSE_KEYS) out[k] = src[k];
  return out;
}

export function lerpPose(out: Pose, a: Pose, b: Pose, t: number): Pose {
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

export const easeOut = (t: number): number => 1 - (1 - t) * (1 - t) * (1 - t);
export const easeIn = (t: number): number => t * t * t;
export const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Fighting stance used as the base for attacks. */
export const STANCE = makePose({
  lean: 0.08, aU: 0.5, aL: 1.9, bU: 0.2, bL: 1.7, fU: 0.42, fL: 0.05, gU: -0.34, gL: -0.62,
});
