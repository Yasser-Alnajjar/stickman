/** Generic finite-state machine with an explicit transition table that rejects invalid transitions. */
export class StateMachine<S extends string> {
  private current: S;
  /** Time spent in the current state, ms. */
  elapsed = 0;
  previous: S;

  constructor(
    initial: S,
    private readonly table: Record<S, readonly S[]>,
    private readonly onEnter?: (to: S, from: S) => void,
  ) {
    this.current = initial;
    this.previous = initial;
  }

  get state(): S {
    return this.current;
  }

  is(...states: S[]): boolean {
    return states.includes(this.current);
  }

  can(to: S): boolean {
    return this.table[this.current].includes(to);
  }

  /** Attempts the transition; returns false (and does nothing) when it is not allowed. */
  transition(to: S): boolean {
    if (to === this.current) return true;
    if (!this.can(to)) return false;
    this.previous = this.current;
    this.current = to;
    this.elapsed = 0;
    this.onEnter?.(to, this.previous);
    return true;
  }

  tick(dt: number): void {
    this.elapsed += dt;
  }
}
