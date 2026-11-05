import type { WorldPackContent } from '../../types';
import { heliosTheme } from './theme';
import { aegisTheme, buildAegisArena } from './arena';
import { buildHeliosRing } from './city';
import { aegisMoves } from './moves';

export const content: WorldPackContent = {
  themes: [heliosTheme, aegisTheme],
  buildRegions: () => [buildHeliosRing(), buildAegisArena()],
  moves: aegisMoves,
};
