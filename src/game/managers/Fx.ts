import Phaser from 'phaser';
import { DEPTH } from '@/shared/constants';

/** Short ribbon that follows a moving point (fist, foot, dash). Decays when not fed. */
export class Trail {
  private readonly pts: Float32Array;
  private count = 0;
  private fed = false;
  constructor(readonly color: number, readonly width: number, private readonly capacity = 9) {
    this.pts = new Float32Array(capacity * 2);
  }
  push(x: number, y: number): void {
    if (this.count < this.capacity) this.count++;
    else this.pts.copyWithin(0, 2);
    const i = (this.count - 1) * 2;
    this.pts[i] = x; this.pts[i + 1] = y;
    this.fed = true;
  }
  /** Called once per frame by Fx. */
  step(g: Phaser.GameObjects.Graphics): void {
    if (!this.fed && this.count > 0) {
      this.pts.copyWithin(0, 2);
      this.count--;
      if (this.count > 0) this.pts[this.count * 2] = this.pts[this.count * 2 - 2];
    }
    this.fed = false;
    for (let i = 1; i < this.count; i++) {
      const t = i / this.count;
      g.lineStyle(this.width * t, this.color, t * 0.85);
      g.lineBetween(this.pts[(i - 1) * 2], this.pts[(i - 1) * 2 + 1], this.pts[i * 2], this.pts[i * 2 + 1]);
    }
  }
  clear(): void {
    this.count = 0;
  }
}

interface Bolt { x1: number; y1: number; x2: number; y2: number; color: number; life: number; max: number; seed: number }
interface Ring { x: number; y: number; color: number; r0: number; r1: number; life: number; max: number; w: number }
interface Warn { rect: Phaser.Geom.Rectangle; life: number; max: number; color: number }

