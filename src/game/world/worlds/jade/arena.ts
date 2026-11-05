import type { RegionDef } from '@/game/config/regions';
import type { BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, vgrad, wrapX } from '../../kit';
import { JADE, jadeTheme } from './theme';
import type Phaser from 'phaser';
import { t } from '@/i18n';

type Ctx = CanvasRenderingContext2D;

/** The Sunken Sanctum: a flooded inner temple under a colossal idol-wall, lit only by glyph-light and braziers. */
const flare = { at: -99 };

function farWall(c: Ctx, w: number, h: number): void {
  const r = mulberry32(9);
  vgrad(c, 0, 0, w, h, [[0, '#06161a'], [1, '#0d2a2b']]);
  // colossal relief faces, repeating along the wall
  for (let x = 140; x < w; x += 680) {
    wrapX(w, x - 200, 460, (ox) => {
      c.fillStyle = '#12302f'; c.fillRect(ox, h - 440, 360, 440);
      c.fillStyle = '#0a2222'; c.fillRect(ox + 40, h - 200, 280, 60);
      c.fillStyle = '#071a1a'; c.fillRect(ox + 60, h - 340, 80, 36); c.fillRect(ox + 220, h - 340, 80, 36);
      c.fillStyle = 'rgba(125,255,208,0.8)'; c.fillRect(ox + 82, h - 330, 36, 14); c.fillRect(ox + 242, h - 330, 36, 14);
      const g = c.createRadialGradient(ox + 180, h - 322, 0, ox + 180, h - 322, 190);
      g.addColorStop(0, 'rgba(125,255,208,0.22)'); g.addColorStop(1, 'rgba(125,255,208,0)');
      c.fillStyle = g; c.fillRect(ox - 20, h - 520, 400, 400);
    });
  }
  c.strokeStyle = 'rgba(230,185,79,0.3)'; c.lineWidth = 3;
  for (let y = 60; y < h - 460; y += 46) { c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 32) c.lineTo(x, y + (x / 32) % 2 * 10 - 5 + r() * 2); c.stroke(); }
}

function midColumns(c: Ctx, w: number, h: number): void {
  const r = mulberry32(31);
  for (let x = 40; x < w; x += 300) {
    c.fillStyle = '#0c2423';
    wrapX(w, x, 80, (ox) => { c.fillRect(ox, 0, 64, h); c.fillRect(ox - 12, 0, 88, 26); c.fillRect(ox - 12, h - 28, 88, 28); });
    c.fillStyle = 'rgba(125,255,208,0.5)';
    wrapX(w, x + 24, 10, (ox) => { for (let y = 60; y < h - 60; y += 50 + r() * 30) c.fillRect(ox, y, 10, 22); });
  }
  vgrad(c, 0, h - 90, w, 90, [[0, 'rgba(20,70,70,0)'], [1, 'rgba(20,70,70,0.55)']]); // floodwater haze
}

function nearRoots(c: Ctx, w: number, h: number): void {
  const r = mulberry32(5);
  c.strokeStyle = '#020a0a'; c.lineWidth = 4;
  for (let x = 60; x < w; x += 190 + r() * 200) {
    const len = 160 + r() * 380;
    wrapX(w, x - 40, 100, (ox) => { c.beginPath(); c.moveTo(ox, 0); c.bezierCurveTo(ox + 30, len * 0.3, ox - 40, len * 0.6, ox + 8, len); c.stroke(); });
  }
}

const art: BackdropArt = {
  sky: [[0, '#02090b'], [0.6, '#07191b'], [1, '#0c2b2a']],
  far: { w: 2048, h: 520, draw: farWall },
  mid: { w: 2048, h: 420, draw: midColumns },
  near: { w: 2048, h: 560, draw: nearRoots },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const k = Math.max(0, 1 - (f.t - flare.at) / 1.4);
  for (let i = 0; i < 6; i++) { // drifting glyph-light motes
    const x = ((hash(i) * f.w + f.t * (6 + i * 3) * f.zoom) % f.w);
    g.fillStyle(JADE.glow, 0.12 + 0.1 * k).fillCircle(x, f.h * (0.25 + 0.5 * hash(i + 9)) + Math.sin(f.t + i) * 14 * f.zoom, (4 + k * 6) * f.zoom);
  }
  if (k > 0) g.fillStyle(JADE.glow, 0.1 * k).fillRect(0, 0, f.w, f.h);
}

