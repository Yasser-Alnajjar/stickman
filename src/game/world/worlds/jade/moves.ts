import type { BossApi, BossMove } from '@/game/config/boss-moves';
import { t } from '@/i18n';

const JADE_GLOW = 0x7dffd0;
const edge = (a: BossApi, dir: 1 | -1): number => (dir > 0 ? a.region.width - 100 : a.region.barrierX + 80);

/** A line of glyph-eruptions marches across the floor, then (phase 3) a second one marches back. */
const glyphWave: BossMove = (a) => {
  const dir = a.boss.facing, n = 5 + a.phase, step = 175;
  const events: [number, () => void][] = [];
  const column = (i: number, from: number, d: 1 | -1, at: number): void => {
    const x = from + d * i * step;
    if (d > 0 ? x > edge(a, 1) : x < edge(a, -1)) return;
    events.push([at + i * 210, () => { a.warn(a.rect(x - 55, a.boss.feetY - 320, 110, 320), 650, JADE_GLOW); a.sfx('telegraph'); }]);
    events.push([at + i * 210 + 650, () => {
      a.hazard({ x, w: 100, h: 330, life: 380, attack: 'glyph', color: JADE_GLOW });
      a.fx.ring(x, a.boss.feetY - 6, JADE_GLOW, 10, 100, 340, 5);
      a.fx.debrisBurst(x, a.boss.feetY - 8, 8);
      a.sfx('slam');
    }]);
  };
  const start = a.boss.cx + dir * 190;
  for (let i = 0; i < n; i++) column(i, start, dir, 0);
  let end = n * 210 + 650;
  if (a.phase >= 3) { for (let i = 0; i < n; i++) column(i, edge(a, dir), (-dir) as 1 | -1, n * 210 + 500); end += n * 210 + 500; }
  return { events, dur: end + 600, glow: JADE_GLOW };
};

/** Twin eye-beams: one low (jump it), one high-set (stay down) fired in sequence so a panicked jump is punished. */
const idolGaze: BossMove = (a) => {
  const dir = a.boss.facing;
  const len = dir > 0 ? a.region.width - a.boss.cx : a.boss.cx - a.region.barrierX;
  const cx = a.boss.cx + dir * (len / 2);
  const fire = (at: number, top: number, h: number): [number, () => void][] => [
    [at, () => { a.warn(a.rect(cx - len / 2, a.boss.feetY - top - 4, len, h + 8), 700, JADE_GLOW); a.sfx('telegraph'); a.face(); }],
    [at + 700, () => { a.hazard({ x: cx, w: len, h, top: a.boss.feetY - top, life: 520, attack: 'gaze', color: JADE_GLOW, shape: 'beam' }); a.fx.shake(0.008, 250); a.sfx('zap'); }],
  ];
  const events = [...fire(0, 46, 26), ...fire(1100, 160, 30)];
  if (a.phase >= 3) events.push(...fire(2200, 46, 26));
  return { events, dur: (a.phase >= 3 ? 2200 : 1100) + 1500, glow: JADE_GLOW, pose: 'heavy' };
};

/** Boulders thunder in from the far wall. Jump them. */
const boulder: BossMove = (a) => {
  const count = a.phase;
  const events: [number, () => void][] = [];
  for (let i = 0; i < count; i++) {
    const fromRight = i % 2 === 0 ? a.player.cx < a.region.width / 2 : a.player.cx >= a.region.width / 2;
    const dir: 1 | -1 = fromRight ? -1 : 1;
    const x0 = fromRight ? a.region.width - 60 : a.region.barrierX + 90;
    const speed = 430 + i * 60 + a.phase * 20;
    const travel = Math.abs(a.region.width - a.region.barrierX) - 100;
    events.push([i * 1100, () => {
      a.warn(a.rect(Math.min(x0, x0 + dir * 260) - 20, a.boss.feetY - 120, 300, 120), 800, 0xe6b94f);
      a.fx.text(x0, a.boss.feetY - 150, '!!', '#e6b94f', 36, 800);
      a.sfx('telegraph');
    }]);
    events.push([i * 1100 + 800, () => {
      a.hazard({ x: x0, w: 110, h: 110, life: (travel / speed) * 1000, attack: 'boulder', color: 0x8a9a80, vx: dir * speed, shape: 'orb' });
      a.fx.shake(0.01, 300); a.sfx('slam');
    }]);
  }
  return { events, dur: count * 1100 + 800 + 2600, pose: 'slam' };
};

/** The idol bursts: jade shards arc into the air and rain down around the player. */
const jadeBurst: BossMove = (a) => {
  const n = 4 + a.phase * 2;
  const events: [number, () => void][] = [];
  events.push([0, () => { a.fx.ring(a.boss.cx, a.boss.cy, JADE_GLOW, 20, 220, 600, 6); a.sfx('roar'); a.fx.text(a.boss.cx, a.boss.cy - 150, t('SHATTER!'), '#7dffd0', 28, 900); }]);
  events.push([650, () => {
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0 : i / (n - 1) - 0.5;
      const aim = Math.sign(a.player.cx - a.boss.cx) * 120;
      a.projectile({ x: a.boss.cx, y: a.boss.cy - 40, vx: u * 760 + aim, vy: -760 - (i % 2) * 120, ay: 1500, w: 22, h: 22, color: JADE_GLOW, attack: 'shard', life: 2600 });
    }
    a.fx.debrisBurst(a.boss.cx, a.boss.feetY - 8, 16); a.fx.shake(0.012, 260); a.sfx('slam');
  }]);
  return { events, dur: 650 + 1800, end: a.phase >= 2 ? 'exhausted' : 'pause', glow: JADE_GLOW, pose: 'slam' };
};

export const azcalMoves: Record<string, BossMove> = { glyph_wave: glyphWave, idol_gaze: idolGaze, boulder, jade_burst: jadeBurst };