/** Particles, floating text, trails, bolts and rings. All pooled; nothing is created per hit. */
export class Fx {
  private readonly scene: Phaser.Scene;
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly fire: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly bolts: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly debris: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly trails = new Set<Trail>();
  private readonly boltList: Bolt[] = [];
  private readonly ringList: Ring[] = [];
  private readonly warnList: Warn[] = [];
  private readonly texts: Phaser.GameObjects.Text[] = [];
  private shakeEnabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const d = DEPTH.fx;
    this.sparks = scene.add.particles(0, 0, 'fx_spark', {
      emitting: false, lifespan: { min: 180, max: 380 }, speed: { min: 160, max: 520 }, scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 }, blendMode: 'ADD', rotate: { min: 0, max: 360 },
    }).setDepth(d);
    this.fire = scene.add.particles(0, 0, 'fx_glow', {
      emitting: false, lifespan: { min: 300, max: 650 }, speed: { min: 30, max: 220 }, scale: { start: 0.55, end: 0 },
      alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', gravityY: -260, color: [0xffe27a, 0xff9a2a, 0xe0361a], colorEase: 'quad.out',
    }).setDepth(d);
    this.bolts = scene.add.particles(0, 0, 'fx_spark', {
      emitting: false, lifespan: { min: 150, max: 320 }, speed: { min: 80, max: 420 }, scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 }, blendMode: 'ADD', tint: [0x5cf0ff, 0xc9fbff, 0x8fa8ff],
    }).setDepth(d);
    this.dust = scene.add.particles(0, 0, 'fx_glow', {
      emitting: false, lifespan: { min: 300, max: 600 }, speed: { min: 20, max: 120 }, scale: { start: 0.35, end: 0.7 },
      alpha: { start: 0.35, end: 0 }, tint: 0xb9bfd8, gravityY: -40, angle: { min: 190, max: 350 },
    }).setDepth(d - 1);
    this.debris = scene.add.particles(0, 0, 'fx_px', {
      emitting: false, lifespan: { min: 350, max: 800 }, speed: { min: 120, max: 480 }, scale: { start: 1.6, end: 0.4 },
      alpha: { start: 1, end: 0 }, gravityY: 1300, angle: { min: 200, max: 340 }, tint: [0xffffff, 0xcfd6ff],
    }).setDepth(d);
    this.g = scene.add.graphics().setDepth(d + 1);
    for (let i = 0; i < 24; i++) {
      const t = scene.add.text(0, 0, '', { fontFamily: 'system-ui, sans-serif', fontSize: '22px', fontStyle: '800', color: '#fff', stroke: '#000', strokeThickness: 4 })
        .setOrigin(0.5).setDepth(d + 5).setVisible(false);
      t.setData('life', 0);
      this.texts.push(t);
    }
  }

  setShake(enabled: boolean): void {
    this.shakeEnabled = enabled;
  }

  shake(intensity: number, ms = 120): void {
    if (!this.shakeEnabled || intensity <= 0) return;
    this.scene.cameras.main.shake(ms, intensity);
  }

  createTrail(color: number, width: number, capacity?: number): Trail {
    const t = new Trail(color, width, capacity);
    this.trails.add(t);
    return t;
  }
  removeTrail(t: Trail): void {
    this.trails.delete(t);
  }

  hitSparks(x: number, y: number, dir: number, count = 8, big = false): void {
    this.sparks.setParticleTint(big ? 0xfff1b0 : 0xffffff);
    this.sparks.emitParticleAt(x, y, count);
    if (big) this.ring(x, y, 0xfff1b0, 8, 70, 160);
    void dir;
  }

  fireBurst(x: number, y: number, count = 18): void {
    this.fire.emitParticleAt(x, y, count);
  }
  fireTick(x: number, y: number): void {
    this.fire.emitParticleAt(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8, 1);
  }
  boltBurst(x: number, y: number, count = 10): void {
    this.bolts.emitParticleAt(x, y, count);
  }
  dustPuff(x: number, y: number, count = 4): void {
    this.dust.emitParticleAt(x, y, count);
  }
  debrisBurst(x: number, y: number, count = 10): void {
    this.debris.emitParticleAt(x, y, count);
  }

  ring(x: number, y: number, color: number, r0: number, r1: number, ms: number, w = 4): void {
    this.ringList.push({ x, y, color, r0, r1, life: ms, max: ms, w });
  }

  bolt(x1: number, y1: number, x2: number, y2: number, color = 0x5cf0ff, ms = 220): void {
    this.boltList.push({ x1, y1, x2, y2, color, life: ms, max: ms, seed: Math.random() * 1000 });
  }

  /** Red danger zone telegraph that fills over `ms`. */
  warn(rect: Phaser.Geom.Rectangle, ms: number, color = 0xff2a2a): void {
    this.warnList.push({ rect: Phaser.Geom.Rectangle.Clone(rect), life: ms, max: ms, color });
  }

  text(x: number, y: number, str: string, color = '#ffffff', size = 22, ms = 700): void {
    const t = this.texts.find((tx) => !tx.visible) ?? this.texts[0];
    t.setText(str).setPosition(x, y).setColor(color).setFontSize(size).setVisible(true).setAlpha(1).setScale(0.6);
    t.setData('life', ms).setData('max', ms).setData('x0', x).setData('y0', y);
  }

  update(dt: number): void {
    const g = this.g;
    g.clear();
    for (const t of this.trails) t.step(g);

    for (let i = this.boltList.length - 1; i >= 0; i--) {
      const b = this.boltList[i];
      b.life -= dt;
      if (b.life <= 0) { this.boltList.splice(i, 1); continue; }
      const a = b.life / b.max;
      const segs = 9, dx = b.x2 - b.x1, dy = b.y2 - b.y1, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      for (let pass = 0; pass < 2; pass++) {
        g.lineStyle(pass === 0 ? 7 : 2.5, pass === 0 ? b.color : 0xffffff, a * (pass === 0 ? 0.5 : 1));
        g.beginPath();
        g.moveTo(b.x1, b.y1);
        for (let s = 1; s < segs; s++) {
          const t = s / segs;
          const j = (Math.sin(b.seed + s * 12.9898 + Math.floor(b.life / 40) * 4.1) * 22) * (1 - Math.abs(0.5 - t) * 1.2);
          g.lineTo(b.x1 + dx * t + nx * j, b.y1 + dy * t + ny * j);
        }
        g.lineTo(b.x2, b.y2);
        g.strokePath();
      }
    }

    for (let i = this.ringList.length - 1; i >= 0; i--) {
      const r = this.ringList[i];
      r.life -= dt;
      if (r.life <= 0) { this.ringList.splice(i, 1); continue; }
      const k = 1 - r.life / r.max;
      g.lineStyle(r.w * (1 - k) + 1, r.color, 1 - k);
      g.strokeCircle(r.x, r.y, r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - k, 3)));
    }

    for (let i = this.warnList.length - 1; i >= 0; i--) {
      const w = this.warnList[i];
      w.life -= dt;
      if (w.life <= 0) { this.warnList.splice(i, 1); continue; }
      const k = 1 - w.life / w.max;
      const flick = 0.5 + 0.5 * Math.sin(k * 30);
      g.fillStyle(w.color, 0.1 + 0.35 * k * flick);
      g.fillRect(w.rect.x, w.rect.y, w.rect.width, w.rect.height);
      g.fillStyle(w.color, 0.55);
      g.fillRect(w.rect.x, w.rect.y, w.rect.width * k, 4);
      g.lineStyle(2, w.color, 0.6);
      g.strokeRect(w.rect.x, w.rect.y, w.rect.width, w.rect.height);
    }

    for (const t of this.texts) {
      if (!t.visible) continue;
      const life = (t.getData('life') as number) - dt;
      if (life <= 0) { t.setVisible(false); continue; }
      t.setData('life', life);
      const max = t.getData('max') as number;
      const k = 1 - life / max;
      t.y = (t.getData('y0') as number) - 70 * (1 - Math.pow(1 - k, 2));
      t.setScale(k < 0.15 ? 0.6 + k * 4 : 1).setAlpha(k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1);
    }
  }

  destroy(): void {
    this.trails.clear();
    [this.sparks, this.fire, this.bolts, this.dust, this.debris, this.g, ...this.texts].forEach((o) => o.destroy());
  }
}

/** Generates the tiny shared textures used by particles. */
export function generateFxTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('fx_glow')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
  g.generateTexture('fx_px', 4, 4);
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.beginPath(); g.moveTo(8, 0); g.lineTo(11, 8); g.lineTo(8, 16); g.lineTo(5, 8); g.closePath(); g.fillPath();
  g.generateTexture('fx_spark', 16, 16);
  g.destroy();
  const tex = scene.textures.createCanvas('fx_glow', 64, 64);
  if (tex) {
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    tex.refresh();
  }
}
