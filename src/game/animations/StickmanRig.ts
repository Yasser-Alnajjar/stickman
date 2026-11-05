import Phaser from 'phaser';
import { copyPose, lerpPose, makePose, type Pose } from './pose';
import { A_EL, A_HA, B_EL, B_HA, F_FO, F_KN, G_FO, G_KN, HEAD, HIP, SHO, accessoryOf, tint, type AccessoryCtx } from './accessories';
import type { WeaponPainter } from './weapon-art';

export interface RigStyle {
  color: number;
  lineWidth: number;
  scale: number;
  accessory: string;
  accent: number;
  headRadius: number;
}

export interface RigPoint { x: number; y: number }

const LEN = { thigh: 19, shin: 19, torso: 28, neck: 4, upper: 15, fore: 15 };

const N_JOINTS = 11;

/**
 * Procedural skeletal stickman. One Graphics object redrawn per frame from a Pose.
 * Pose blending, grounding (feet always touch the floor), squash/stretch and accessories live here.
 */
export class StickmanRig {
  readonly g: Phaser.GameObjects.Graphics;
  private readonly cur: Pose = makePose();
  private readonly xs = new Float32Array(N_JOINTS);
  private readonly ys = new Float32Array(N_JOINTS);
  private flashMs = 0;
  private tintColor: number | null = null;
  private time = 0;
  private initialised = false;
  alpha = 1;
  /** Horizontal velocity hint for trailing accessories. */
  velX = 0;
  /** Extra emissive colour overlay (e.g. fire fist or telegraph). */
  glow: { color: number; amount: number } | null = null;
  private scaleMul = 1;
  /** Held weapon (the player's equipped weapon); null for unarmed fighters. */
  weapon: WeaponPainter | null = null;
  /** 0..1 emphasis for weapon glow while swinging. */
  swing = 0;
  private readonly wTip = { x: 0, y: 0 };
  private wAng = 0;
  private wAngB = 0;

  constructor(scene: Phaser.Scene, readonly style: RigStyle, depth: number) {
    this.g = scene.add.graphics().setDepth(depth);
  }

  setScaleMul(m: number): void {
    this.scaleMul = m;
  }

  flash(ms: number, color: number | null = 0xffffff): void {
    this.flashMs = ms;
    this.tintColor = color;
  }

  setTint(color: number | null): void {
    this.tintColor = color;
  }

  setVisible(v: boolean): void {
    this.g.setVisible(v);
  }

  /** World position of a joint from the last draw. */
  hand(which: 'a' | 'b', out: RigPoint): RigPoint {
    const i = which === 'a' ? A_HA : B_HA;
    out.x = this.xs[i]; out.y = this.ys[i];
    return out;
  }
  foot(which: 'f' | 'g', out: RigPoint): RigPoint {
    const i = which === 'f' ? F_FO : G_FO;
    out.x = this.xs[i]; out.y = this.ys[i];
    return out;
  }
  /** World position of the weapon's business end from the last draw. */
  weaponTip(out: RigPoint): RigPoint {
    out.x = this.wTip.x; out.y = this.wTip.y;
    return out;
  }
  head(out: RigPoint): RigPoint {
    out.x = this.xs[HEAD]; out.y = this.ys[HEAD];
    return out;
  }
  centre(out: RigPoint): RigPoint {
    out.x = this.xs[SHO]; out.y = (this.ys[SHO] + this.ys[HIP]) / 2;
    return out;
  }

