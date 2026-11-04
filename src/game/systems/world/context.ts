import type Phaser from 'phaser';
import type { EnemyKind, ItemId } from '@/shared/types';
import type { Fx } from '@/game/managers/Fx';
import type { CombatSystem } from '@/game/systems/combat/CombatSystem';
import type { GameClock } from '@/game/systems/combat/GameClock';
import type { Player } from '@/game/entities/player/Player';
import type { Enemy } from '@/game/entities/enemies/Enemy';
import type { RegionDef } from '@/game/config/regions';

/** Explicit dependencies handed to every entity instead of reaching for globals. */
export interface WorldContext {
  scene: Phaser.Scene;
  fx: Fx;
  combat: CombatSystem;
  clock: GameClock;
  actors: Phaser.Physics.Arcade.Group;
  region: RegionDef;
  getPlayer(): Player;
  /** True when the ground collision for world x is currently streamed in (enemies fall through the world otherwise). */
  isLoadedAt(x: number): boolean;
  spawnEnemy(kind: Exclude<EnemyKind, 'boss'>, x: number, y: number, patrol?: number): Enemy;
  dropItem(item: ItemId, x: number, y: number): void;
}
