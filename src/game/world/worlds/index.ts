import type { WorldPack } from '../types';
import { neonTheme } from './neon/theme';
import { wardenTheme, buildWardenArena } from './neon/arena';
import { buildNeonStreet } from './neon/city';
import { docksTheme } from './docks/theme';
import { marrowTheme, buildTyrantArena } from './docks/arena';
import { buildRustDocks } from './docks/city';
import { foundryTheme } from './foundry/theme';
import { ignisTheme, buildEmpressArena } from './foundry/arena';
import { buildEmberFoundry } from './foundry/city';

/**
 * Every playable world, in campaign order. To add a world: create `worlds/<name>/{theme,city,arena}.ts`
 * (see worlds/README.md), add its ids to `RegionId`, and append a pack here. Nothing else needs to change.
 */
export const WORLD_PACKS: WorldPack[] = [
  { id: 'neon_street', themes: [neonTheme, wardenTheme], regions: [buildNeonStreet(), buildWardenArena()] },
  { id: 'rust_docks', themes: [docksTheme, marrowTheme], regions: [buildRustDocks(), buildTyrantArena()] },
  { id: 'ember_foundry', themes: [foundryTheme, ignisTheme], regions: [buildEmberFoundry(), buildEmpressArena()] },
];
