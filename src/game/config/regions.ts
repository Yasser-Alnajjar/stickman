import type { BossId, ItemId, MusicTrack, RegionId } from '@/shared/types';
import { REGIONS } from '@/game/world/stores';
import { allRegionIds } from '@/game/world/registry';

export type SolidKind = 'ground' | 'roof' | 'crate' | 'wall' | 'gate';
export interface SolidDef { id: string; x: number; y: number; w: number; h: number; kind: SolidKind; /** hidden once this profile flag is set */ openFlag?: string }
export interface OneWayDef { id: string; x: number; y: number; w: number }
/** Free-form: each world theme defines its own decor vocabulary (see world/worlds/*). */
export type DecorKind = string;
export interface DecorDef { id: string; kind: DecorKind; x: number; y: number; w: number; h: number; seed: number; text?: string; /** `front` decor paints over the actors */ layer?: 'front' }
export interface SecretDef { id: string; x: number; y: number; w: number; h: number }
export interface SpawnDef { id: string; kind: string; x: number; y?: number; patrol: number }
export interface CheckpointDef { id: string; name: string; x: number }
export interface PickupDef { id: string; item: ItemId; qty: number; x: number; y: number; chest?: boolean }
export interface ZoneDef {
  id: string; kind: 'reach' | 'exit' | 'boss'; x: number; y: number; w: number; h: number; to?: RegionId; spawn?: string;
  /** The exit stays shut until this boss has been defeated. */
  requiresBoss?: BossId;
}

export interface Rect4 { x: number; y: number; w: number; h: number }

export interface RegionDef {
  id: RegionId;
  name: string;
  width: number;
  height: number;
  groundY: number;
  /** Key into the world theme registry (world/themes.ts). */
  theme: string;
  music: MusicTrack;
  solids: SolidDef[];
  oneWays: OneWayDef[];
  decor: DecorDef[];
  secrets: SecretDef[];
  spawns: SpawnDef[];
  checkpoints: CheckpointDef[];
  pickups: PickupDef[];
  zones: ZoneDef[];
  spawnPoints: Record<string, { x: number; y: number }>;
  /** Hit/damage scaling for every enemy placed in this region (stage difficulty). */
  enemyScale?: { hp: number; atk: number };
  /** Where the generated entrance/exit doors sit (cities only). Defaults: back at the west edge, forward near the east edge. */
  portals?: { forward?: Rect4; back?: Rect4 };
  /** Horizontal currents (gales, conveyor belts): while the player stands in `x..x+w` they are carried at `vx` px/s. */
  drift?: { x: number; w: number; vx: number }[];
  /** Arena boss: where it stands and where the sealing barrier drops once the fight starts. */
  boss?: { id: BossId; x: number; barrierX: number };
}

/**
 * Regions of the packs that are currently loaded (see world/loader.ts). Use `ensureRegion` before reading one that
 * may not be loaded yet. Region ids are persisted in saves: never rename one.
 */
export { REGIONS };

/** Every stage in campaign order (city, its boss arena, next city, ...). Derived from manifests: needs no loading. */
export function stageOrder(): RegionId[] {
  return allRegionIds();
}
