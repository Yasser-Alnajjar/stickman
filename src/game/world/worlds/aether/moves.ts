import type { BossApi, BossMove } from '@/game/config/boss-moves';
import { t } from '@/i18n';

const BOLT = 0xfff6a0, WIND = 0xcfe6ff;
const lo = (a: BossApi): number => a.region.barrierX + 70;
const hi = (a: BossApi): number => a.region.width - 100;
const clampX = (a: BossApi, x: number): number => Math.max(lo(a), Math.min(hi(a), x));

/** Marked columns of lightning. The first is always on the player; the rest scatter. */
const lightningStrikes: BossMove = (a) => {
  const n = 4 + a.phase * 2, events: [number, () => void][] = [], xs: number[] = [];
  for (let i = 0; i < n; i++) {
    events.push([i * 320, () => { xs[i] = clampX(a, i === 0 ? a.player.cx : a.player.cx + (a.rand() - 0.5) * 760); a.warn(a.rect(xs[i] - 46, a.boss.feetY - 700, 92, 700), 700, BOLT); a.sfx('telegraph'); }]);
    events.push([i * 320 + 700, () => { a.hazard({ x: xs[i], w: 84, h: 700, life: 360, attack: 'bolt', color: BOLT, shape: 'beam' }); a.fx.bolt(xs[i], a.boss.feetY - 700, xs[i], a.boss.feetY, BOLT, 240); a.fx.ring(xs[i], a.boss.feetY - 6, BOLT, 10, 110, 300, 6); a.fx.shake(0.01, 200); a.sfx('zap'); }]);
  }
  return { events, dur: n * 320 + 700 + 900, glow: BOLT };
};

/** A fan of razor feathers from the Sovereign's wings while a gale shoves the player toward the wall. */
const galeBlades: BossMove = (a) => {
  const rounds = 2 + a.phase, fan = 3 + a.phase, events: [number, () => void][] = [];
  const dur = rounds * 820 + 700, away = Math.sign(a.player.cx - a.boss.cx) || 1;
  events.push([0, () => { a.fx.text(a.boss.cx, a.boss.cy - 150, t('GALE FORCE'), '#e8f4ff', 28, 1200); a.sfx('roar'); a.field(dur, (dt) => a.nudgePlayer(away * 105 * (dt / 1000))); }]);
  for (let r = 0; r < rounds; r++) {
    events.push([300 + r * 820, () => { a.face(); a.warn(a.rect(a.boss.facing > 0 ? a.boss.cx : a.boss.cx - 1000, a.boss.cy - 160, 1000, 320), 480, WIND); a.sfx('telegraph'); }]);
    events.push([780 + r * 820, () => {
      const dir = a.boss.facing;
      for (let i = 0; i < fan; i++) { const u = fan === 1 ? 0 : i / (fan - 1) - 0.5; a.projectile({ x: a.boss.cx + dir * 40, y: a.boss.cy - 20, vx: dir * 640, vy: u * 560 + (a.player.cy - a.boss.cy) * 0.3, w: 34, h: 10, color: WIND, attack: 'feather', life: 2200 }); }
      a.fx.ring(a.boss.cx + dir * 40, a.boss.cy - 20, WIND, 6, 80, 260, 4); a.sfx('whoosh');
    }]);
  }
  return { events, dur: dur + 600, end: 'exhausted', glow: WIND, pose: 'heavy' };
};

/** The Sovereign soars out of sight and plummets on the player's position: a long warning, a massive impact. */
const skyDive: BossMove = (a) => {
  let tx = a.boss.cx;
  const events: [number, () => void][] = [
    [0, () => { a.hide(true); a.sfx('dash'); a.fx.ring(a.boss.cx, a.boss.cy, WIND, 10, 140, 300, 5); }],
    [500, () => { tx = clampX(a, a.player.cx); a.warn(a.rect(tx - 130, a.boss.feetY - 150, 260, 150), 900, BOLT); a.fx.text(tx, a.boss.feetY - 180, '▼', '#fff6a0', 40, 900); a.sfx('telegraph'); }],
    [1400, () => {
      a.moveTo(tx); a.hide(false); a.face();
      a.hazard({ x: tx, w: 260, h: 150, life: 300, attack: 'dive', color: 0xffffff });
      for (const d of [-1, 1] as const) a.hazard({ x: tx + d * 160, w: 70, h: 56, life: 1200, attack: 'gust_wave', color: WIND, vx: d * 420, shape: 'orb' });
      a.fx.ring(tx, a.boss.feetY - 10, BOLT, 20, 240, 420, 8); a.fx.shake(0.02, 500); a.fx.debrisBurst(tx, a.boss.feetY - 8, 24); a.sfx('slam');
    }],
  ];
  return { events, dur: 1400 + 700, end: 'exhausted' };
};

