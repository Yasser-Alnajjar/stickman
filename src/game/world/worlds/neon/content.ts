import type { WorldPackContent } from '../../types';
import { neonTheme } from './theme';
import { wardenTheme, buildWardenArena } from './arena';
import { buildNeonStreet } from './city';

/** The lazily loaded half of the world (see world/loader.ts). */
export const content: WorldPackContent = {
  themes: [neonTheme, wardenTheme],
  buildRegions: () => [buildNeonStreet(), buildWardenArena()],
};
