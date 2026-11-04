import type { BossId, EnemyKind, ItemId, MusicTrack, RegionId } from '@/shared/types';

export type SolidKind = 'ground' | 'roof' | 'crate' | 'wall' | 'gate';
export interface SolidDef { id: string; x: number; y: number; w: number; h: number; kind: SolidKind; /** hidden once this profile flag is set */ openFlag?: string }
export interface OneWayDef { id: string; x: number; y: number; w: number }
/** Free-form: each world theme defines its own decor vocabulary (see world/worlds/*). */
export type DecorKind = string;
export interface DecorDef { id: string; kind: DecorKind; x: number; y: number; w: number; h: number; seed: number; text?: string; /** `front` decor paints over the actors */ layer?: 'front' }
export interface SecretDef { id: string; x: number; y: number; w: number; h: number }
export interface SpawnDef { id: string; kind: Exclude<EnemyKind, 'boss'>; x: number; y?: number; patrol: number }
export interface NpcPlacement { npc: string; x: number }
export interface CheckpointDef { id: string; name: string; x: number }
export interface PickupDef { id: string; item: ItemId; qty: number; x: number; y: number; chest?: boolean }
export interface ZoneDef {
  id: string; kind: 'reach' | 'exit' | 'boss'; x: number; y: number; w: number; h: number; to?: RegionId; spawn?: string;
  /** The exit stays shut until this boss has been defeated. */
  requiresBoss?: BossId;
}

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
  npcs: NpcPlacement[];
  checkpoints: CheckpointDef[];
  pickups: PickupDef[];
  zones: ZoneDef[];
  spawnPoints: Record<string, { x: number; y: number }>;
  /** Hit/damage scaling for every enemy placed in this region (stage difficulty). */
  enemyScale?: { hp: number; atk: number };
  /** Arena boss: where it stands and where the sealing barrier drops once the fight starts. */
  boss?: { id: BossId; x: number; barrierX: number };
}

import { WORLD_PACKS } from '@/game/world/worlds';

/** All regions, assembled from the world packs. Region ids are persisted in saves: never rename one. */
export const REGIONS = Object.fromEntries(WORLD_PACKS.flatMap((p) => p.regions).map((r) => [r.id, r])) as Record<RegionId, RegionDef>;

/** Regions in campaign order (city, its boss arena, next city, ...). */
export const STAGE_ORDER: RegionId[] = WORLD_PACKS.flatMap((p) => p.regions.map((r) => r.id));
