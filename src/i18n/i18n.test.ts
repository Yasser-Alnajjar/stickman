import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AR } from './ar';
import { QUESTS } from '@/game/config/quests';
import { NPCS } from '@/game/config/npcs';
import { ABILITIES } from '@/game/config/abilities';
import { ATTRIBUTES } from '@/game/config/progression';
import { ITEMS } from '@/game/config/items';
import { BOSSES, ENEMIES } from '@/game/config/enemies';
import { REGIONS } from '@/game/config/regions';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) && !p.endsWith('.test.ts') ? [p] : [];
  });
}

describe('Arabic translations', () => {
  const missing = (keys: string[]): string[] => [...new Set(keys)].filter((k) => !(k in AR));

  it('covers every literal passed to t() in the source', () => {
    const keys: string[] = [];
    for (const f of walk(join(process.cwd(), 'src'))) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.push(m[1].replace(/\\'/g, "'"));
      for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.push(m[1]);
    }
    expect(missing(keys)).toEqual([]);
  });

  it('covers all data-driven text (quests, NPCs, abilities, items, enemies, regions)', () => {
    const keys: string[] = [];
    for (const q of Object.values(QUESTS)) keys.push(q.title, q.summary, ...q.offer, ...q.inProgress, ...q.turnIn, ...q.objectives.map((o) => o.label));
    for (const n of Object.values(NPCS)) keys.push(n.name, ...n.idle);
    for (const a of Object.values(ABILITIES)) keys.push(a.name, a.description, ...a.rankNotes);
    for (const a of Object.values(ATTRIBUTES)) keys.push(a.name, a.description, a.perRank);
    for (const i of Object.values(ITEMS)) keys.push(i.name, i.description);
    for (const e of Object.values(ENEMIES)) keys.push(e.name);
    for (const b of Object.values(BOSSES)) keys.push(b.name, b.subtitle);
    for (const tag of ['Cargo, cranes and cutthroats. Marrow rules the pier.', 'The forges never cool. Ignis awaits at the heart.']) keys.push(tag);
    for (const r of Object.values(REGIONS)) keys.push(r.name, ...r.checkpoints.map((c) => c.name));
    expect(missing(keys)).toEqual([]);
  });

  it('keeps placeholders consistent between English and Arabic', () => {
    for (const [en, ar] of Object.entries(AR)) {
      const ph = (s: string): string => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
      expect(ph(ar), en).toBe(ph(en));
    }
  });
});
