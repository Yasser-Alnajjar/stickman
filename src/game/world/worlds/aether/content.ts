import type { WorldPackContent } from '../../types';
import { aetherTheme } from './theme';
import { zephyrosTheme, buildZephyrosArena } from './arena';
import { buildAetherCitadel } from './city';
import { zephyrosMoves } from './moves';

export const content: WorldPackContent = {
  themes: [aetherTheme, zephyrosTheme],
  buildRegions: () => [buildAetherCitadel(), buildZephyrosArena()],
  moves: zephyrosMoves,
};
