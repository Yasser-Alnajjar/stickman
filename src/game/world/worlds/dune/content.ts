import type { WorldPackContent } from '../../types';
import { duneTheme } from './theme';
import { khamsinTheme, buildKhamsinArena } from './arena';
import { buildDuneKingdom } from './city';
import { khamsinMoves } from './moves';

export const content: WorldPackContent = {
  themes: [duneTheme, khamsinTheme],
  buildRegions: () => [buildDuneKingdom(), buildKhamsinArena()],
  moves: khamsinMoves,
};
