import Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, vgrad } from '../../kit';
import { NEON, neonTheme } from './theme';

/**
 * WARDEN FOUNDRY HALL: the inside of a corporate war-machine plant under Neon Street.
 * Hex-panelled walls, a reactor core, assembly arms, server walls, hazard-marked combat floor, hover lifts.
 */

const alarm = { on: false, since: 0 };

type Ctx = CanvasRenderingContext2D;

function hallFar(c: Ctx, w: number, h: number): void {
  vgrad(c, 0, 0, w, h, [[0, '#06081c'], [1, '#101636']]);
  // hex-panel wall with faintly glowing seams
  c.strokeStyle = 'rgba(61,240,255,0.10)'; c.lineWidth = 2;
  const r = 38, dx = r * 1.73, dy = r * 1.5;
  for (let row = 0, y = 20; y < h + r; y += dy, row++) {
    for (let x = (row % 2) * dx / 2; x < w + dx; x += dx) {
      c.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; c.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); }
      c.closePath(); c.stroke();
    }
  }
  // observation slit with the neon city glowing outside
  const sx = 300, sw = 520, sy = 40, sh = 90;
  c.fillStyle = '#05061a'; c.fillRect(sx - 8, sy - 8, sw + 16, sh + 16);
  vgrad(c, sx, sy, sw, sh, [[0, '#1a1050'], [1, '#8a2a78']]);
  const rr = mulberry32(12);
  c.fillStyle = '#0a0c26';
  for (let x = sx; x < sx + sw; x += 18 + rr() * 14) { const bh = 20 + rr() * 60; c.fillRect(x, sy + sh - bh, 14 + rr() * 10, bh); }
  c.strokeStyle = 'rgba(61,240,255,0.7)'; c.lineWidth = 3; c.strokeRect(sx - 8, sy - 8, sw + 16, sh + 16);
  // huge sealed vault door
  const vx = 1400, vy = h - 210;
  c.fillStyle = '#080b22'; c.beginPath(); c.arc(vx, vy, 190, 0, Math.PI * 2); c.fill();
  for (const [rad, col, lw] of [[186, 'rgba(255,61,154,0.55)', 4], [150, 'rgba(61,240,255,0.35)', 3], [110, 'rgba(255,61,154,0.35)', 3], [60, 'rgba(61,240,255,0.45)', 3]] as [number, string, number][]) {
    c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(vx, vy, rad, 0, Math.PI * 2); c.stroke();
  }
  c.fillStyle = 'rgba(255,194,51,0.7)';
  for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; c.save(); c.translate(vx + Math.cos(a) * 150, vy + Math.sin(a) * 150); c.rotate(a); c.fillRect(-18, -5, 36, 10); c.restore(); }
  // ceiling truss
  c.fillStyle = '#0a0d26'; c.fillRect(0, 0, w, 20);
  c.strokeStyle = 'rgba(61,240,255,0.25)'; c.lineWidth = 2;
  for (let x = 0; x < w; x += 60) { c.beginPath(); c.moveTo(x, 20); c.lineTo(x + 30, 60); c.lineTo(x + 60, 20); c.stroke(); }
}

function hallMid(c: Ctx, w: number, h: number): void {
  const r = mulberry32(5);
  // server racks with blinking LEDs
  for (let x = 0; x < w; x += 190 + r() * 90) {
    const rw = 80 + r() * 50, rh = 160 + r() * 130;
    c.fillStyle = '#0b0f2c'; c.fillRect(x, h - rh, rw, rh);
    c.strokeStyle = 'rgba(61,240,255,0.25)'; c.lineWidth = 1; c.strokeRect(x + 0.5, h - rh + 0.5, rw - 1, rh - 1);
    for (let y = h - rh + 10; y < h - 10; y += 12) for (let lx = x + 8; lx < x + rw - 8; lx += 9) {
      const q = r();
      c.fillStyle = q < 0.12 ? 'rgba(255,61,154,0.9)' : q < 0.4 ? 'rgba(61,240,255,0.7)' : 'rgba(30,40,90,0.9)'; c.fillRect(lx, y, 4, 4);
    }
  }
  // gantry walkway with railing
  c.fillStyle = '#10153a'; c.fillRect(0, h - 270, w, 8);
  c.fillStyle = 'rgba(255,194,51,0.5)'; c.fillRect(0, h - 270, w, 2);
  c.strokeStyle = '#10153a'; c.lineWidth = 2;
  for (let x = 0; x < w; x += 24) { c.beginPath(); c.moveTo(x, h - 270); c.lineTo(x, h - 296); c.stroke(); }
  c.beginPath(); c.moveTo(0, h - 296); c.lineTo(w, h - 296); c.stroke();
  vgrad(c, 0, h - 80, w, 80, [[0, 'rgba(6,8,28,0)'], [1, 'rgba(6,8,28,0.6)']]);
}

