/**
 * Per-target minimum gap between two weapon hits from the player. A swing already hits each target once
 * (`AttackRunner.hitSet`); this stops overlapping sources (swing + wave + burst, a dash flurry) from stacking damage on
 * the same target in the same instant, which keeps very fast weapons inside their damage budget.
 */
export const MIN_HIT_GAP_MS = 55;

export class HitGate {
  private readonly last = new Map<number, number>();

  /** True when `target` may be hit at time `now`. */
  allows(target: number, now: number, gap = MIN_HIT_GAP_MS): boolean {
    const at = this.last.get(target);
    return at === undefined || now - at >= gap;
  }

  record(target: number, now: number): void {
    this.last.set(target, now);
    if (this.last.size > 256) for (const [id, t] of this.last) if (now - t > 5000) this.last.delete(id);
  }

  clear(): void { this.last.clear(); }
}

/**
 * Stagger lockout: once a weapon staggers a target it cannot be staggered again for a while, so no combination of
 * weapons or specials can chain stuns forever. Bosses are never staggered by weapons at all.
 */
export const STAGGER_LOCKOUT_MS = 1800;

export class StaggerGate {
  private readonly until = new Map<number, number>();

  /** Returns true (and starts the lockout) when `target` may be staggered now. */
  tryStagger(target: number, now: number, immune: boolean): boolean {
    if (immune) return false;
    if ((this.until.get(target) ?? 0) > now) return false;
    this.until.set(target, now + STAGGER_LOCKOUT_MS);
    return true;
  }

  clear(): void { this.until.clear(); }
}
