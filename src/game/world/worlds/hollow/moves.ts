import type { BossApi, BossMove } from '@/game/config/boss-moves';
import { t } from '@/i18n';

const BLOOD = 0xff3b5c;
const lo = (a: BossApi): number => a.region.barrierX + 70;
const hi = (a: BossApi): number => a.region.width - 90;
const clampX = (a: BossApi, x: number): number => Math.max(lo(a), Math.min(hi(a), x));

/** Bats pour in from both walls in diving streams. */
const batSwarm: BossMove = (a) => {
  const waves = 2 + a.phase, events: [number, () => void][] = [];
  for (let w = 0; w < waves; w++) {
    events.push([w * 800, () => {
      const fromLeft = w % 2 === 0, x0 = fromLeft ? lo(a) : hi(a), dir = fromLeft ? 1 : -1;
      a.fx.ring(x0, a.boss.feetY - 480, BLOOD, 6, 60, 260, 3); a.sfx('whoosh');
      for (let i = 0; i < 4; i++) a.projectile({ x: x0, y: a.boss.feetY - 560 + i * 36, vx: dir * (260 + i * 24), vy: 90 + i * 40, ay: 260, w: 24, h: 12, color: 0x2a0f3a, attack: 'bat', life: 3200 });
    }]);
  }
  return { events, dur: waves * 800 + 1400, glow: BLOOD };
};

/** Crimson tendrils burst up under the player's feet, then lash along the floor after them. */
const bloodBind: BossMove = (a) => {
  const n = 3 + a.phase, events: [number, () => void][] = [];
  const dir = (): 1 | -1 => (a.player.cx > a.boss.cx ? 1 : -1);
  for (let i = 0; i < n; i++) {
    const x = clampX(a, a.player.cx + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 150);
    events.push([i * 300, () => { a.warn(a.rect(x - 40, a.boss.feetY - 220, 80, 220), 650, BLOOD); a.sfx('telegraph'); }]);
    events.push([i * 300 + 650, () => {
      const d = dir();
      a.hazard({ x, w: 70, h: 230, life: 1100, attack: 'tendril', color: 0x8a0f2a, vx: d * 120 });
      a.fx.ring(x, a.boss.feetY - 6, BLOOD, 8, 90, 300, 5); a.fx.debrisBurst(x, a.boss.feetY - 8, 8); a.sfx('slam');
    }]);
  }
  return { events, dur: n * 300 + 650 + 1500, glow: BLOOD };
};

/** A fan of slow blood-orbs spreads at head height, then closes. */
const crimsonOrbs: BossMove = (a) => {
  const rounds = 2 + (a.phase >= 3 ? 1 : 0), fan = 3 + a.phase, events: [number, () => void][] = [];
  for (let r = 0; r < rounds; r++) {
    events.push([r * 1000, () => { a.face(); a.warn(a.rect(a.boss.facing > 0 ? a.boss.cx : a.boss.cx - 900, a.boss.cy - 150, 900, 300), 600, BLOOD); a.sfx('telegraph'); }]);
    events.push([r * 1000 + 600, () => {
      const dir = a.boss.facing;
      for (let i = 0; i < fan; i++) {
        const u = fan === 1 ? 0 : i / (fan - 1) - 0.5;
        a.projectile({ x: a.boss.cx + dir * 40, y: a.boss.cy - 20, vx: dir * 330, vy: u * 380 + (a.player.cy - a.boss.cy) * 0.4, w: 28, h: 28, color: BLOOD, attack: 'orb', life: 3000 });
      }
      a.fx.ring(a.boss.cx + dir * 40, a.boss.cy - 20, BLOOD, 6, 70, 260, 4); a.sfx('zap');
    }]);
  }
  return { events, dur: rounds * 1000 + 600 + 1000, glow: BLOOD, pose: 'heavy' };
};

/** She dissolves into mist and rematerialises at the player's back with a double claw swipe. */
const mistStep: BossMove = (a) => {
  let tx = a.boss.cx;
  const events: [number, () => void][] = [
    [0, () => { a.hide(true); a.sfx('dash'); a.fx.ring(a.boss.cx, a.boss.cy, 0xb9a4d8, 10, 130, 300, 5); a.fx.dustPuff(a.boss.cx, a.boss.feetY, 10); }],
    [520, () => { tx = clampX(a, a.player.cx - a.player.facing * 160); a.warn(a.rect(tx - 120, a.boss.feetY - 140, 240, 140), 440, BLOOD); a.sfx('telegraph'); }],
    [960, () => { a.moveTo(tx); a.hide(false); a.face(); a.fx.ring(tx, a.boss.cy, BLOOD, 10, 140, 280, 5); a.strike('strike_claw'); }],
  ];
  return { events, dur: 1100 };
};

/** Phase 3 only: the blood moon drops its weight on the player's position. A long telegraph, a vast column. */
const moonfall: BossMove = (a) => {
  const x = clampX(a, a.player.cx), events: [number, () => void][] = [
    [0, () => { a.fx.text(x, a.boss.feetY - 700, t('MOONFALL'), '#ff7a96', 30, 1400); a.sfx('roar'); }],
    [200, () => { a.warn(a.rect(x - 150, a.boss.feetY - 700, 300, 700), 1100, BLOOD); a.sfx('telegraph'); }],
    [1300, () => { a.hazard({ x, w: 280, h: 700, life: 520, attack: 'moonfall', color: 0xffd0dc, shape: 'beam' }); a.fx.shake(0.02, 500); a.fx.ring(x, a.boss.feetY - 6, BLOOD, 20, 260, 500, 8); a.sfx('slam'); }],
  ];
  return { events, dur: 1300 + 900, end: 'exhausted', glow: BLOOD, pose: 'slam' };
};

export const mordaineMoves: Record<string, BossMove> = { bat_swarm: batSwarm, blood_bind: bloodBind, crimson_orbs: crimsonOrbs, mist_step: mistStep, moonfall };