function hallNear(c: Ctx, w: number, h: number): void {
  const r = mulberry32(21);
  for (let x = 160; x < w; x += 520 + r() * 260) {
    const cw = 64 + r() * 30;
    c.fillStyle = '#05060f'; c.fillRect(x, 0, cw, h);
    c.fillStyle = 'rgba(255,194,51,0.7)';
    for (let y = h - 160; y < h - 20; y += 40) { c.save(); c.translate(x, y); c.beginPath(); c.moveTo(0, 20); c.lineTo(cw * 0.5, 0); c.lineTo(cw, 20); c.lineTo(cw, 30); c.lineTo(0, 30); c.fill(); c.restore(); }
    c.fillStyle = 'rgba(61,240,255,0.8)'; c.fillRect(x + cw - 5, 0, 3, h - 170);
    c.fillStyle = 'rgba(255,61,154,0.5)'; c.fillRect(x + 4, 0, 2, h - 170);
  }
}

const art: BackdropArt = {
  sky: [[0, '#04051a'], [1, '#0c1030']],
  far: { w: 2048, h: 520, draw: hallFar },
  mid: { w: 2048, h: 420, draw: hallMid },
  near: { w: 2048, h: 700, draw: hallNear },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const { w, h, zoom, t } = f;
  // reactor halo pulsing behind the vault
  const cx = f.sx(0.12, 1400), cy = f.sy(0.12, 0.88, 210);
  const pulse = 0.6 + 0.4 * Math.sin(t * (alarm.on ? 6 : 1.6));
  const col = alarm.on ? 0xff3b3b : NEON.cyan;
  g.fillStyle(col, 0.05 * pulse).fillCircle(cx, cy, 300 * zoom);
  g.lineStyle(3 * zoom, col, 0.55).strokeCircle(cx, cy, (150 + 10 * pulse) * zoom);
  // rotating hazard beacons on the ceiling sweep the hall
  for (let i = 0; i < 3; i++) {
    const bx = w * (0.2 + i * 0.3) - f.midX * 0.02 * zoom;
    const a = t * (alarm.on ? 4 : 1.2) + i * 2;
    const len = 520 * zoom;
    g.fillStyle(alarm.on ? 0xff2b2b : 0xffc233, alarm.on ? 0.14 : 0.06);
    g.fillTriangle(bx, 8 * zoom, bx + Math.cos(a + 0.35) * len, 8 * zoom + Math.abs(Math.sin(a + 0.35)) * len, bx + Math.cos(a - 0.35) * len, 8 * zoom + Math.abs(Math.sin(a - 0.35)) * len);
    g.fillStyle(alarm.on ? 0xff3b3b : 0xffc233, 0.9).fillCircle(bx, 10 * zoom, 5 * zoom);
  }
  // welding sparks falling from the assembly line
  for (let i = 0; i < 18; i++) {
    const u = ((t * 0.7 + hash(i)) % 1);
    const sx = f.sx(0.3, 300 + hash(i * 3) * 1500) + Math.sin(i + t) * 6 * zoom;
    const sy = h * 0.4 + u * h * 0.5;
    g.fillStyle(0xffd24a, 1 - u).fillRect(sx, sy, 2 * zoom, 3 * zoom);
  }
}

