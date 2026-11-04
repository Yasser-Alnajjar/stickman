import Phaser from 'phaser';
import { copyPose, lerpPose, makePose, type Pose } from './pose';

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

// joint indices
const HIP = 0, SHO = 1, HEAD = 2, A_EL = 3, A_HA = 4, B_EL = 5, B_HA = 6, F_KN = 7, F_FO = 8, G_KN = 9, G_FO = 10;
const N_JOINTS = 11;

const tint = (c: number, k: number): number => {
  const r = Math.round(((c >> 16) & 255) * k), g = Math.round(((c >> 8) & 255) * k), b = Math.round((c & 255) * k);
  return (r << 16) | (g << 8) | b;
};

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

    this.render(F, s, hr);
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
    const acc = this.style.accessory;

    // Cape / scarf trail behind the body
    this.drawBackAccessories(g, F, s, a, acc);

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
    if (acc === 'brute') {
      g.fillStyle(tint(col, 0.8), a);
      g.fillEllipse((xs[HIP] + xs[SHO]) / 2, (ys[HIP] + ys[SHO]) / 2, lw * 2.6, Math.hypot(xs[SHO] - xs[HIP], ys[SHO] - ys[HIP]) + lw * 0.8);
    }
    limb(HIP, SHO, col, lw * (acc === 'brute' ? 1.25 : 1));
    joint(HIP, col);

    // front limbs
    limb(HIP, F_KN, col); limb(F_KN, F_FO, col); joint(F_KN, col); joint(F_FO, col);
    limb(SHO, A_EL, col); limb(A_EL, A_HA, col); joint(A_EL, col); joint(A_HA, col, lw * 1.25);

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
    g.fillStyle(acc === 'warden' ? 0xff2020 : acc === 'anchor' ? 0xffb454 : acc === 'crown' ? 0xfff2a0 : 0x10131f, a);
    g.fillCircle(xs[HEAD] + F * hr * 0.45, ys[HEAD] - hr * 0.12, Math.max(1.6, hr * 0.2));

    this.drawFrontAccessories(g, F, s, a, acc, hr, col);
  }

  private drawBackAccessories(g: Phaser.GameObjects.Graphics, F: 1 | -1, s: number, a: number, acc: string): void {
    const xs = this.xs, ys = this.ys;
    const w = Math.sin(this.time * 9);
    const stream = Math.min(1, Math.abs(this.velX) / 300);
    const { accent } = this.style;
    if (acc === 'scarf' || acc === 'hero' || acc === 'blade') {
      const len = (acc === 'hero' ? 26 : 22) * s;
      const nx = xs[SHO], ny = ys[SHO] - 2 * s;
      g.lineStyle(this.style.lineWidth * 0.8, accent, a);
      g.beginPath();
      g.moveTo(nx, ny);
      for (let i = 1; i <= 4; i++) {
        const t = i / 4;
        g.lineTo(nx - F * (len * t * (0.8 + stream * 0.9)), ny + Math.sin(this.time * 10 + i) * 3 * t + (1 - stream) * t * 12 * s + w * t);
      }
      g.strokePath();
    } else if (acc === 'headband') {
      const hx = xs[HEAD], hy = ys[HEAD];
      g.lineStyle(2.4, accent, a);
      g.lineBetween(hx - F * 5, hy - 2, hx - F * (16 + stream * 8), hy + 3 + w * 2);
      g.lineBetween(hx - F * 5, hy - 2, hx - F * (13 + stream * 8), hy - 3 - w * 2);
    } else if (acc === 'crown') {
      // flame train
      const sx0 = xs[SHO], sy0 = ys[SHO], hipx = xs[HIP], hipy = ys[HIP];
      g.fillStyle(0xd13a14, a);
      g.fillTriangle(sx0, sy0 - 2 * s, hipx - F * (34 + stream * 40) * s + w * 4, hipy + 30 * s, hipx, hipy + 4 * s);
      g.fillStyle(accent, a * 0.8);
      g.fillTriangle(sx0, sy0, hipx - F * (18 + stream * 26) * s + w * 3, hipy + 22 * s, hipx, hipy);
    } else if (acc === 'warden') {
      // heavy cape
      const sx0 = xs[SHO], sy0 = ys[SHO];
      const hipx = xs[HIP], hipy = ys[HIP];
      g.fillStyle(0x6b0f1a, a);
      g.beginPath();
      g.moveTo(sx0, sy0 - 2 * s);
      g.lineTo(sx0 - F * (14 + stream * 22) * s, sy0 + 8 * s);
      g.lineTo(hipx - F * (30 + stream * 36) * s + w * 3, hipy + 28 * s);
      g.lineTo(hipx - F * 8 * s, hipy + 34 * s);
      g.lineTo(hipx, hipy);
      g.closePath();
      g.fillPath();
    }
  }

  private drawFrontAccessories(g: Phaser.GameObjects.Graphics, F: 1 | -1, s: number, a: number, acc: string, hr: number, col: number): void {
    const xs = this.xs, ys = this.ys;
    const { accent } = this.style;
    const hx = xs[HEAD], hy = ys[HEAD];
    if (acc === 'hero') {
      g.lineStyle(2.6, accent, a);
      g.lineBetween(hx - F * hr, hy - hr * 0.25, hx + F * hr, hy - hr * 0.25);
    } else if (acc === 'headband') {
      g.lineStyle(2.6, accent, a);
      g.lineBetween(hx - F * hr, hy - hr * 0.35, hx + F * hr, hy - hr * 0.35);
    } else if (acc === 'brute') {
      g.fillStyle(tint(col, 0.55), a);
      g.fillCircle(xs[SHO], ys[SHO] + 2 * s, 7 * s);
      g.fillStyle(accent, a);
      g.fillRect(xs[HIP] - 8 * s, ys[HIP] - 4 * s, 16 * s, 4 * s); // belt
      g.fillStyle(tint(col, 0.55), a);
      g.fillRect(hx - hr, hy - hr, hr * 2, hr * 0.7); // brow plate
    } else if (acc === 'warden') {
      g.lineStyle(4, 0xd9d9e8, a);
      g.lineBetween(hx - hr * 0.6, hy - hr * 0.6, hx - hr * 1.1 - F * 2, hy - hr * 1.9);
      g.lineBetween(hx + hr * 0.6, hy - hr * 0.6, hx + hr * 1.1 + F * 2, hy - hr * 1.9);
      g.fillStyle(0x2a2f45, a);
      g.fillRect(hx - hr * 1.05, hy - hr * 1.05, hr * 2.1, hr * 1.0);
      g.fillStyle(0xff2020, a);
      g.fillRect(hx + F * hr * 0.1 - 1, hy - hr * 0.5, hr * 0.9, 3);
      g.fillStyle(0x3a4060, a);
      g.fillCircle(xs[SHO] - F * 2, ys[SHO] + 3 * s, 10 * s);
      g.fillCircle(xs[SHO] + F * 2, ys[SHO] + 3 * s, 8 * s);
      g.lineStyle(4, 0xb0b4d0, a);
      g.lineBetween(xs[HIP] - 10 * s, ys[HIP] - 2 * s, xs[HIP] + 10 * s, ys[HIP] - 2 * s);
    } else if (acc === 'hood') {
      g.fillStyle(tint(col, 0.55), a);
      g.fillTriangle(hx - hr * 1.15, hy + hr * 0.3, hx + hr * 1.15, hy + hr * 0.3, hx - F * hr * 0.35, hy - hr * 2.1);
    } else if (acc === 'shield') {
      const top = ys[SHO] - 2 * s, bot = ys[HIP] + 6 * s, sx = xs[SHO] + F * 13 * s;
      g.fillStyle(tint(col, 0.7), a).fillRect(sx - 9 * s, top, 18 * s, bot - top);
      g.lineStyle(3, accent, a).strokeRect(sx - 9 * s, top, 18 * s, bot - top);
      g.fillStyle(accent, a).fillRect(sx - 2, top + 4, 4, bot - top - 8);
      g.fillStyle(tint(col, 0.6), a).fillRect(hx - hr * 1.05, hy - hr * 1.05, hr * 2.1, hr * 0.8); // helm
    } else if (acc === 'blade') {
      g.lineStyle(3, 0xe6ecff, a);
      g.lineBetween(xs[A_HA], ys[A_HA], xs[A_HA] + F * 36 * s, ys[A_HA] - 26 * s);
      g.lineStyle(2, accent, a).lineBetween(hx - F * hr, hy - hr * 0.3, hx + F * hr, hy - hr * 0.3);
    } else if (acc === 'anchor') {
      const ax = xs[B_HA], ay = ys[B_HA];
      g.lineStyle(5, 0x8a97a8, a);
      g.lineBetween(ax, ay - 46 * s, ax, ay + 34 * s);
      g.lineBetween(ax - 16 * s, ay - 34 * s, ax + 16 * s, ay - 34 * s);
      g.lineBetween(ax - 18 * s, ay + 18 * s, ax, ay + 34 * s);
      g.lineBetween(ax + 18 * s, ay + 18 * s, ax, ay + 34 * s);
      g.fillStyle(accent, a).fillRect(hx - hr * 1.1, hy - hr * 1.5, hr * 2.2, hr * 0.7); // captain's hat
      g.fillStyle(tint(col, 0.55), a).fillCircle(xs[SHO], ys[SHO] + 3 * s, 9 * s);
    } else if (acc === 'crown') {
      g.fillStyle(accent, a);
      for (let i = -1; i <= 1; i++) g.fillTriangle(hx + i * hr * 0.7 - hr * 0.3, hy - hr * 0.9, hx + i * hr * 0.7 + hr * 0.3, hy - hr * 0.9, hx + i * hr * 0.7, hy - hr * (i === 0 ? 2.5 : 2));
      g.fillStyle(0xff7a2a, a * 0.9).fillCircle(xs[A_HA], ys[A_HA], 7 * s);
    } else if (acc === 'elder') {
      g.lineStyle(3, 0xffffff, a);
      g.lineBetween(hx + F * hr * 0.2, hy + hr * 0.7, hx + F * hr * 0.35, hy + hr * 1.9); // beard
      g.lineStyle(3, 0x8a6a3a, a);
      g.lineBetween(xs[B_HA], ys[B_HA] - 34 * s, xs[B_HA], ys[B_HA] + 38 * s); // cane
    } else if (acc === 'guard') {
      g.fillStyle(accent, a);
      g.fillRect(hx - hr * 1.05, hy - hr * 1.05, hr * 2.1, hr * 0.9);
      g.lineStyle(3, 0xcfd6ff, a);
      g.lineBetween(xs[B_HA] + F * 4, ys[B_HA] - 46 * s, xs[B_HA] + F * 4, ys[B_HA] + 30 * s); // spear
    }
  }

  destroy(): void {
    this.g.destroy();
  }
}
