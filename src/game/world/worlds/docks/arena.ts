import Phaser from 'phaser';
import type { RegionDef } from '@/game/config/regions';
import type { AmbientParticles, BackdropArt, BackdropFrame, WorldTheme } from '../../types';
import { GROUND_Y, arenaRegion, hash, mulberry32, rainLayer, vgrad } from '../../kit';
import { CONTAINER_COLORS, DOCK, docksTheme, drawContainer, triggerSurge } from './theme';

/**
 * TYRANT QUAY: the same harbour in a gale. A wall of rust-red freighter, storm-lashed sea beating at the quay,
 * towering cranes with swinging loads, lightning, and cargo-sling platforms.
 */

type Ctx = CanvasRenderingContext2D;

const storm = { flash: -99 };

function stormFar(c: Ctx, w: number, h: number): void {
  const hy = h - 200;
  vgrad(c, 0, 0, w, hy, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(120,150,150,0.25)']]);
  vgrad(c, 0, hy, w, h - hy, [[0, '#33474c'], [0.25, '#1b3038'], [1, '#0b1a22']]);
  const r = mulberry32(19);
  // whitecaps
  for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(214,232,232,${0.1 + r() * 0.3})`; c.fillRect(r() * w, hy + 6 + r() * 190, 8 + r() * 36, 1.6); }
  // colossal ship wall (bow on the right) occupying the whole horizon
  const sx = 60, sw = 1500, sy = hy - 215;
  c.fillStyle = '#16191f'; c.fillRect(sx, sy + 190, sw, 30);
  c.fillStyle = '#5a1f1c'; c.beginPath(); c.moveTo(sx, sy + 190); c.lineTo(sx + sw, sy + 190); c.lineTo(sx + sw + 120, sy); c.lineTo(sx, sy); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = sx; x < sx + sw; x += 5) c.fillRect(x, sy, 1.5, 190);
  c.fillStyle = 'rgba(255,215,144,0.5)'; for (let x = sx + 30; x < sx + sw; x += 60) { c.beginPath(); c.arc(x, sy + 50, 6, 0, 7); c.fill(); }
  for (let cx = sx + 20, ci = 0; cx < sx + sw - 330; cx += 62, ci++) for (let k = 0; k < 2 + Math.floor(r() * 3); k++) { c.fillStyle = ['#7a3a22', '#2c5558', '#6a2a28', '#7a6420', '#2a4666'][Math.floor(r() * 5)]; c.fillRect(cx, sy - 8 - k * 28, 58, 26); }
  c.fillStyle = '#d8d0c0'; c.fillRect(sx + sw - 290, sy - 120, 150, 120); c.fillRect(sx + sw - 270, sy - 170, 110, 52); c.fillStyle = '#ffd790'; c.fillRect(sx + sw - 262, sy - 154, 94, 14);
  c.fillStyle = '#a8532b'; c.fillRect(sx + sw - 120, sy - 100, 50, 100);
  vgrad(c, 0, hy - 60, w, 100, [[0, 'rgba(120,150,150,0)'], [0.6, 'rgba(120,150,150,0.30)'], [1, 'rgba(120,150,150,0)']]);
}

function stormMid(c: Ctx, w: number, h: number): void {
  const r = mulberry32(72);
  for (let x = 0; x < w; x += 150 + r() * 150) { // stacked cargo walls and tall derricks
    const cols = 1 + Math.floor(r() * 3), rows = 3 + Math.floor(r() * 5);
    for (let ci = 0; ci < cols; ci++) for (let ri = 0; ri < rows; ri++) {
      c.fillStyle = ['#4a2a1a', '#1f3a3c', '#46201c', '#4a3f18', '#1c2e48'][Math.floor(r() * 5)]; c.fillRect(x + ci * 44, h - (ri + 1) * 24, 42, 22);
      c.fillStyle = 'rgba(0,0,0,0.3)'; for (let rx = x + ci * 44 + 4; rx < x + ci * 44 + 40; rx += 5) c.fillRect(rx, h - (ri + 1) * 24 + 2, 1.5, 18);
    }
  }
  c.strokeStyle = '#0b1218'; c.fillStyle = '#0b1218'; c.lineWidth = 6;
  for (let x = 180; x < w; x += 640) { c.fillRect(x, h - 320, 14, 320); c.fillRect(x - 110, h - 320, 260, 10); c.beginPath(); c.moveTo(x + 7, h - 320); c.lineTo(x + 7, h - 190); c.stroke(); c.fillRect(x - 6, h - 196, 26, 12); }
  c.fillStyle = 'rgba(8,20,30,0.45)'; c.globalCompositeOperation = 'source-atop'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
}

function stormNear(c: Ctx, w: number, h: number): void {
  const r = mulberry32(5);
  c.fillStyle = '#05080b'; c.strokeStyle = '#05080b';
  for (let x = 200; x < w; x += 560 + r() * 300) {
    c.fillRect(x, h - 480, 40, 480); c.fillRect(x + 150, h - 480, 40, 480); c.fillRect(x - 30, h - 500, 250, 24);
    c.lineWidth = 6; c.beginPath(); c.moveTo(x + 40, h - 460); c.lineTo(x + 150, h - 40); c.moveTo(x + 150, h - 460); c.lineTo(x + 40, h - 40); c.stroke();
    c.fillStyle = 'rgba(255,150,70,0.7)'; c.fillRect(x + 4, h - 480, 3, 450); c.fillStyle = '#05080b';
  }
}

const art: BackdropArt = {
  sky: [[0, '#0d1820'], [0.5, '#24363e'], [0.85, '#415a5e'], [1, '#6f7e76']],
  far: { w: 2048, h: 520, draw: stormFar },
  mid: { w: 2048, h: 420, draw: stormMid },
  near: { w: 2048, h: 660, draw: stormNear },
};

function backdropFx(g: Phaser.GameObjects.Graphics, f: BackdropFrame): void {
  g.clear();
  const { w, h, zoom, t } = f;
  // rolling cloud banks
  for (let i = 0; i < 6; i++) {
    const cx = ((hash(i) * w * 1.3 + t * (10 + i * 3) * zoom) % (w * 1.3)) - w * 0.15;
    g.fillStyle(0x101c22, 0.5).fillEllipse(cx, h * (0.06 + 0.07 * (i % 3)), 520 * zoom, 90 * zoom);
  }
  // forked lightning every ~7s
  const cyc = t % 7;
  if (cyc < 0.35) {
    const lx = w * (0.25 + 0.5 * hash(Math.floor(t / 7)));
    g.fillStyle(0xd8f4ff, 0.22 * (1 - cyc / 0.35)).fillRect(0, 0, w, h);
    g.lineStyle(3 * zoom, 0xf0fbff, 1).beginPath().moveTo(lx, 0);
    let px = lx, py = 0;
    for (let i = 0; i < 9; i++) { px += (hash(i + Math.floor(t / 7) * 9) - 0.5) * 70 * zoom; py += h * 0.07; g.lineTo(px, py); }
    g.strokePath();
    storm.flash = t;
  }
  // wave crests heaving beyond the quay
  g.fillStyle(0xdff0f0, 0.25);
  for (let i = 0; i < 20; i++) {
    const wx = ((hash(i) * w + t * 24 * zoom) % w);
    g.fillRect(wx, f.sy(0.1, 0.88, 6 + hash(i + 2) * 150) + Math.sin(t * 2 + i) * 2 * zoom, (30 + hash(i + 3) * 70) * zoom, 2.5 * zoom);
  }
}

export const marrowTheme: WorldTheme = {
  ...docksTheme,
  id: 'arena_marrow',
  accent: 0xff9a3a,
  backdrop: art,
  backdropFx,
  bed: {
    top: GROUND_Y + 36,
    draw(g, x0, x1, t) {
      const top = docksTheme.bed!.top;
      docksTheme.bed!.draw(g, x0, x1, t);
      // heavier swell: tall wave crests with foam lapping at the pilings
      g.fillStyle(0x24505e, 1);
      g.beginPath(); g.moveTo(x0, top + 50);
      for (let x = x0; x <= x1; x += 24) g.lineTo(x, top - 4 + Math.sin(x * 0.02 + t * 2.4) * 9 + Math.sin(x * 0.047 + t * 1.7) * 5);
      g.lineTo(x1, top + 60); g.lineTo(x0, top + 60); g.closePath(); g.fillPath();
      g.fillStyle(0xe6f4f4, 0.75);
      for (let x = Math.floor(x0 / 36) * 36; x < x1; x += 36) g.fillRect(x, top - 6 + Math.sin(x * 0.02 + t * 2.4) * 9 + Math.sin(x * 0.047 + t * 1.7) * 5, 14 + hash(x) * 10, 3);
    },
  },
  stage: {
    flash: [255, 160, 70],
    onStart({ scene, region, fx }) {
      // freighter horn, a surge of water over the lip of the quay and spray along the pier
      triggerSurge(scene.time.now / 1000);
      scene.cameras.main.flash(420, 255, 170, 80);
      fx.shake(0.016, 900);
      for (let i = 0; i < 6; i++) scene.time.delayedCall(i * 140, () => fx.debrisBurst(280 + i * 330, GROUND_Y + 20, 14));
      fx.text(region.boss ? region.boss.x - 200 : 1500, 560, 'HORN!', '#ffb36b', 30, 1200);
      scene.tweens.addCounter({ from: 0, to: 1, duration: 600, onUpdate: () => undefined });
    },
    drawBarrier(g, x, h) { // portcullis of chained steel bars
      g.fillStyle(0x15171c, 0.95).fillRect(x - 16, 0, 32, h);
      g.fillStyle(DOCK.mustard, 1);
      for (let y = 0; y < h; y += 44) g.fillTriangle(x - 16, y + 22, x + 16, y, x + 16, y + 22);
      g.fillStyle(0xff9a3a, 0.35).fillRect(x - 32, 0, 64, h);
      g.lineStyle(4, 0xc9b88a, 0.9);
      for (let y = 0; y < h; y += 16) g.strokeEllipse(x + 22, y + 8, 7, 14);
    },
  },

  drawLedge(g, o) { // cargo pallet slung from crane cables, with a few crates on top of the netting
    g.fillStyle(DOCK.wood, 1).fillRect(o.x, o.y, o.w, 10);
    g.fillStyle(0xc9b88a, 0.5).fillRect(o.x, o.y, o.w, 2);
    g.fillStyle(DOCK.woodDark, 1);
    for (let x = o.x + 4; x < o.x + o.w; x += 22) g.fillRect(x, o.y + 10, 12, 10);
    g.fillStyle(0x000000, 0.4);
    for (let x = o.x + 22; x < o.x + o.w; x += 22) g.fillRect(x - 1, o.y, 1, 10);
    g.lineStyle(3, 0x0d0f12, 0.9);
    for (const ex of [o.x + 2, o.x + o.w - 2]) g.lineBetween(ex, o.y + 4, o.x + o.w / 2, o.y - 130);
    g.fillStyle(0x0d0f12, 1).fillCircle(o.x + o.w / 2, o.y - 132, 7);
    g.lineStyle(2, 0x0d0f12, 0.7).strokeCircle(o.x + o.w / 2, o.y - 142, 10);
    g.lineStyle(2, 0xc9b88a, 0.8);
    for (let x = o.x + 8; x < o.x + o.w; x += 22) g.lineBetween(x, o.y + 20, x + 8, o.y + 34);
  },

  ambient(scene): AmbientParticles {
    const base = docksTheme.ambient!(scene, {} as RegionDef);
    const rain = rainLayer(scene, { n: 140, color: 0xcfe4ea, alpha: 0.32, vx: 320, speed: 1100, len: 26 });
    const wash = scene.add.graphics().setDepth(69);
    return {
      update(dt, view, t) {
        base.update(dt, view, t);
        rain.update(view, t);
        wash.clear();
        const k = Math.max(0, 1 - (t - storm.flash) / 0.4);
        if (k > 0) wash.fillStyle(0xd8f4ff, 0.12 * k).fillRect(view.left, view.top, view.width, view.height);
      },
    };
  },

  drawDecor(g, d, ctx) {
    if (d.kind === 'cargo_wall') { // heavy, tidy stacks: the boss's backdrop
      for (let ri = 0; ri < d.h / 46; ri++) for (let ci = 0; ci < d.w / 126; ci++) {
        drawContainer(g, d.x + ci * 126, d.y + d.h - (ri + 1) * 46, 124, 44, CONTAINER_COLORS[Math.floor(hash(d.seed + ri * 7 + ci * 3) * CONTAINER_COLORS.length)], d.seed + ri + ci);
      }
      g.fillStyle(0x000000, 0.22).fillRect(d.x, d.y, d.w, d.h);
      return;
    }
    if (d.kind === 'rope') { // mooring line from quay bollard up to the ship
      g.lineStyle(6, 0xc9b88a, 0.9).beginPath().moveTo(d.x, d.y);
      for (let s = 1; s <= 16; s++) { const u = s / 16; g.lineTo(d.x + d.w * u, d.y - d.h * u + Math.sin(u * Math.PI) * 24); }
      g.strokePath();
      return;
    }
    docksTheme.drawDecor(g, d, ctx);
  },
};

export function buildTyrantArena(): RegionDef {
  return arenaRegion({
    id: 'tyrant_arena', name: 'Tyrant Quay', theme: 'arena_marrow', width: 2300, boss: 'marrow', bossX: 1750, lampId: 'quay', lampName: 'Quay Lamp',
    scale: { hp: 1.3, atk: 1.2 },
    // cargo slings climbing in a pyramid toward the crane cab, then dropping to a wing platform
    platforms: [[740, 830, 200], [1000, 720, 220], [1300, 610, 300], [1700, 740, 220], [1980, 840, 200]],
    back: { to: 'docks', spawn: 'from_east' }, next: { to: 'foundry', spawn: 'from_west', label: 'FOUNDRY' },
    decorate(b) {
      b.add('ship', 120, GROUND_Y - 420, 1800, 460);
      b.add('cargo_wall', 1780, 560, 500, GROUND_Y - 560);
      b.add('crane', 480, GROUND_Y, 300, 600);
      b.add('crane', 1250, GROUND_Y, 260, 520);
      for (const x of [300, 900, 1500, 2100]) b.add('lamp', x, GROUND_Y, 20, 200);
      for (const [x, tx] of [[700, 1000], [1500, 1700]] as [number, number][]) { b.add('bollard', x, GROUND_Y, 26, 40); b.add('rope', x + 13, GROUND_Y - 38, tx - x, 300); }
      b.add('bollard', 2150, GROUND_Y, 26, 40);
      b.add('barrels', 1100, GROUND_Y, 100, 74); b.add('barrels', 2000, GROUND_Y, 100, 74);
      b.add('sign', 900, 340, 190, 44, 'QUAY 7');
      b.add('welder', 560, 700, 24, 8);
      for (const x of [820, 1650]) b.add('chain', x, 0, 0, 250, undefined, 'front');
    },
  });
}
