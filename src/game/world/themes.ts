import type { WorldTheme } from './types';
import { WORLD_PACKS } from './worlds';

export const THEMES: Record<string, WorldTheme> = Object.fromEntries(WORLD_PACKS.flatMap((p) => p.themes).map((t) => [t.id, t]));

export function themeOf(id: string): WorldTheme {
  const t = THEMES[id];
  if (!t) throw new Error(`Unknown world theme "${id}"`);
  return t;
}
