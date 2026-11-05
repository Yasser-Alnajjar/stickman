import type { WorldPackContent } from '../../types';
import { frostTheme } from './theme';
import { glaciaTheme, buildGlaciaArena } from './arena';
import { buildFrostpeak } from './city';
import { glaciaMoves } from './moves';

export const content: WorldPackContent = {
  themes: [frostTheme, glaciaTheme],
  buildRegions: () => [buildFrostpeak(), buildGlaciaArena()],
  moves: glaciaMoves,
};
