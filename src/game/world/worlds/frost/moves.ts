import type { BossApi, BossMove } from '@/game/config/boss-moves';
import { t } from '@/i18n';

const ICE = 0x8fe8ff;
const lo = (a: BossApi): number => a.region.barrierX + 70;
const hi = (a: BossApi): number => a.region.width - 90;
const clampX = (a: BossApi, x: number): number => Math.max(lo(a), Math.min(hi(a), x));

/** A ring of ice spikes radiates both ways from the boss, row after row. Keep moving and jump the gaps. */
const frostNova: BossMove = (a) => {
  const rows = 3 + a.phase, step = 190, events: [number, () => void][] = [];
  const cx = a.boss.cx;
  for (let i = 1; i <= rows; i++) {
    for (const d of [-1, 1] as const) {
      const x = cx + d * i * step;
      if (x < lo(a) || x > hi(a)) continue;
      events.push([i * 240, () => { a.warn(a.rect(x - 45, a.boss.feetY - 280, 90, 280), 600, ICE); a.sfx('telegraph'); }]);
      events.push([i * 240 + 600, () => {
        a.hazard({ x, w: 80, h: 290, life: 340, attack: 'spike', color: 0xcdeaf7 });
        a.fx.ring(x, a.boss.feetY - 6, ICE, 8, 90, 300, 5); a.fx.debrisBurst(x, a.boss.feetY - 8, 8); a.sfx('slam');
      }]);
    }
  }
  events.unshift([0, () => { a.fx.ring(cx, a.boss.cy, ICE, 20, 200, 500, 6); a.sfx('roar'); }]);
  return { events, dur: rows * 240 + 600 + 800, glow: ICE, pose: 'slam' };
};

/** Icicles break loose from the ceiling and plummet onto marked spots. */
const icicleStorm: BossMove = (a) => {
  const n = 4 + a.phase * 2, events: [number, () => void][] = [];
  const base = a.player.cx;
  for (let i = 0; i < n; i++) {
    const x = clampX(a, base + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 140 + (a.rand() - 0.5) * 60);
    events.push([i * 260, () => { a.warn(a.rect(x - 28, a.boss.feetY - 100, 56, 100), 800, ICE); a.fx.text(x, a.boss.feetY - 120, '▼', '#bfefff', 26, 800); a.sfx('telegraph'); }]);
    events.push([i * 260 + 800, () => {
      const drop = 760;
      a.hazard({ x, w: 34, h: 92, top: a.boss.feetY - 92 - drop, life: (drop / 1250) * 1000 + 120, attack: 'icicle', color: 0xdff6ff, vy: 1250 });
      a.sfx('whoosh');
    }]);
  }
  return { events, dur: n * 260 + 800 + 1000, glow: ICE };
};

/** A howling blizzard shoves the player toward the wall while slow frost-orbs drift in. */
const blizzard: BossMove = (a) => {
  const dur = 2800 + a.phase * 400;
  const away = Math.sign(a.player.cx - a.boss.cx) || 1;
  const events: [number, () => void][] = [
    [0, () => {
      a.fx.text(a.boss.cx, a.boss.cy - 150, t('BLIZZARD!'), '#e8fbff', 30, 1200); a.sfx('roar');
      a.field(dur, (dt) => a.nudgePlayer(away * 150 * (dt / 1000)));
    }],
  ];
  const orbs = 2 + a.phase;
  for (let i = 0; i < orbs; i++) events.push([700 + i * 650, () => {
    a.face();
    const dir = a.boss.facing;
    a.projectile({ x: a.boss.cx + dir * 40, y: a.boss.cy - 10, vx: dir * 330, vy: (a.player.cy - a.boss.cy) * 0.35, w: 34, h: 34, color: ICE, attack: 'orb', life: 3200 });
    a.fx.ring(a.boss.cx + dir * 40, a.boss.cy - 10, ICE, 6, 60, 250, 4); a.sfx('zap');
  }]);
  return { events, dur: dur + 500, end: 'exhausted', glow: ICE, pose: 'heavy' };
};

/** A freezing lance beam sweeps the floor at foot height and then at head height. */
const cryoLance: BossMove = (a) => {
  const dir = a.boss.facing;
  const len = dir > 0 ? a.region.width - a.boss.cx : a.boss.cx - a.region.barrierX;
  const cx = a.boss.cx + dir * (len / 2);
  const shot = (at: number, top: number, h: number): [number, () => void][] => [
    [at, () => { a.warn(a.rect(cx - len / 2, a.boss.feetY - top - 4, len, h + 8), 650, ICE); a.sfx('telegraph'); a.face(); }],
    [at + 650, () => { a.hazard({ x: cx, w: len, h, top: a.boss.feetY - top, life: 420, attack: 'lance', color: ICE, shape: 'beam' }); a.sfx('zap'); a.fx.shake(0.008, 220); }],
  ];
  const ev = [...shot(0, 44, 28), ...shot(900, 170, 30)];
  if (a.phase >= 3) ev.push(...shot(1800, 44, 28));
  return { events: ev, dur: (a.phase >= 3 ? 1800 : 900) + 1200, glow: ICE, pose: 'heavy' };
};

export const glaciaMoves: Record<string, BossMove> = { frost_nova: frostNova, icicle_storm: icicleStorm, blizzard, cryo_lance: cryoLance };
