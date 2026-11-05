import type { BossApi, BossMove } from '@/game/config/boss-moves';
import { t } from '@/i18n';

const BRASS = 0xffb347;
const lo = (a: BossApi): number => a.region.barrierX + 70;
const hi = (a: BossApi): number => a.region.width - 100;

/** Pistons slam in a left-to-right rhythm: tick, tick, tick. In later phases they alternate: tick-TOCK (stand in the gaps). */
const pistonCrush: BossMove = (a) => {
  const n = 7, step = (hi(a) - lo(a)) / n, events: [number, () => void][] = [];
  const xs = Array.from({ length: n }, (_, i) => lo(a) + step * (i + 0.5));
  const slam = (x: number, at: number): void => {
    events.push([at, () => { a.warn(a.rect(x - 52, a.boss.feetY - 300, 104, 300), 620, BRASS); a.sfx('telegraph'); }]);
    events.push([at + 620, () => { a.hazard({ x, w: 96, h: 300, life: 340, attack: 'piston', color: 0xb4623a }); a.fx.shake(0.01, 220); a.fx.debrisBurst(x, a.boss.feetY - 8, 8); a.sfx('slam'); }]);
  };
  if (a.phase === 1) xs.forEach((x, i) => slam(x, i * 280));
  else {
    xs.forEach((x, i) => { if (i % 2 === 0) slam(x, 0); });
    xs.forEach((x, i) => { if (i % 2 === 1) slam(x, 1050); });
    if (a.phase >= 3) xs.forEach((x, i) => { if (i % 2 === 0) slam(x, 2100); });
  }
  const end = a.phase === 1 ? n * 280 + 620 : a.phase === 2 ? 1050 + 620 : 2100 + 620;
  return { events, dur: end + 800, glow: BRASS, pose: 'slam' };
};

/** Circular saws roll in along the floor. Jump the blades. */
const gearSaw: BossMove = (a) => {
  const n = 1 + a.phase, events: [number, () => void][] = [];
  for (let i = 0; i < n; i++) {
    const fromRight = i % 2 === 0, x0 = fromRight ? hi(a) : lo(a), dir: 1 | -1 = fromRight ? -1 : 1, speed = 340 + i * 50, travel = hi(a) - lo(a);
    events.push([i * 750, () => { a.warn(a.rect(Math.min(x0, x0 + dir * 280) - 20, a.boss.feetY - 90, 320, 90), 650, BRASS); a.fx.text(x0, a.boss.feetY - 120, '⚙', '#ffc870', 34, 650); a.sfx('telegraph'); }]);
    events.push([i * 750 + 650, () => { a.hazard({ x: x0, w: 84, h: 84, life: (travel / speed) * 1000, attack: 'saw', color: 0xd9dde6, vx: dir * speed, shape: 'orb' }); a.sfx('whoosh'); }]);
  }
  return { events, dur: n * 750 + 650 + (hi(a) - lo(a)) / 340 * 1000 * 0.9, pose: 'slam', glow: BRASS };
};

/** Steam vents erupt in a travelling wave from the boss's side to the far wall. */
const steamVents: BossMove = (a) => {
  const dir = a.boss.facing, n = 7, step = 190, events: [number, () => void][] = [];
  for (let i = 1; i <= n; i++) {
    const x = a.boss.cx + dir * i * step;
    if (x < lo(a) || x > hi(a)) continue;
    events.push([i * 200, () => { a.warn(a.rect(x - 28, a.boss.feetY - 340, 56, 340), 640, 0xe9e4d6); a.sfx('telegraph'); }]);
    events.push([i * 200 + 640, () => { a.hazard({ x, w: 54, h: 340, life: 460, attack: 'steam', color: 0xe9e4d6, shape: 'beam' }); a.fx.dustPuff(x, a.boss.feetY, 6); a.sfx('whoosh'); }]);
  }
  return { events, dur: n * 200 + 640 + 900, glow: 0xe9e4d6 };
};

/** Time-bombs tick down under the player's feet, then detonate as wide columns. Keep moving. */
const timeBomb: BossMove = (a) => {
  const n = 2 + a.phase, events: [number, () => void][] = [], xs: number[] = [];
  for (let i = 0; i < n; i++) {
    events.push([i * 420, () => {
      xs[i] = Math.max(lo(a), Math.min(hi(a), a.player.cx + (a.rand() - 0.5) * 300));
      a.hazard({ x: xs[i], w: 40, h: 40, top: a.boss.feetY - 40, life: 1100, attack: 'bomb', color: BRASS, shape: 'orb' });
      a.warn(a.rect(xs[i] - 120, a.boss.feetY - 280, 240, 280), 1100, BRASS); a.fx.text(xs[i], a.boss.feetY - 70, String(1), '#ffc870', 22, 1100); a.sfx('telegraph');
    }]);
    events.push([i * 420 + 1100, () => { a.hazard({ x: xs[i], w: 230, h: 280, life: 360, attack: 'blast', color: 0xff6a2a }); a.fx.shake(0.014, 300); a.fx.ring(xs[i], a.boss.feetY - 20, 0xff6a2a, 10, 150, 340, 7); a.sfx('slam'); }]);
  }
  return { events, dur: n * 420 + 1100 + 900, end: a.phase >= 2 ? 'exhausted' : 'pause', glow: BRASS, pose: 'heavy' };
};

/** The Clockmaster winds himself up: two clockwork soldiers answer the call. */
const windUp: BossMove = (a) => {
  const events: [number, () => void][] = [
    [0, () => { a.fx.text(a.boss.cx, a.boss.cy - 150, t('WINDING UP'), '#ffc870', 26, 1200); a.fx.ring(a.boss.cx, a.boss.cy, BRASS, 20, 180, 700, 6); a.sfx('roar'); }],
    [700, () => { a.summon('clockwork_soldier', a.player.cx + 480); a.summon('spring_runner', a.player.cx - 480); }],
  ];
  return { events, dur: 1800, glow: BRASS, pose: 'heavy' };
};

export const horolMoves: Record<string, BossMove> = { piston_crush: pistonCrush, gear_saw: gearSaw, steam_vents: steamVents, time_bomb: timeBomb, wind_up: windUp };
