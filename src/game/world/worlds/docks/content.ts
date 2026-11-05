import type { WorldPackContent } from '../../types';
import { docksTheme } from './theme';
import { marrowTheme, buildTyrantArena } from './arena';
import { buildRustDocks } from './city';

/** The lazily loaded half of the world (see world/loader.ts). */
export const content: WorldPackContent = {
  themes: [docksTheme, marrowTheme],
  buildRegions: () => [buildRustDocks(), buildTyrantArena()],
};
