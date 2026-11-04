import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEV_AR } from './strings';

describe('developer panel translations', () => {
  it('covers every literal passed to dt() and keeps the dev strings out of the player dictionary', async () => {
    const src = ['DevPanel.tsx', 'actions.ts'].map((f) => readFileSync(join(process.cwd(), 'src/devtools', f), 'utf8')).join('\n');
    const keys = [...src.matchAll(/\bdt\(\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
    const titles = [...src.matchAll(/title="([^"]+)"/g)].map((m) => m[1]);
    const labels = [...src.matchAll(/<KV k="([^"]+)"/g)].map((m) => m[1]);
    const missing = [...new Set([...keys, ...titles, ...labels])].filter((k) => !(k in DEV_AR));
    expect(missing).toEqual([]);
    const { AR } = await import('@/i18n/ar');
    expect(Object.keys(AR).filter((k) => k in DEV_AR && /sandbox|god mode|wipe/i.test(k))).toEqual([]);
  });
});
