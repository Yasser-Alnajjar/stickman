import type { WorldPackMeta } from '../types';
import { registerPack } from '../registry';
import { WORLD_PACKS } from '../stores';
import { neonManifest } from './neon/manifest';
import { docksManifest } from './docks/manifest';
import { foundryManifest } from './foundry/manifest';
import { jadeManifest } from './jade/manifest';
import { frostManifest } from './frost/manifest';
import { duneManifest } from './dune/manifest';
import { heliosManifest } from './helios/manifest';
import { hollowManifest } from './hollow/manifest';
import { cogworkManifest } from './cogwork/manifest';
import { aetherManifest } from './aether/manifest';

/**
 * Every playable world, in campaign order: manifests only (data, no level code). To add a world, write
 * `worlds/<id>/{manifest,content}.ts` (see worlds/README.md) and append its manifest here.
 * Region links, unlocks, the campaign map and the quest line all derive from this order.
 */
const MANIFESTS: WorldPackMeta[] = [neonManifest, docksManifest, foundryManifest, jadeManifest, frostManifest, duneManifest, heliosManifest, hollowManifest, cogworkManifest, aetherManifest];

if (WORLD_PACKS.length === 0) for (const m of MANIFESTS) registerPack(m);

export { WORLD_PACKS };
