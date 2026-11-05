import type { BossApi, BossMove } from '@/game/config/boss-moves';
import { t } from '@/i18n';

const SAND = 0xf2c84a;
const lo = (a: BossApi): number => a.region.barrierX + 70;
const hi = (a: BossApi): number => a.region.width - 100;

/** Two sand-devils tear across the hall toward the player. Jump them. */
const sandTornado: BossMove = (a) => {
  const n = 1 + Math.min(2, a.phase), events: [number, () => void][] = [];
  for (let i = 0; i < n; i++) {
    const fromRight = i % 2 === 0;
    const x0 = fromRight ? hi(a) : lo(a), dir: 1 | -1 = fromRight ? -1 : 1;
    const speed = 300 + a.phase * 40 + i * 30, travel = hi(a) - lo(a);
    events.push([i * 1000, () => { a.warn(a.rect(Math.min(x0, x0 + dir * 300) - 30, a.boss.feetY - 140, 340, 140), 800, SAND); a.fx.text(x0, a.boss.feetY - 170, '≈', '#ffd27a', 40, 800); a.sfx('telegraph'); }]);
    events.push([i * 1000 + 800, () => { a.hazard({ x: x0, w: 100, h: 130, life: (travel / speed) * 1000, attack: 'tornado', color: 0xe8b86a, vx: dir * speed, shape: 'orb' }); a.sfx('whoosh'); a.fx.shake(0.008, 260); }]);
  }
  return { events, dur: n * 1000 + 800 + (hi(a) - lo(a)) / 330 * 1000, pose: 'slam' };
};

/** The floor liquefies and drags the player to the boss's feet, where a spike of sand waits. Run or jump away. */
const quicksand: BossMove = (a) => {
  const dur = 2000 + a.phase * 300, cx = a.boss.cx;
  const events: [number, () => void][] = [
    [0, () => {
      a.fx.text(cx, a.boss.cy - 150, t('QUICKSAND!'), '#ffd27a', 28, 1200); a.sfx('roar');
      a.fx.ring(cx, a.boss.feetY - 6, SAND, 40, 260, dur, 6);
      a.field(dur, (dt) => { const d = cx - a.player.cx; a.nudgePlayer(Math.sign(d) * Math.min(Math.abs(d), 190 * (dt / 1000))); });
    }],
    [dur - 500, () => { a.warn(a.rect(cx - 170, a.boss.feetY - 220, 340, 220), 500, SAND); a.sfx('telegraph'); }],
    [dur, () => {
      a.hazard({ x: cx, w: 320, h: 230, life: 360, attack: 'maw', color: 0xe8b86a });
      a.fx.debrisBurst(cx, a.boss.feetY - 8, 22); a.fx.shake(0.014, 320); a.sfx('slam');
    }],
  ];
  return { events, dur: dur + 900, end: 'exhausted', glow: SAND, pose: 'heavy' };
};

/** Scarabs pour from the ceiling in waves. */
const scarabSwarm: BossMove = (a) => {
  const waves = 2 + a.phase, events: [number, () => void][] = [];
  for (let w = 0; w < waves; w++) {
    events.push([w * 900, () => {
      const base = a.player.cx + (a.rand() - 0.5) * 240;
      for (let i = 0; i < 5; i++) {
        const x = Math.max(lo(a), Math.min(hi(a), base + (i - 2) * 95 + (a.rand() - 0.5) * 30));
        a.projectile({ x, y: a.boss.feetY - 640, vx: (a.rand() - 0.5) * 60, vy: 120, ay: 900, w: 20, h: 14, color: 0x2fb8a6, attack: 'scarab', life: 3000 });
      }
      a.fx.ring(base, a.boss.feetY - 560, SAND, 10, 80, 300, 4); a.sfx('whoosh');
    }]);
  }
  return { events, dur: waves * 900 + 1500, glow: SAND };
};

/** The Sovereign vanishes into the sand, resurfaces beside the player and thrusts a golden spear. */
const solarLance: BossMove = (a) => {
  let tx = a.boss.cx;
  const events: [number, () => void][] = [
    [0, () => { a.hide(true); a.sfx('dash'); a.fx.ring(a.boss.cx, a.boss.cy, SAND, 10, 130, 300, 5); a.fx.dustPuff(a.boss.cx, a.boss.feetY, 10); }],
    [650, () => {
      const side = a.player.facing === 1 ? -1 : 1;
      tx = Math.max(lo(a), Math.min(hi(a), a.player.cx + side * 190));
      a.warn(a.rect(tx - 150, a.boss.feetY - 150, 300, 150), 480, SAND); a.fx.text(tx, a.boss.feetY - 170, '!!', '#ffd27a', 36, 480); a.sfx('telegraph');
    }],
    [1130, () => { a.moveTo(tx); a.hide(false); a.face(); a.fx.ring(tx, a.boss.cy, SAND, 10, 150, 300, 6); a.strike('strike_lance'); }],
  ];
  return { events, dur: 1300 };
};

/** Pillars of sunlight crash down in a staggered line. */
const sunRays: BossMove = (a) => {
  const n = 3 + a.phase, events: [number, () => void][] = [];
  const xs: number[] = [];
  for (let i = 0; i < n; i++) {
    events.push([i * 330, () => {
      const x = Math.max(lo(a), Math.min(hi(a), a.player.cx + (i === 0 ? 0 : (a.rand() - 0.5) * 520)));
      xs[i] = x; a.warn(a.rect(x - 50, a.boss.feetY - 620, 100, 620), 750, 0xffe9a0); a.sfx('telegraph');
    }]);
    events.push([i * 330 + 750, () => {
      a.hazard({ x: xs[i], w: 90, h: 620, life: 420, attack: 'ray', color: 0xfff0b0, shape: 'beam' });
      a.fx.ring(xs[i], a.boss.feetY - 6, SAND, 10, 100, 300, 5); a.sfx('zap');
    }]);
  }
  return { events, dur: n * 330 + 750 + 900, glow: 0xfff0b0 };
};

export const khamsinMoves: Record<string, BossMove> = { sand_tornado: sandTornado, quicksand, scarab_swarm: scarabSwarm, solar_lance: solarLance, sun_rays: sunRays };
