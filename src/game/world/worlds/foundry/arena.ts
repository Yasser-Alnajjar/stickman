import Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, glow, hash, mulberry32, vgrad, wrapX } from '../../kit';
import { EMBER, cracks, flame, foundryTheme, heat } from './theme';

/**
 * EMPRESS THRONE: the molten heart of the volcano. An obsidian causeway crosses a lava lake to a stepped throne of
 * horned iron. Geysers of fire, furnace alcoves, braziers, lava falls and floating obsidian slabs.
 */

type Ctx = CanvasRenderingContext2D;

function hallFar(c: Ctx, w: number, h: number): void {
  const hy = h - 190;
  vgrad(c, 0, hy, w, h - hy, [[0, '#ff7a20'], [0.2, '#c8340c'], [1, '#4a0c06']]);
  const r = mulberry32(3);
  for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(255,${180 + r() * 70},80,${0.2 + r() * 0.5})`; c.fillRect(r() * w, hy + 4 + r() * 180, 16 + r() * 70, 2); }
  // colossal obsidian arches marching into the haze
  c.fillStyle = '#16070a';
  for (let x = 40; x < w; x += 320) {
    const aw = 220;
    const draw = (ox: number): void => {
      c.fillRect(ox, 0, 50, hy + 4); c.fillRect(ox + aw - 50, 0, 50, hy + 4);
      c.beginPath(); c.moveTo(ox + 50, hy * 0.46); c.quadraticCurveTo(ox + aw / 2, hy * 0.08, ox + aw - 50, hy * 0.46); c.lineTo(ox + aw - 50, hy * 0.18); c.quadraticCurveTo(ox + aw / 2, -hy * 0.3, ox + 50, hy * 0.18); c.fill();
      c.fillStyle = 'rgba(255,100,30,0.7)'; c.fillRect(ox + 46, 0, 3, hy); c.fillRect(ox + aw - 49, 0, 3, hy); c.fillStyle = '#16070a';
    };
    wrapX(w, x, aw, draw);
  }
  // distant fire-lit fortress isle
  c.fillStyle = '#0d0407'; c.beginPath(); c.moveTo(1200, hy + 4); c.lineTo(1260, hy - 40); c.lineTo(1540, hy - 40); c.lineTo(1600, hy + 4); c.fill();
  for (const tx of [1290, 1370, 1450, 1510]) { c.fillRect(tx, hy - 120 - (tx % 40), 26, 90); c.beginPath(); c.moveTo(tx - 4, hy - 120 - (tx % 40)); c.lineTo(tx + 13, hy - 156 - (tx % 40)); c.lineTo(tx + 30, hy - 120 - (tx % 40)); c.fill(); }
  c.fillStyle = 'rgba(255,170,60,0.9)'; for (const tx of [1298, 1378, 1458, 1518]) c.fillRect(tx, hy - 90, 4, 12);
}

function hallMid(c: Ctx, w: number, h: number): void {
  const r = mulberry32(40);
  // fire-lit obsidian columns and hanging banners of the empress
  for (let x = 60; x < w; x += 300 + r() * 120) {
    const cw = 54 + r() * 24, ch = 240 + r() * 120;
    const draw = (ox: number): void => {
      c.fillStyle = '#1c0a0c'; c.fillRect(ox, h - ch, cw, ch);
      c.fillStyle = '#2a1014'; c.fillRect(ox - 8, h - ch, cw + 16, 20);
      c.fillStyle = 'rgba(255,110,30,0.8)'; c.fillRect(ox + cw - 5, h - ch + 20, 3, ch - 20);
      const g = c.createRadialGradient(ox + cw / 2, h - ch - 12, 0, ox + cw / 2, h - ch - 12, 70);
      g.addColorStop(0, 'rgba(255,170,50,0.85)'); g.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = g; c.fillRect(ox - 60, h - ch - 80, cw + 120, 140);
    };
    wrapX(w, x, cw, draw);
  }
  // molten falls pouring from the ceiling into the lake
  for (let x = 220; x < w; x += 560 + r() * 300) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,200,80,0.95)'); g.addColorStop(1, 'rgba(255,70,10,0.7)');
    c.fillStyle = g; c.fillRect(x, 0, 12, h); c.fillStyle = 'rgba(255,120,30,0.14)'; c.fillRect(x - 24, 0, 60, h);
  }
  vgrad(c, 0, h - 100, w, 100, [[0, 'rgba(60,8,0,0)'], [1, 'rgba(255,80,10,0.3)']]);
}

function hallNear(c: Ctx, w: number, h: number): void {
  const r = mulberry32(55);
  c.fillStyle = '#070304';
  for (let x = 0; x < w; x += 70 + r() * 90) { // stalactites from the vault above, tips just visible at the top edge
    const sw = 40 + r() * 60, sl = 200 + r() * 220;
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x + sw, 0); c.lineTo(x + sw / 2, sl); c.fill();
    if (r() < 0.4) { c.fillStyle = 'rgba(255,100,20,0.8)'; c.fillRect(x + sw / 2 - 2, sl - 24, 4, 24); c.fillStyle = '#070304'; }
  }
  for (let x = 160; x < w; x += 700 + r() * 300) { // chains with iron hooks
    c.strokeStyle = '#070304'; c.lineWidth = 5; c.setLineDash([7, 5]); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h - 120 - r() * 100); c.stroke(); c.setLineDash([]);
  }
}

const art: BackdropArt = {
  sky: [[0, '#050204'], [0.5, '#2a0808'], [1, '#8a2410']],
  far: { w: 2048, h: 540, draw: hallFar },
  mid: { w: 2048, h: 460, draw: hallMid },
  near: { w: 2048, h: 760, draw: hallNear },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const { w, h, zoom, t } = f;
  const boost = Math.max(0, 1 - (t - heat.erupt) / 3);
  g.fillStyle(0xff5a10, 0.08 + 0.04 * Math.sin(t * 1.5) + boost * 0.18).fillRect(0, h * 0.5, w, h * 0.5);
  // lava lake: slow-moving bright veins
  for (let i = 0; i < 22; i++) {
    const lx = ((hash(i) * w + t * (8 + hash(i + 5) * 12) * zoom - f.midX * 0.1 * zoom) % w + w) % w;
    g.fillStyle(0xffe08a, 0.5).fillRect(lx, f.sy(0.1, 0.88, 6 + hash(i + 9) * 160), (24 + hash(i + 2) * 70) * zoom, 2 * zoom);
  }
  // geyser plumes far across the lake
  for (let i = 0; i < 3; i++) {
    const cyc = (t * 0.2 + i * 0.33) % 1;
    const gx = f.sx(0.1, 500 + i * 650), gy = f.sy(0.1, 0.88, 40);
    const hh = Math.sin(Math.min(1, cyc * 2.5) * Math.PI) * (170 + boost * 80) * zoom * (cyc < 0.4 ? 1 : 0);
    if (hh > 0) { g.fillStyle(0xff7a20, 0.65).fillTriangle(gx - 12 * zoom, gy, gx + 12 * zoom, gy, gx, gy - hh); g.fillStyle(0xffd24a, 0.8).fillTriangle(gx - 5 * zoom, gy, gx + 5 * zoom, gy, gx, gy - hh * 0.7); }
  }
  for (let i = 0; i < 30; i++) {
    const u = (t * (0.06 + hash(i) * 0.08) + hash(i * 3)) % 1;
    const ex = ((hash(i * 7) * w + Math.sin(t * 0.5 + i) * 30 * zoom - f.midX * 0.08 * zoom) % w + w) % w;
    g.fillStyle(i % 3 ? 0xff8a2a : 0xffd24a, (1 - u) * 0.9).fillRect(ex, h - u * h, 2.5 * zoom, 2.5 * zoom);
  }
}

export const ignisTheme: WorldTheme = {
  ...foundryTheme,
  id: 'arena_ignis',
  accent: 0xff9a2a,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [255, 120, 20],
    onStart({ scene, region, fx }) { // the lake erupts as the empress rises
      heat.erupt = scene.time.now / 1000;
      scene.cameras.main.flash(480, 255, 120, 20);
      fx.shake(0.02, 1200);
      for (let i = 0; i < 8; i++) scene.time.delayedCall(i * 120, () => { fx.debrisBurst(300 + i * 260, GROUND_Y, 16); fx.ring(300 + i * 260, GROUND_Y, 0xff8a2a, 20, 140, 500, 5); });
      fx.text(region.boss ? region.boss.x - 160 : 1800, 560, 'THE LAKE BURNS', '#ffb050', 28, 1400);
    },
    drawBarrier(g, x, h) { // wall of flame
      g.fillStyle(0xff5a10, 0.20).fillRect(x - 36, 0, 72, h);
      g.fillStyle(0xff7a20, 0.55).fillRect(x - 14, 0, 28, h);
      g.fillStyle(0xffd24a, 0.95).fillRect(x - 3, 0, 6, h);
      for (let y = 20; y < h; y += 38) g.fillStyle(0xffb040, 0.85).fillTriangle(x - 20, y + 30, x + 20, y + 30, x + (y % 3 - 1) * 8, y);
    },
  },

  drawSolid(g, s, ctx) {
    if (s.kind !== 'ground') { foundryTheme.drawSolid(g, s, ctx); return; }
    // obsidian causeway: glassy black slabs inlaid with glowing runes, crossing the lava on wide stone piers
    g.fillStyle(0x0d0709, 1).fillRect(s.x, s.y, s.w, 34);
    g.fillStyle(0x2a1620, 1).fillRect(s.x, s.y, s.w, 6);
    g.fillStyle(0xff9a2a, 0.85).fillRect(s.x, s.y + 6, s.w, 2);
    g.lineStyle(2, 0xff6a1a, 0.9);
    for (let x = s.x + 40; x < s.x + s.w; x += 160) {
      g.beginPath(); g.moveTo(x, s.y + 14); g.lineTo(x + 20, s.y + 26); g.lineTo(x + 40, s.y + 14); g.lineTo(x + 60, s.y + 26); g.strokePath();
      g.strokeCircle(x + 100, s.y + 20, 6);
    }
    g.fillStyle(0x07040a, 1).fillRect(s.x, s.y + 34, s.w, 8);
    for (let x = s.x + 60; x < s.x + s.w; x += 380) {
      g.fillStyle(0x0d0709, 1).fillRect(x, s.y + 42, 90, s.h - 42);
      g.fillStyle(0x2a1620, 1).fillRect(x, s.y + 42, 8, s.h - 42);
      g.fillStyle(0xff6a1a, 0.5).fillRect(x + 84, s.y + 42, 3, s.h - 42);
      g.fillStyle(0x0d0709, 1).fillTriangle(x - 90, s.y + 42, x, s.y + 42, x, s.y + 90).fillTriangle(x + 90, s.y + 42, x + 180, s.y + 42, x + 90, s.y + 90);
      cracks(g, x + 10, s.y + 46, 70, s.h - 50, x * 0.1, 0.4);
    }
  },

  drawLedge(g, o) { // floating obsidian slab: angular, glowing underside, loose shards drifting below
    const cx = o.x + o.w / 2;
    g.fillStyle(0xff5a10, 0.18).fillEllipse(cx, o.y + 26, o.w * 1.1, 34);
    g.fillStyle(0x140a0e, 1).fillPoints([{ x: o.x - 6, y: o.y }, { x: o.x + o.w + 6, y: o.y }, { x: o.x + o.w - 16, y: o.y + 14 }, { x: cx, y: o.y + 30 }, { x: o.x + 16, y: o.y + 14 }], true);
    g.fillStyle(0x4a2a34, 1).fillRect(o.x - 6, o.y, o.w + 12, 4);
    g.fillStyle(0xff9a2a, 0.95).fillRect(o.x - 6, o.y, o.w + 12, 2);
    g.lineStyle(2, 0xff6a1a, 0.8).beginPath().moveTo(o.x + 16, o.y + 14).lineTo(cx, o.y + 30).lineTo(o.x + o.w - 16, o.y + 14).strokePath();
    g.fillStyle(0x140a0e, 1).fillTriangle(cx - 10, o.y + 38, cx + 10, o.y + 38, cx, o.y + 56);
    g.fillStyle(0x140a0e, 1).fillTriangle(o.x + 24, o.y + 34, o.x + 36, o.y + 34, o.x + 30, o.y + 46).fillTriangle(o.x + o.w - 36, o.y + 36, o.x + o.w - 24, o.y + 36, o.x + o.w - 30, o.y + 50);
  },

  drawDecor(g, d, ctx) {
    switch (d.kind) {
      case 'obelisk': { // obsidian column with a bowl of fire on top
        g.fillStyle(0x140a0e, 1).fillRect(d.x - d.w / 2, d.y - d.h, d.w, d.h);
        g.fillStyle(0x3a1c24, 1).fillRect(d.x - d.w / 2, d.y - d.h, 6, d.h);
        g.fillStyle(0xff6a1a, 0.9).fillRect(d.x + d.w / 2 - 6, d.y - d.h + 30, 3, d.h - 120);
        g.fillStyle(0x24121a, 1).fillRect(d.x - d.w / 2 - 12, d.y - d.h - 14, d.w + 24, 24).fillRect(d.x - d.w / 2 - 8, d.y - 18, d.w + 16, 18);
        g.fillStyle(0x0d0709, 1).fillTriangle(d.x - 30, d.y - d.h - 14, d.x + 30, d.y - d.h - 14, d.x, d.y - d.h + 10);
        break;
      }
      case 'throne': { // stepped dais + horned iron throne; the flame halo is animated
        const cx = d.x + d.w / 2;
        // stairs (left side steps)
        for (let i = 0; i < 4; i++) { g.fillStyle(0x1a0d12, 1).fillRect(d.x + i * 40, GROUND_Y - (i + 1) * 30, d.w - i * 40, 30); g.fillStyle(0xff7a20, 0.8).fillRect(d.x + i * 40, GROUND_Y - (i + 1) * 30, d.w - i * 40, 2); }
        const base = GROUND_Y - 120;
        g.fillStyle(0x0d0709, 1).fillRect(cx - 52, base - 150, 104, 150);
        g.fillStyle(0x24121a, 1).fillRect(cx - 70, base - 60, 140, 20).fillRect(cx - 62, base - 40, 18, 40).fillRect(cx + 44, base - 40, 18, 40);
        g.fillStyle(0x0d0709, 1).fillTriangle(cx - 52, base - 150, cx - 24, base - 150, cx - 80, base - 270).fillTriangle(cx + 52, base - 150, cx + 24, base - 150, cx + 80, base - 270);
        g.fillTriangle(cx - 20, base - 150, cx + 20, base - 150, cx, base - 230);
        g.fillStyle(0xff7a20, 0.9).fillRect(cx - 4, base - 140, 8, 80);
        g.fillStyle(0xffd24a, 0.9).fillCircle(cx, base - 100, 9);
        g.lineStyle(3, 0xff7a20, 0.8).strokeRect(cx - 52, base - 150, 104, 150);
        break;
      }
      case 'alcove': { // furnace alcove cut into the wall
        g.fillStyle(0x0d0709, 1).fillRect(d.x, d.y, d.w, d.h).fillTriangle(d.x, d.y, d.x + d.w, d.y, d.x + d.w / 2, d.y - 50);
        g.lineStyle(4, 0x3a1c24, 1).strokeRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0xff5a10, 0.4).fillRect(d.x + 6, d.y + 6, d.w - 12, d.h - 6);
        break;
      }
      case 'rune': break; // animated
      case 'geyser': { // vent in the lava; eruption is animated
        g.fillStyle(0x0d0709, 1).fillRect(d.x - 16, GROUND_Y + 40, 32, 10);
        break;
      }
      default: foundryTheme.drawDecor(g, d, ctx);
    }
  },

  animated: {
    ...foundryTheme.animated,
    throne: {
      layer: 'back', pad: 260,
      draw(g, d, t) { // halo of fire behind the seat
        const cx = d.x + d.w / 2, base = GROUND_Y - 220;
        const boost = Math.max(0, 1 - (t - heat.erupt) / 3);
        glow(g, cx, base - 40, 260, 0xff5a10, 0.35 + boost * 0.4 + 0.08 * Math.sin(t * 3));
        for (const sx of [-1, 1]) flame(g, cx + sx * 120, GROUND_Y - 120, 50, 90 + boost * 60, t, d.seed + sx);
        for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.18; g.lineStyle(3, 0xff9a2a, 0.35 + 0.2 * Math.sin(t * 2 + i)).lineBetween(cx + Math.cos(a) * 60, base + Math.sin(a) * 60, cx + Math.cos(a) * (140 + boost * 60), base + Math.sin(a) * (140 + boost * 60)); }
      },
    },
    alcove: {
      layer: 'back', pad: 140,
      draw(g, d, t) {
        flame(g, d.x + d.w / 2, d.y + d.h, d.w * 0.7, d.h * 0.8, t, d.seed);
        glow(g, d.x + d.w / 2, d.y + d.h * 0.6, 150, 0xff5a10, 0.3 + 0.08 * Math.sin(t * 6 + d.seed));
      },
    },
    rune: {
      layer: 'back', pad: 20,
      draw(g, d, t) { // glowing summoning circle painted on the causeway; flares when the lake erupts
        const boost = Math.max(0, 1 - (t - heat.erupt) / 3);
        const cx = d.x + d.w / 2, k = 0.45 + 0.2 * Math.sin(t * 2) + boost * 0.5;
        g.lineStyle(3, 0xff7a20, k).strokeEllipse(cx, GROUND_Y + 2, d.w, 12);
        g.lineStyle(2, 0xffd24a, k * 0.8).strokeEllipse(cx, GROUND_Y + 2, d.w * 0.66, 8);
        for (let i = 0; i < 8; i++) { const a = t * 0.5 + (i / 8) * Math.PI * 2; g.fillStyle(0xffb040, k).fillRect(cx + Math.cos(a) * d.w * 0.5 - 2, GROUND_Y + Math.sin(a) * 6 - 2, 4, 4); }
        g.fillStyle(0xff5a10, 0.16 * k).fillEllipse(cx, GROUND_Y + 2, d.w * 1.1, 16);
      },
    },
    geyser: {
      layer: 'back', pad: 400,
      draw(g, d, t) { // telegraphed columns of fire jetting up behind the causeway
        const boost = t - heat.erupt < 2.4 && heat.erupt > 0;
        const cyc = ((t + d.seed * 0.37) % 6) / 6;
        const warn = cyc > 0.62 && cyc < 0.78, blast = cyc >= 0.78 && cyc < 0.9;
        if (warn) glow(g, d.x, GROUND_Y + 50, 60 + (cyc - 0.62) * 300, 0xffa040, 0.4);
        if (blast || boost) {
          const u = boost ? 0.5 : (cyc - 0.78) / 0.12;
          const hh = (boost ? 520 : 340) * Math.sin(Math.min(1, u * 1.3) * Math.PI * 0.5 + 0.4);
          g.fillStyle(0xff5a10, 0.55).fillTriangle(d.x - 40, GROUND_Y + 40, d.x + 40, GROUND_Y + 40, d.x, GROUND_Y - hh);
          g.fillStyle(0xff9a2a, 0.9).fillTriangle(d.x - 24, GROUND_Y + 40, d.x + 24, GROUND_Y + 40, d.x, GROUND_Y - hh * 0.85);
          g.fillStyle(0xffe08a, 1).fillTriangle(d.x - 10, GROUND_Y + 40, d.x + 10, GROUND_Y + 40, d.x, GROUND_Y - hh * 0.55);
        }
      },
    },
  },

  ambient(scene): AmbientParticles {
    const base = foundryTheme.ambient!(scene, {} as RegionDef);
    heat.erupt = -99;
    return base;
  },
};

export function buildEmpressArena(): RegionDef {
  return arenaRegion({
    id: 'empress_arena', name: 'Empress Throne', theme: 'arena_ignis', width: 2500, boss: 'ignis', bossX: 1900, lampId: 'throne', lampName: 'Throne Lamp',
    scale: { hp: 1.7, atk: 1.45 },
    // slabs rise in a fan toward a high central slab, then drop away: the empress's own bridge of obsidian
    platforms: [[740, 830, 200], [990, 720, 190], [1240, 610, 260], [1590, 720, 190], [1850, 830, 200], [2120, 730, 190]],
    back: { to: 'foundry', spawn: 'from_east' },
    decorate(b) {
      b.add('throne', 2140, 840, 300, 120);
      for (const x of [820, 1520]) b.add('alcove', x, 560, 180, 400);
      for (let x = 360; x < 2500; x += 440) b.add('obelisk', x, GROUND_Y, 56, 520);
      for (const x of [300, 1150, 2000]) b.add('lavafall', x, 80, 52, 0);
      for (const x of [560, 960, 1380, 1780, 2200]) b.add('geyser', x, GROUND_Y, 0, 0);
      b.add('rune', 900, GROUND_Y, 560, 0);
      b.add('banner', 1000, 380, 60, 200); b.add('banner', 1420, 380, 60, 200);
      for (const x of [660, 1260, 1860]) b.add('chain', x, 0, 0, 280, undefined, 'front');
    },
  });
}