export const azcalTheme: WorldTheme = {
  ...jadeTheme,
  id: 'arena_azcal',
  accent: JADE.glow,
  backdrop: art,
  backdropFx,
  stage: {
    flash: [125, 255, 208],
    onStart({ scene, fx, region }) { // every glyph in the hall ignites; the ceiling sheds dust
      flare.at = scene.time.now / 1000;
      scene.cameras.main.flash(380, 125, 255, 208);
      fx.shake(0.014, 900);
      for (let i = 0; i < 7; i++) scene.time.delayedCall(i * 120, () => fx.debrisBurst(300 + i * 280, 200, 12));
      fx.text(region.boss ? region.boss.x - 220 : 1500, 520, t('AWAKE'), '#7dffd0', 30, 1400);
    },
    drawBarrier(g, x, h) { // a curtain of carved jade glyphs
      g.fillStyle(0x0a2a26, 0.95).fillRect(x - 16, 0, 32, h);
      g.fillStyle(JADE.glow, 0.35).fillRect(x - 30, 0, 60, h);
      g.lineStyle(3, JADE.gold, 0.9);
      for (let y = 20; y < h; y += 56) g.strokeRect(x - 10, y, 20, 28).lineBetween(x - 10, y + 14, x + 10, y + 14);
    },
  },
  drawLedge(g, o) { // floating jade slab
    g.fillStyle(0x2c4a3f, 1).fillRect(o.x, o.y, o.w, 14);
    g.fillStyle(JADE.glow, 0.7).fillRect(o.x, o.y, o.w, 2);
    g.fillStyle(0x16302a, 1).fillRect(o.x + 6, o.y + 14, o.w - 12, 8);
    g.lineStyle(2, JADE.gold, 0.7);
    for (let x = o.x + 16; x < o.x + o.w - 8; x += 36) g.strokeRect(x, o.y + 3, 16, 8);
  },
  drawDecor(g, d, ctx) {
    if (d.kind === 'idol_wall') { // the boss's own face looming over the arena
      g.fillStyle(0x12302f, 1).fillRect(d.x, d.y, d.w, d.h);
      g.fillStyle(0x0a2222, 1).fillRect(d.x + d.w * 0.15, d.y + d.h * 0.7, d.w * 0.7, d.h * 0.14);
      g.fillStyle(0x071a1a, 1).fillRect(d.x + d.w * 0.18, d.y + d.h * 0.28, d.w * 0.24, d.h * 0.1).fillRect(d.x + d.w * 0.58, d.y + d.h * 0.28, d.w * 0.24, d.h * 0.1);
      g.fillStyle(0x1a4440, 1).fillRect(d.x + d.w * 0.44, d.y + d.h * 0.4, d.w * 0.12, d.h * 0.3);
      g.lineStyle(3, JADE.gold, 0.6).strokeRect(d.x + 8, d.y + 8, d.w - 16, d.h - 16);
      return;
    }
    if (d.kind === 'altar') {
      g.fillStyle(0x36574b, 1).fillRect(d.x, d.y, d.w, d.h).fillRect(d.x - 20, d.y + d.h - 16, d.w + 40, 16);
      g.fillStyle(JADE.gold, 0.8).fillRect(d.x + 10, d.y + 8, d.w - 20, 4);
      return;
    }
    if (d.kind === 'glyphfloor') return; // animated only
    jadeTheme.drawDecor(g, d, ctx);
  },
  animated: {
    ...jadeTheme.animated,
    glyphfloor: {
      layer: 'back', pad: 20,
      draw(g, d, t) { // floor runes pulse, and flare when the boss wakes
        const k = Math.max(0, 1 - (t - flare.at) / 1.4);
        const n = Math.floor(d.w / 70);
        for (let i = 0; i < n; i++) {
          const a = 0.18 + 0.16 * Math.sin(t * 1.6 + i * 0.7) + 0.5 * k;
          g.lineStyle(2, JADE.glow, Math.min(1, a)).strokeRect(d.x + i * 70 + 12, GROUND_Y + 14, 46, 18).lineBetween(d.x + i * 70 + 35, GROUND_Y + 14, d.x + i * 70 + 35, GROUND_Y + 32);
        }
      },
    },
    idol_wall: {
      layer: 'back', pad: 40,
      draw(g, d, t) {
        const k = 0.45 + 0.35 * Math.sin(t * 1.4) + 0.5 * Math.max(0, 1 - (t - flare.at) / 1.4);
        g.fillStyle(JADE.glow, Math.min(1, 0.4 + 0.5 * k)).fillRect(d.x + d.w * 0.2, d.y + d.h * 0.3, d.w * 0.2, d.h * 0.06).fillRect(d.x + d.w * 0.6, d.y + d.h * 0.3, d.w * 0.2, d.h * 0.06);
        g.fillStyle(JADE.glow, 0.07 * k).fillCircle(d.x + d.w * 0.3, d.y + d.h * 0.33, 120).fillCircle(d.x + d.w * 0.7, d.y + d.h * 0.33, 120);
      },
    },
  },
  ambient(scene, region) {
    flare.at = -99;
    return jadeTheme.ambient!(scene, region);
  },
};

export function buildAzcalArena(): RegionDef {
  return arenaRegion({
    id: 'azcal_arena', name: 'Sunken Sanctum', theme: 'arena_azcal', width: 2300, boss: 'azcal', bossX: 1750, lampId: 'sanctum_arena', lampName: 'Sanctum Lamp',
    scale: { hp: 2.0, atk: 1.65 },
    // a ziggurat of floating slabs: climb the left flank, cross the crown, drop down the right
    platforms: [[740, 820, 200], [1000, 720, 200], [1260, 620, 240], [1580, 720, 200], [1840, 820, 200]],
    decorate(b) {
      b.add('idol_wall', 1050, 260, 520, 520);
      for (const x of [260, 900, 1700]) b.add('column', x, 140, 60, GROUND_Y - 140);
      b.add('altar', 1200, GROUND_Y - 70, 260, 70);
      for (const x of [420, 1180, 2000]) b.add('brazier', x, GROUND_Y, 40, 90);
      for (const x of [560, 1480, 2160]) b.add('torch', x, GROUND_Y, 20, 160);
      b.add('glyphfloor', 600, GROUND_Y, 1500, 0);
      b.add('vines', 700, 0, 80, 220, undefined, 'front'); b.add('vines', 1700, 0, 80, 280, undefined, 'front');
    },
  });
}
