/**
 * Version-1 saves stored pickups under bare ids. Those ids were only ever defined by the first three worlds, whose
 * builders used fixed prefixes, so the owning region is recoverable without loading any level data:
 *   `dk_*` -> docks, `fd_*` -> foundry, everything else (chest_*, keycard) -> the original city.
 * This table is frozen history: it must never change, and new worlds never appear in it.
 */
export function legacyPickupRegion(id: string): string {
  if (id.startsWith('dk_')) return 'docks';
  if (id.startsWith('fd_')) return 'foundry';
  return 'city';
}

/** Region-qualified form used from version 2 on. */
export const collectedKey = (regionId: string, pickupId: string): string => `${regionId}:${pickupId}`;

export function qualifyLegacyCollected(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const out = new Set<string>();
  for (const id of ids) {
    if (typeof id !== 'string') continue;
    out.add(id.includes(':') ? id : collectedKey(legacyPickupRegion(id), id));
  }
  return [...out];
}
