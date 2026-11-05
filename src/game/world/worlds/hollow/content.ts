import type { WorldPackContent } from '../../types';
import { hollowTheme } from './theme';
import { mordaineTheme, buildMordaineArena } from './arena';
import { buildHollowWood } from './city';
import { mordaineMoves } from './moves';

export const content: WorldPackContent = {
  themes: [hollowTheme, mordaineTheme],
  buildRegions: () => [buildHollowWood(), buildMordaineArena()],
  moves: mordaineMoves,
};
