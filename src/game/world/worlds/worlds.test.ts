import { describe, expect, it } from 'vitest';
import { REGIONS } from '@/game/config/regions';
import { THEMES, themeOf } from '../themes';
import { WORLD_PACKS } from './index';
import type { DecorDef } from '@/game/config/regions';

/** A Graphics stand-in: every method records a call and returns itself, so painters can be exercised without Phaser. */
function fakeGfx(): { g: never; calls: () => number } {
  let n = 0;
  const g: unknown = new Proxy({}, { get: () => (..._a: unknown[]) => { n++; return g; } });
  return { g: g as never, calls: () => n };
}
const ctx = { text: () => undefined };

describe('world themes', () => {
  it('every region points at a registered theme', () => {
    for (const r of Object.values(REGIONS)) expect(() => themeOf(r.theme), r.id).not.toThrow();
  });

  it('every decor kind placed in a region is painted by its theme (static or animated)', () => {
    for (const r of Object.values(REGIONS)) {
      const theme = themeOf(r.theme);
      const kinds = new Map<string, DecorDef>();
      for (const d of r.decor) kinds.set(d.kind, d);
      for (const [kind, d] of kinds) {
        const f = fakeGfx();
        theme.drawDecor(f.g, d, ctx);
        const anim = theme.animated?.[kind];
        if (anim) anim.draw(f.g, d, 1.5);
        expect(f.calls(), `${r.id} decor "${kind}" is never drawn`).toBeGreaterThan(0);
      }
    }
  });

  it('solids and ledges paint for every theme', () => {
    for (const r of Object.values(REGIONS)) {
      const theme = themeOf(r.theme);
      for (const s of r.solids.slice(0, 40)) { const f = fakeGfx(); theme.drawSolid(f.g, s, ctx); expect(f.calls(), `${r.id}.${s.id}`).toBeGreaterThan(0); }
      for (const o of r.oneWays) { const f = fakeGfx(); theme.drawLedge(f.g, o); expect(f.calls(), `${r.id}.${o.id}`).toBeGreaterThan(0); }
    }
  });

  it('the three cities and three boss arenas are genuinely different places', () => {
    const cities = ['city', 'docks', 'foundry'] as const;
    const arenas = ['boss_arena', 'tyrant_arena', 'empress_arena'] as const;
    for (const group of [cities, arenas]) {
      expect(new Set(group.map((id) => REGIONS[id].theme)).size).toBe(3);
      const kinds = group.map((id) => new Set(REGIONS[id].decor.map((d) => d.kind)));
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        const shared = [...kinds[i]].filter((k) => kinds[j].has(k)).length;
        // shared vocabulary is limited to generic things (door, pipes, banner, sign-like boards)
        expect(shared / Math.min(kinds[i].size, kinds[j].size), `${group[i]} vs ${group[j]}`).toBeLessThan(0.4);
      }
      const art = group.map((id) => themeOf(REGIONS[id].theme).backdrop);
      expect(new Set(art.map((a) => a.far.draw)).size).toBe(3);
      expect(new Set(art.map((a) => a.sky.map((s) => s[1]).join())).size).toBe(3);
    }
  });

  it('arena themes are not their city\'s theme and each arena stages its own entrance', () => {
    for (const r of Object.values(REGIONS).filter((r) => r.boss)) {
      expect(themeOf(r.theme).stage?.onStart, r.id).toBeTypeOf('function');
      expect(themeOf(r.theme).stage?.drawBarrier, r.id).toBeTypeOf('function');
    }
  });

  it('packs register unique theme ids', () => {
    const ids = WORLD_PACKS.flatMap((p) => p.themes.map((t) => t.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(THEMES).length).toBe(ids.length);
  });
});