const hazardStripe = (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void => {
  g.fillStyle(0x15151a, 1).fillRect(x, y, w, h);
  g.fillStyle(0xffc233, 1);
  for (let sx = x - h; sx < x + w; sx += h * 1.6) {
    const a = Math.max(sx, x), b = Math.min(sx + h * 0.8, x + w);
    if (b > a) g.fillTriangle(a, y + h, Math.min(b + h, x + w), y, Math.min(a + h, x + w), y).fillTriangle(a, y + h, b, y + h, Math.min(b + h, x + w), y);
  }
};

export const wardenTheme: WorldTheme = {
  ...neonTheme,
  id: 'arena_warden',
  accent: NEON.mag,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [255, 40, 70],
    onStart({ scene, region }) {
      alarm.on = true; alarm.since = scene.time.now;
      scene.cameras.main.flash(380, 255, 40, 70);
      // blast shutters slam over the entrance
      const g = scene.add.graphics().setDepth(75);
      const x0 = region.boss?.barrierX ?? 590;
      scene.tweens.addCounter({
        from: 0, to: 1, duration: 520, ease: 'Bounce.easeOut',
        onUpdate: (tw) => {
          const v = tw.getValue() ?? 0;
          g.clear();
          g.fillStyle(0x1b2150, 1).fillRect(x0 - 70, 0, 140, region.groundY * v * 0.22);
          g.fillStyle(0xffc233, 0.9).fillRect(x0 - 70, region.groundY * v * 0.22 - 6, 140, 6);
        },
        onComplete: () => scene.time.delayedCall(2200, () => g.destroy()),
      });
    },
    drawBarrier(g, x, h) {
      g.fillStyle(0xff2b4a, 0.18).fillRect(x - 24, 0, 48, h);
      g.fillStyle(0xff2b4a, 0.5).fillRect(x - 10, 0, 20, h);
      g.fillStyle(0xffd0d8, 0.95).fillRect(x - 2, 0, 4, h);
      g.fillStyle(0x15151a, 1).fillRect(x - 18, 0, 36, 18).fillRect(x - 18, h - 14, 36, 14);
      for (let y = 40; y < h; y += 46) g.fillStyle(0xffffff, 0.35).fillRect(x - 14, y, 28, 2);
    },
  },

  drawSolid(g, s, ctx) {
    if (s.kind !== 'ground') { neonTheme.drawSolid(g, s, ctx); return; }
    g.fillStyle(0x0e1230, 1).fillRect(s.x, s.y, s.w, s.h);
    g.fillStyle(0x26307a, 1).fillRect(s.x, s.y, s.w, 10);
    g.fillStyle(NEON.mag, 0.9).fillRect(s.x, s.y, s.w, 2);
    // tread plates
    g.lineStyle(2, 0x1b2150, 1);
    for (let x = s.x; x < s.x + s.w; x += 100) g.lineBetween(x, s.y + 10, x, s.y + s.h);
    g.fillStyle(0x1b2150, 1);
    for (let x = s.x + 8; x < s.x + s.w; x += 100) for (let y = s.y + 24; y < s.y + 100; y += 14) g.fillRect(x, y, 84, 3);
    // hazard bay lines flush with the floor
    hazardStripe(g, s.x + 4, s.y + 12, s.w - 8, 6);
    // glowing conduit
    g.fillStyle(NEON.cyan, 0.7).fillRect(s.x, s.y + 100, s.w, 3);
    g.fillStyle(NEON.cyan, 0.12).fillRect(s.x, s.y + 92, s.w, 18);
  },

  drawLedge(g, o) { // hover lift: heavy plate, hazard rim, thruster pods
    g.fillStyle(0x222a68, 1).fillRect(o.x, o.y, o.w, 12);
    g.fillStyle(NEON.mag, 1).fillRect(o.x, o.y, o.w, 2);
    hazardStripe(g, o.x + 6, o.y + 4, o.w - 12, 5);
    g.fillStyle(0x10143a, 1).fillRect(o.x + 10, o.y + 12, o.w - 20, 8);
    for (const ex of [o.x + 14, o.x + o.w - 38]) {
      g.fillStyle(0x2a3270, 1).fillRect(ex, o.y + 12, 24, 14);
      g.fillStyle(NEON.cyan, 0.8).fillRect(ex + 4, o.y + 26, 16, 4);
      g.fillStyle(NEON.cyan, 0.2).fillTriangle(ex + 2, o.y + 28, ex + 22, o.y + 28, ex + 12, o.y + 62);
    }
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'column': {
        g.fillStyle(0x151a42, 1).fillRect(d.x - d.w / 2, d.y - d.h, d.w, d.h);
        g.fillStyle(0xffffff, 0.06).fillRect(d.x - d.w / 2, d.y - d.h, 6, d.h);
        g.fillStyle(NEON.cyan, 0.85).fillRect(d.x + d.w / 2 - 8, d.y - d.h, 3, d.h - 120);
        hazardStripe(g, d.x - d.w / 2, d.y - 100, d.w, 14);
        g.fillStyle(0x222a68, 1).fillRect(d.x - d.w / 2 - 8, d.y - d.h, d.w + 16, 22);
        g.fillRect(d.x - d.w / 2 - 6, d.y - 12, d.w + 12, 12);
        break;
      }
      case 'reactor': { // glass containment cylinder; the plasma is animated
        g.fillStyle(0x10143a, 1).fillRect(d.x - 12, d.y - d.h - 80, d.w + 24, 80);
        g.fillStyle(0x222a68, 1).fillRect(d.x - 20, d.y - 26, d.w + 40, 26);
        g.fillStyle(NEON.cyan, 0.9).fillRect(d.x - 20, d.y - 26, d.w + 40, 2);
        g.fillStyle(0x070a24, 1).fillRoundedRect(d.x, d.y - d.h, d.w, d.h - 26, 16);
        g.lineStyle(3, NEON.cyan, 0.9).strokeRoundedRect(d.x, d.y - d.h, d.w, d.h - 26, 16);
        break;
      }
      case 'servers': {
        g.fillStyle(0x0a0d26, 1).fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(3, NEON.cyan, 0.8).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x2a3270, 1).fillRect(d.x + 14, d.y + d.h, 6, 60).fillRect(d.x + d.w - 20, d.y + d.h, 6, 60);
        break;
      }
      case 'roboarm': {
        g.fillStyle(0x222a68, 1).fillRect(d.x - 28, 0, 56, d.y);
        g.fillStyle(0x10143a, 1).fillRect(d.x - 38, d.y - 14, 76, 20);
        g.fillStyle(NEON.mag, 0.9).fillRect(d.x - 38, d.y + 4, 76, 2);
        break;
      }
      case 'gantry': { // overhead truss in front of the action
        g.fillStyle(0x0a0d26, 0.92).fillRect(d.x, d.y, d.w, 14);
        g.lineStyle(3, 0x0a0d26, 0.92);
        for (let x = d.x; x < d.x + d.w; x += 70) { g.lineBetween(x, d.y + 14, x + 35, d.y + 54); g.lineBetween(x + 35, d.y + 54, x + 70, d.y + 14); }
        g.fillStyle(0x0a0d26, 0.92).fillRect(d.x, d.y + 50, d.w, 8);
        g.fillStyle(NEON.cyan, 0.6).fillRect(d.x, d.y + 56, d.w, 2);
        break;
      }
      case 'target': { // painted combat ring on the floor
        g.lineStyle(4, NEON.mag, 0.55).strokeEllipse(d.x + d.w / 2, GROUND_Y + 2, d.w, 12);
        g.lineStyle(2, 0xffc233, 0.5).strokeEllipse(d.x + d.w / 2, GROUND_Y + 2, d.w * 0.6, 8);
        g.fillStyle(NEON.mag, 0.25).fillEllipse(d.x + d.w / 2, GROUND_Y + 2, d.w * 0.2, 5);
        break;
      }
      case 'shutter': { // a sealed blast door in the back wall
        g.fillStyle(0x0a0d26, 1).fillRect(d.x, d.y, d.w, d.h);
        for (let y = d.y; y < d.y + d.h; y += 24) { g.fillStyle(0x1b2150, 1).fillRect(d.x, y, d.w, 20); g.fillStyle(0x0a0d26, 1).fillRect(d.x, y + 20, d.w, 4); }
        hazardStripe(g, d.x - 6, d.y - 14, d.w + 12, 14);
        g.lineStyle(3, NEON.mag, 0.85).strokeRect(d.x, d.y, d.w, d.h);
        break;
      }
      default: neonTheme.drawDecor(g, d, ctx);
    }
  },

  animated: {
    reactor: {
      layer: 'back', pad: 100,
      draw(g, d, t) {
        const cx = d.x + d.w / 2, top = d.y - d.h, bot = d.y - 26;
        const col = alarm.on ? 0xff3b3b : NEON.cyan;
        const k = alarm.on ? 7 : 2.2;
        g.fillStyle(col, 0.22).fillRoundedRect(d.x + 6, top + 6, d.w - 12, bot - top - 12, 12);
        for (let i = 0; i < 6; i++) {
          const y = top + 20 + ((t * 70 * (alarm.on ? 2 : 1) + i * (bot - top) / 6) % (bot - top - 40));
          g.fillStyle(col, 0.55).fillEllipse(cx + Math.sin(t * k + i * 1.7) * (d.w * 0.22), y, 34 + (i % 3) * 8, 10);
        }
        g.fillStyle(0xffffff, 0.75 + 0.2 * Math.sin(t * k)).fillCircle(cx, (top + bot) / 2, 12 + Math.sin(t * k) * 3);
        g.lineStyle(2, col, 0.7).strokeEllipse(cx, (top + bot) / 2, 70 + Math.sin(t * k) * 8, 26);
        g.fillStyle(col, 0.1).fillCircle(cx, (top + bot) / 2, 150);
      },
    },
    servers: {
      layer: 'back', pad: 30,
      draw(g, d, t) {
        for (let r = 0, y = d.y + 8; y < d.y + d.h - 14; y += 11, r++) {
          const w = (d.w - 20) * (0.3 + 0.7 * hash(Math.floor(t * 2 + r) + d.seed + r));
          g.fillStyle(r % 3 === 0 ? NEON.mag : NEON.cyan, 0.8).fillRect(d.x + 10, y, w, 5);
        }
        g.fillStyle(0xffffff, 0.12).fillRect(d.x, d.y + ((t * 40) % d.h), d.w, 3);
      },
    },
    roboarm: {
      layer: 'back', pad: 260,
      draw(g, d, t) {
        const a1 = Math.PI / 2 + Math.sin(t * 0.9 + d.seed) * 0.6;
        const a2 = a1 + Math.sin(t * 1.7 + d.seed) * 0.9;
        const bx = d.x, by = d.y + 4;
        const mx = bx + Math.cos(a1) * 130, my = by + Math.sin(a1) * 130;
        const ex = mx + Math.cos(a2) * 110, ey = my + Math.sin(a2) * 110;
        g.lineStyle(14, 0x222a68, 1).lineBetween(bx, by, mx, my);
        g.lineStyle(10, 0x2a3270, 1).lineBetween(mx, my, ex, ey);
        g.lineStyle(2, NEON.cyan, 0.9).lineBetween(bx, by, mx, my).lineBetween(mx, my, ex, ey);
        g.fillStyle(0x0a0d26, 1).fillCircle(mx, my, 10).fillCircle(bx, by, 12);
        g.fillStyle(NEON.mag, 1).fillCircle(mx, my, 4);
        if (Math.sin(t * 6 + d.seed) > 0.8) { g.fillStyle(0xfff1b0, 1).fillCircle(ex, ey + 6, 6); for (let i = 0; i < 4; i++) g.fillRect(ex + (hash(i + t * 10) - 0.5) * 30, ey + 6 + hash(i * 2 + t * 10) * 30, 2, 4); }
      },
    },
    spotlight: {
      layer: 'back', pad: 320,
      draw(g, d, t) {
        const a = Math.PI / 2 + Math.sin(t * 0.8 + d.seed) * 0.55;
        const len = GROUND_Y - d.y;
        g.fillStyle(0xfff4c8, alarm.on ? 0.03 : 0.07);
        g.fillTriangle(d.x, d.y, d.x + Math.cos(a - 0.12) * len * 1.2, d.y + Math.sin(a - 0.12) * len * 1.2, d.x + Math.cos(a + 0.12) * len * 1.2, d.y + Math.sin(a + 0.12) * len * 1.2);
        g.fillStyle(0xfff4c8, 1).fillCircle(d.x, d.y, 6);
      },
    },
    warnlight: {
      layer: 'back', pad: 80,
      draw(g, d, t) {
        const on = alarm.on ? Math.floor(t * 5) % 2 === 0 : Math.floor(t * 1.2) % 4 === 0;
        g.fillStyle(0xff3b3b, on ? 0.32 : 0.05).fillCircle(d.x, d.y, 46);
        g.fillStyle(0xff3b3b, on ? 1 : 0.3).fillCircle(d.x, d.y, 9);
      },
    },
    target: {
      layer: 'back', pad: 20,
      draw(g, d, t) {
        const k = alarm.on ? 0.6 + 0.4 * Math.sin(t * 8) : 0.35;
        g.fillStyle(NEON.mag, 0.14 * k).fillEllipse(d.x + d.w / 2, GROUND_Y + 2, d.w * 1.1, 16);
      },
    },
  },

  ambient(scene): AmbientParticles {
    alarm.on = false;
    const g = scene.add.graphics().setDepth(68);
    return {
      update(_dt, view, t) { // dust motes in the spotlights; red wash during lockdown
        g.clear();
        for (let i = 0; i < 26; i++) {
          const px = view.left + ((hash(i) * view.width + Math.sin(t * 0.3 + i) * 30 + t * 6) % view.width);
          const py = view.top + ((hash(i + 50) * view.height + t * 14) % view.height);
          g.fillStyle(0xcfe8ff, 0.25).fillRect(px, py, 2, 2);
        }
        if (alarm.on) g.fillStyle(0xff1030, 0.04 + 0.03 * Math.sin(t * 8)).fillRect(view.left, view.top, view.width, view.height);
      },
    };
  },
};

