import type { WorldPackContent } from '../../types';
import { jadeTheme } from './theme';
import { azcalTheme, buildAzcalArena } from './arena';
import { buildJadeRuins } from './city';
import { azcalMoves } from './moves';

/** The lazily loaded half of Jade Ruins (see world/loader.ts). */
export const content: WorldPackContent = {
  themes: [jadeTheme, azcalTheme],
  buildRegions: () => [buildJadeRuins(), buildAzcalArena()],
  moves: azcalMoves,
};