  /**
   * @param target pose to blend toward
   * @param rate   blend speed (1/s). Use a large value (>=40) to follow a time-sampled pose exactly.
   */
  draw(x: number, feetY: number, facing: 1 | -1, target: Pose, rate: number, dt: number): void {
    const dts = dt / 1000;
    this.time += dts;
    if (this.flashMs > 0) this.flashMs -= dt;
    if (!this.initialised) {
      copyPose(this.cur, target);
      this.initialised = true;
    } else {
      const k = 1 - Math.exp(-rate * dts);
      lerpPose(this.cur, this.cur, target, k);
    }
    const p = this.cur;
    const s = this.style.scale * this.scaleMul;
    const F = facing;
    const { thigh, shin, torso, neck, upper, fore } = LEN;
    const xs = this.xs, ys = this.ys;

    // legs relative to hip
    const fKx = Math.sin(p.fU) * thigh * F, fKy = Math.cos(p.fU) * thigh;
    const fFx = fKx + Math.sin(p.fL) * shin * F, fFy = fKy + Math.cos(p.fL) * shin;
    const gKx = Math.sin(p.gU) * thigh * F, gKy = Math.cos(p.gU) * thigh;
    const gFx = gKx + Math.sin(p.gL) * shin * F, gFy = gKy + Math.cos(p.gL) * shin;
    const extent = Math.max(fFy, gFy);

    const hx = x + p.shift * F * s;
    const hy = feetY - extent * s;
    xs[HIP] = hx; ys[HIP] = hy;
    xs[F_KN] = hx + fKx * s; ys[F_KN] = hy + fKy * s;
    xs[F_FO] = hx + fFx * s; ys[F_FO] = hy + fFy * s;
    xs[G_KN] = hx + gKx * s; ys[G_KN] = hy + gKy * s;
    xs[G_FO] = hx + gFx * s; ys[G_FO] = hy + gFy * s;

    xs[SHO] = hx + Math.sin(p.lean) * torso * F * s;
    ys[SHO] = hy - Math.cos(p.lean) * torso * s;
    const ha = p.lean + p.head;
    const hr = this.style.headRadius * s;
    xs[HEAD] = xs[SHO] + Math.sin(ha) * (neck * s + hr) * F;
    ys[HEAD] = ys[SHO] - Math.cos(ha) * (neck * s + hr);

    xs[A_EL] = xs[SHO] + Math.sin(p.aU) * upper * F * s; ys[A_EL] = ys[SHO] + Math.cos(p.aU) * upper * s;
    xs[A_HA] = xs[A_EL] + Math.sin(p.aL) * fore * F * s; ys[A_HA] = ys[A_EL] + Math.cos(p.aL) * fore * s;
    xs[B_EL] = xs[SHO] + Math.sin(p.bU) * upper * F * s; ys[B_EL] = ys[SHO] + Math.cos(p.bU) * upper * s;
    xs[B_HA] = xs[B_EL] + Math.sin(p.bL) * fore * F * s; ys[B_HA] = ys[B_EL] + Math.cos(p.bL) * fore * s;

    // whole-body transforms: rotation about the body centre, squash/stretch about the feet, drop
    const cx = hx, cy = hy - 12 * s;
    const sn = Math.sin(p.rot * F), cs = Math.cos(p.rot * F);
    const needRot = p.rot !== 0;
    for (let i = 0; i < N_JOINTS; i++) {
      if (needRot) {
        const dx = xs[i] - cx, dy = ys[i] - cy;
        xs[i] = cx + dx * cs - dy * sn;
        ys[i] = cy + dx * sn + dy * cs;
      }
      xs[i] = x + (xs[i] - x) * p.sx;
      ys[i] = feetY + (ys[i] - feetY) * p.sy + p.drop * s;
    }

    if (this.weapon) this.placeWeapon(F, s, p);
    this.render(F, s, hr);
  }

  /** Orients the held weapon from the pose (absolute angles, rotated with the body) and re-grips the rear hand. */
  private placeWeapon(F: 1 | -1, s: number, p: Pose): void {
    const w = this.weapon!;
    const xs = this.xs, ys = this.ys;
    const dirOf = (a: number): number => {
      const vx = Math.sin(a) * F, vy = Math.cos(a);
      const r = p.rot * F;
      return Math.atan2(vx * Math.sin(r) + vy * Math.cos(r), vx * Math.cos(r) - vy * Math.sin(r));
    };
    this.wAng = dirOf(p.wa);
    this.wAngB = dirOf(p.wb);
    if (w.twoHanded) {
      // rear hand grips the shaft behind the front hand; clamp so the arm never overstretches
      const gx = xs[A_HA] - Math.cos(this.wAng) * w.grip * s, gy = ys[A_HA] - Math.sin(this.wAng) * w.grip * s;
      const reach = (LEN.upper + LEN.fore) * s * 0.98;
      let dx = gx - xs[SHO], dy = gy - ys[SHO];
      const d = Math.hypot(dx, dy);
      if (d > reach) { dx = (dx / d) * reach; dy = (dy / d) * reach; }
      xs[B_HA] = xs[SHO] + dx; ys[B_HA] = ys[SHO] + dy;
      xs[B_EL] = xs[SHO] + dx * 0.5; ys[B_EL] = ys[SHO] + dy * 0.5 + 5 * s;
    }
    this.wTip.x = xs[A_HA] + Math.cos(this.wAng) * w.reach * s;
    this.wTip.y = ys[A_HA] + Math.sin(this.wAng) * w.reach * s;
  }

