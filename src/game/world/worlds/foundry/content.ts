import type { WorldPackContent } from '../../types';
import { foundryTheme } from './theme';
import { ignisTheme, buildEmpressArena } from './arena';
import { buildEmberFoundry } from './city';

/** The lazily loaded half of the world (see world/loader.ts). */
export const content: WorldPackContent = {
  themes: [foundryTheme, ignisTheme],
  buildRegions: () => [buildEmberFoundry(), buildEmpressArena()],
};
