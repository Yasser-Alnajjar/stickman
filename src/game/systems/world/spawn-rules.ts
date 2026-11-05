/** Pure spawn/despawn rules (no engine imports) so they can be unit-tested. */

/** Enemies may only exist where the ground under them is streamed in; otherwise they fall out of the world. */
export function shouldSpawn(distToPlayer: number, spawnRadius: number, groundLoaded: boolean): boolean {
  return distToPlayer < spawnRadius && groundLoaded;
}

export function shouldDespawn(distToPlayer: number, despawnRadius: number, groundLoaded: boolean): boolean {
  return distToPlayer > despawnRadius || !groundLoaded;
}

/** An enemy far below the region floor has fallen through the world and must be recycled. */
export function hasFallenOut(cy: number, regionHeight: number): boolean {
  return cy > regionHeight + 200;
}

/** Key under which a placed enemy's death is stored in the profile (and therefore the save file). */
export const spawnKey = (regionId: string, spawnId: string): string => `${regionId}:${spawnId}`;
