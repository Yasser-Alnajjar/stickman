import type { WorldTheme } from './types';
import { THEMES } from './stores';
import '@/game/world/worlds';

export { THEMES };

/** The theme of a *loaded* region. Await `ensureRegion` (world/loader.ts) first. */
export function themeOf(id: string): WorldTheme {
  const t = THEMES[id];
  if (!t) throw new Error(`World theme "${id}" is not loaded (its world pack has not been loaded)`);
  return t;
}