  private render(F: 1 | -1, s: number, hr: number): void {
    const g = this.g;
    const xs = this.xs, ys = this.ys;
    g.clear();
    if (this.alpha <= 0.01) return;
    const flashing = this.flashMs > 0;
    let col = flashing ? (this.tintColor ?? 0xffffff) : this.style.color;
    if (!flashing && this.tintColor !== null) col = this.tintColor;
    const back = tint(col, 0.62);
    const lw = this.style.lineWidth * Math.max(0.8, s);
    const a = this.alpha;
    const def = accessoryOf(this.style.accessory);
    const w = Math.sin(this.time * 9);
    const actx: AccessoryCtx = {
      g, xs, ys, F, s, a, hr, col, accent: this.style.accent, lineWidth: this.style.lineWidth, time: this.time,
      stream: Math.min(1, Math.abs(this.velX) / 300), w,
    };

    // Cape / scarf trail behind the body
    def.back?.(actx);

    const limb = (i: number, j: number, c: number, w = lw): void => {
      g.lineStyle(w, c, a);
      g.lineBetween(xs[i], ys[i], xs[j], ys[j]);
    };
    const joint = (i: number, c: number, w = lw): void => {
      g.fillStyle(c, a);
      g.fillCircle(xs[i], ys[i], w / 2);
    };

    // back limbs
    limb(HIP, G_KN, back); limb(G_KN, G_FO, back); joint(G_KN, back); joint(G_FO, back);
    limb(SHO, B_EL, back); limb(B_EL, B_HA, back); joint(B_EL, back); joint(B_HA, back, lw * 1.25);

    // torso
    def.beforeTorso?.(actx);
    limb(HIP, SHO, col, lw * (def.torsoMul ?? 1));
    joint(HIP, col);

    // front limbs
    limb(HIP, F_KN, col); limb(F_KN, F_FO, col); joint(F_KN, col); joint(F_FO, col);
    limb(SHO, A_EL, col); limb(A_EL, A_HA, col); joint(A_EL, col); joint(A_HA, col, lw * 1.25);

    // held weapon(s): the rear one first so the front weapon overlaps it
    const wp = this.weapon;
    if (wp) {
      const base = { g, F, s, alpha: a, time: this.time, swing: this.swing };
      if (wp.dual) wp.draw({ ...base, x: xs[B_HA], y: ys[B_HA], ang: this.wAngB });
      wp.draw({ ...base, x: xs[A_HA], y: ys[A_HA], ang: this.wAng });
    }

    // glow fist (fire punch / telegraph)
    if (this.glow && this.glow.amount > 0) {
      g.fillStyle(this.glow.color, 0.55 * this.glow.amount * a);
      g.fillCircle(xs[A_HA], ys[A_HA], 15 * s * this.glow.amount + 4);
      g.fillStyle(0xffffff, 0.7 * this.glow.amount * a);
      g.fillCircle(xs[A_HA], ys[A_HA], 6 * s);
    }

    // head
    g.fillStyle(col, a);
    g.fillCircle(xs[HEAD], ys[HEAD], hr);
    // eye
    g.fillStyle(def.eye ?? 0x10131f, a);
    g.fillCircle(xs[HEAD] + F * hr * 0.45, ys[HEAD] - hr * 0.12, Math.max(1.6, hr * 0.2));

    def.front?.(actx);
  }

  destroy(): void {
    this.g.destroy();
  }
}