export function buildWardenArena(): RegionDef {
  return arenaRegion({
    id: 'boss_arena', name: 'Warden Arena', theme: 'arena_warden', width: 2000, boss: 'warden', bossX: 1500, lampId: 'arena', lampName: 'Arena Lamp',
    // twin hover lifts, a raised central deck and a high maintenance catwalk: a vertical "reactor" layout
    platforms: [[740, 830, 200], [1010, 720, 220], [1290, 610, 260], [1620, 730, 220]],
    back: { to: 'city', spawn: 'gate_exit' }, next: { to: 'docks', spawn: 'from_west', label: 'DOCKS' },
    decorate(b) {
      b.add('shutter', 1240, 330, 220, 300);
      b.add('servers', 700, 560, 220, 160); b.add('servers', 1780, 560, 150, 160);
      b.add('reactor', 1000, GROUND_Y, 150, 440);
      for (let x = 120; x < 2000; x += 520) b.add('column', x, GROUND_Y, 64, 780);
      for (const x of [420, 900, 1380, 1780]) b.add('roboarm', x, 190 + (x % 3) * 20, 0, 0);
      for (const x of [300, 780, 1260, 1700]) b.add('spotlight', x, 60, 0, 0);
      for (const x of [140, 1040, 1900]) b.add('warnlight', x, 120, 0, 0);
      b.add('target', 900, GROUND_Y, 500, 0);
      b.add('gantry', 0, 300, 2000, 60, undefined, 'front');
    },
  });
}
