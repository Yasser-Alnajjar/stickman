import type { WorldPackContent } from '../../types';
import { cogTheme } from './theme';
import { horolTheme, buildHorolArena } from './arena';
import { buildCogworkDepths } from './city';
import { horolMoves } from './moves';

export const content: WorldPackContent = {
  themes: [cogTheme, horolTheme],
  buildRegions: () => [buildCogworkDepths(), buildHorolArena()],
  moves: horolMoves,
};
