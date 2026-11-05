import type { BossApi, BossMove } from '@/game/config/boss-moves';
import { t } from '@/i18n';

const NEON = 0x56e0ff, MAG = 0xff4fd8;
const lo = (a: BossApi): number => a.region.barrierX + 70;
const hi = (a: BossApi): number => a.region.width - 90;
const clampX = (a: BossApi, x: number): number => Math.max(lo(a), Math.min(hi(a), x));

/** Wall-to-wall lasers at alternating heights, then (phase 2+) vertical bars sweep the floor. */
const laserGrid: BossMove = (a) => {
  const span = hi(a) - lo(a), cx = lo(a) + span / 2, events: [number, () => void][] = [];
  const row = (at: number, top: number, h: number, col: number): void => {
    events.push([at, () => { a.warn(a.rect(lo(a), a.boss.feetY - top - 4, span, h + 8), 700, col); a.sfx('telegraph'); }]);
    events.push([at + 700, () => { a.hazard({ x: cx, w: span, h, top: a.boss.feetY - top, life: 480, attack: 'laser', color: col, shape: 'beam' }); a.sfx('zap'); a.fx.shake(0.006, 200); }]);
  };
  row(0, 44, 26, NEON); row(1000, 165, 30, MAG);
  if (a.phase >= 2) {
    const n = 3 + a.phase;
    for (let i = 0; i < n; i++) {
      const x = clampX(a, a.player.cx + (i - (n - 1) / 2) * 200);
      events.push([2100 + i * 220, () => { a.warn(a.rect(x - 22, a.boss.feetY - 600, 44, 600), 600, MAG); a.sfx('telegraph'); }]);
      events.push([2100 + i * 220 + 600, () => { a.hazard({ x, w: 36, h: 600, life: 380, attack: 'laser', color: MAG, shape: 'beam' }); a.sfx('zap'); }]);
    }
  }
  return { events, dur: (a.phase >= 2 ? 2100 + (3 + a.phase) * 220 + 600 : 1700) + 900, glow: NEON, pose: 'heavy' };
};

/** A singularity opens at the boss: the player is dragged in while a dark orb swells. Break away before it detonates. */
const gravityWell: BossMove = (a) => {
  const dur = 2300 + a.phase * 250, cx = a.boss.cx;
  const events: [number, () => void][] = [
    [0, () => {
      a.fx.text(cx, a.boss.cy - 160, t('GRAVITY WELL'), '#d79bff', 26, 1200); a.sfx('roar');
      a.fx.ring(cx, a.boss.cy, MAG, 60, 280, dur, 6);
      a.hazard({ x: cx, w: 90, h: 90, top: a.boss.cy - 45, life: dur, attack: 'singularity', color: 0x9b5cff, shape: 'orb' });
      a.field(dur, (dt) => { const d = cx - a.player.cx; a.nudgePlayer(Math.sign(d) * Math.min(Math.abs(d), 175 * (dt / 1000))); });
    }],
    [dur, () => { a.hazard({ x: cx, w: 340, h: 260, life: 320, attack: 'blast', color: MAG }); a.fx.shake(0.016, 380); a.fx.ring(cx, a.boss.cy, 0xffffff, 20, 240, 360, 8); a.sfx('slam'); }],
  ];
  events.splice(1, 0, [dur - 520, () => { a.warn(a.rect(cx - 170, a.boss.feetY - 270, 340, 270), 520, MAG); a.sfx('telegraph'); }]);
  return { events, dur: dur + 900, end: 'exhausted', glow: MAG, pose: 'heavy' };
};

/** Attack drones dive from above while reinforcements drop in. */
const droneSwarm: BossMove = (a) => {
  const n = 3 + a.phase * 2, events: [number, () => void][] = [];
  if (a.phase >= 2) events.push([200, () => { a.summon('security_droid', a.player.cx + 520); a.fx.text(a.boss.cx, a.boss.cy - 150, t('REINFORCEMENTS!'), '#9ff0ff', 24, 1000); }]);
  for (let i = 0; i < n; i++) events.push([400 + i * 380, () => {
    const x = clampX(a, a.player.cx + (a.rand() - 0.5) * 460), dir = a.player.cx > x ? 1 : -1;
    a.fx.ring(x, a.boss.feetY - 540, NEON, 6, 40, 240, 3);
    a.projectile({ x, y: a.boss.feetY - 560, vx: dir * 140, vy: 260, ay: 700, w: 22, h: 22, color: NEON, attack: 'drone', life: 2400 });
    a.sfx('whoosh');
  }]);
  return { events, dur: 400 + n * 380 + 1200, glow: NEON };
};

/** Targeting lasers fix on the player; orbital cannon columns follow. */
const orbitalStrike: BossMove = (a) => {
  const n = 4 + a.phase, events: [number, () => void][] = [], xs: number[] = [];
  for (let i = 0; i < n; i++) {
    events.push([i * 360, () => { xs[i] = clampX(a, a.player.cx + (i === 0 ? 0 : (a.rand() - 0.5) * 640)); a.warn(a.rect(xs[i] - 55, a.boss.feetY - 640, 110, 640), 800, MAG); a.fx.text(xs[i], a.boss.feetY - 660, '⌖', '#ff7ae6', 34, 800); a.sfx('telegraph'); }]);
    events.push([i * 360 + 800, () => { a.hazard({ x: xs[i], w: 100, h: 640, life: 420, attack: 'strike_orbital', color: 0xffffff, shape: 'beam' }); a.fx.ring(xs[i], a.boss.feetY - 6, MAG, 10, 110, 300, 6); a.fx.shake(0.01, 240); a.sfx('zap'); }]);
  }
  return { events, dur: n * 360 + 800 + 900, glow: MAG };
};

/** Phase-shifts out and reappears at the player's back with a two-cut combo (the second cut chains from the first). */
const blinkStrike: BossMove = (a) => {
  let tx = a.boss.cx;
  const events: [number, () => void][] = [
    [0, () => { a.hide(true); a.sfx('dash'); a.fx.ring(a.boss.cx, a.boss.cy, NEON, 10, 120, 260, 4); }],
    [430, () => { tx = clampX(a, a.player.cx - a.player.facing * 170); a.warn(a.rect(tx - 130, a.boss.feetY - 140, 260, 140), 380, NEON); a.sfx('telegraph'); }],
    [810, () => { a.moveTo(tx); a.hide(false); a.face(); a.fx.ring(tx, a.boss.cy, NEON, 10, 140, 260, 5); a.strike('strike_slash'); }],
  ];
  return { events, dur: 1000 };
};

export const aegisMoves: Record<string, BossMove> = { laser_grid: laserGrid, gravity_well: gravityWell, drone_swarm: droneSwarm, orbital_strike: orbitalStrike, blink_strike: blinkStrike };