/** Three storm-orbs sweep the arena on crossing paths: low, mid and high. */
const stormOrbs: BossMove = (a) => {
  const n = 2 + a.phase, events: [number, () => void][] = [];
  for (let i = 0; i < n; i++) {
    const fromRight = i % 2 === 0, x0 = fromRight ? hi(a) : lo(a), dir: 1 | -1 = fromRight ? -1 : 1, top = [36, 110, 170][i % 3], speed = 330 + i * 40, travel = hi(a) - lo(a);
    events.push([i * 650, () => { a.warn(a.rect(Math.min(x0, x0 + dir * 300) - 20, a.boss.feetY - top - 44, 320, 88), 600, BOLT); a.fx.text(x0, a.boss.feetY - top - 60, '⚡', '#fff6a0', 30, 600); a.sfx('telegraph'); }]);
    events.push([i * 650 + 600, () => { a.hazard({ x: x0, w: 80, h: 80, top: a.boss.feetY - top - 40, life: (travel / speed) * 1000, attack: 'orb', color: BOLT, vx: dir * speed, shape: 'orb' }); a.sfx('zap'); }]);
  }
  return { events, dur: n * 650 + 600 + (hi(a) - lo(a)) / 360 * 1000, glow: BOLT };
};

/** The final storm: lightning marked in rows while a gale pushes and razors fly. Phase 3 only. */
const tempest: BossMove = (a) => {
  const dur = 4600, away = Math.sign(a.player.cx - a.boss.cx) || 1, events: [number, () => void][] = [], xs: number[] = [];
  events.push([0, () => { a.fx.text(a.boss.cx, a.boss.cy - 160, t('TEMPEST'), '#fff6a0', 34, 1600); a.fx.ring(a.boss.cx, a.boss.cy, BOLT, 20, 320, 800, 8); a.sfx('roar'); a.field(dur, (dt) => a.nudgePlayer(away * 85 * (dt / 1000))); }]);
  for (let i = 0; i < 6; i++) {
    events.push([600 + i * 520, () => { xs[i] = clampX(a, a.player.cx + (i % 2 ? 1 : -1) * (80 + i * 55)); a.warn(a.rect(xs[i] - 42, a.boss.feetY - 700, 84, 700), 650, BOLT); a.sfx('telegraph'); }]);
    events.push([600 + i * 520 + 650, () => { a.hazard({ x: xs[i], w: 78, h: 700, life: 340, attack: 'bolt', color: BOLT, shape: 'beam' }); a.fx.bolt(xs[i], a.boss.feetY - 700, xs[i], a.boss.feetY, BOLT, 220); a.sfx('zap'); }]);
  }
  for (let i = 0; i < 3; i++) events.push([1200 + i * 1100, () => { a.face(); const dir = a.boss.facing; for (let k = 0; k < 4; k++) a.projectile({ x: a.boss.cx + dir * 40, y: a.boss.cy - 30 + k * 18, vx: dir * 560, vy: (k - 1.5) * 150, w: 30, h: 10, color: WIND, attack: 'feather', life: 2000 }); a.sfx('whoosh'); }]);
  return { events, dur: dur + 800, end: 'exhausted', glow: BOLT, pose: 'slam' };
};

export const zephyrosMoves: Record<string, BossMove> = { lightning_strikes: lightningStrikes, gale_blades: galeBlades, sky_dive: skyDive, storm_orbs: stormOrbs, tempest };
