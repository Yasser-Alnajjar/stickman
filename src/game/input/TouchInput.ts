/**
 * Touch/virtual input state. The React touch overlay writes here; `PlayerInput.poll` merges it into the same
 * `Intent` struct the keyboard fills, so there is exactly one movement/combat code path.
 */
export type TouchAction =
  | 'jump' | 'dash' | 'dodge' | 'block' | 'light' | 'kick' | 'heavy'
  | 'ability1' | 'ability2' | 'tonic' | 'cell';

/** Actions that fire once per press (edge) in addition to being "held" while the finger is down. */
const EDGE: ReadonlySet<TouchAction> = new Set(['jump', 'dash', 'dodge', 'light', 'kick', 'heavy', 'ability1', 'ability2', 'tonic', 'cell']);

/** Joystick: normalised offset -> digital move + block (pull down). Dead zone avoids drift. */
export function joystickAxes(dx: number, dy: number, radius: number): { moveX: -1 | 0 | 1; down: boolean } {
  const r = Math.max(1, radius);
  const nx = dx / r, ny = dy / r;
  const moveX = Math.abs(nx) < 0.28 ? 0 : nx < 0 ? -1 : 1;
  return { moveX, down: ny > 0.6 && Math.abs(ny) > Math.abs(nx) * 0.8 };
}

class TouchInputState {
  moveX: -1 | 0 | 1 = 0;
  down = false;
  private readonly held = new Map<TouchAction, number>(); // action -> number of fingers holding it
  private readonly edge = new Set<TouchAction>();

  isHeld(a: TouchAction): boolean { return (this.held.get(a) ?? 0) > 0; }

  press(a: TouchAction): void {
    this.held.set(a, (this.held.get(a) ?? 0) + 1);
    if (EDGE.has(a)) this.edge.add(a);
  }

  release(a: TouchAction): void {
    const n = (this.held.get(a) ?? 0) - 1;
    if (n > 0) this.held.set(a, n); else this.held.delete(a);
  }

  setStick(moveX: -1 | 0 | 1, down: boolean): void { this.moveX = moveX; this.down = down; }

  /** Returns true once per press; a tap shorter than a frame is never lost. */
  take(a: TouchAction): boolean { return this.edge.delete(a); }

  /** Clears pending edges (used while input is locked so presses don't leak into later frames). */
  dropEdges(): void { this.edge.clear(); }

  /** Safe on touch cancel, window blur, pause, scene change. */
  releaseAll(): void {
    this.held.clear();
    this.edge.clear();
    this.moveX = 0;
    this.down = false;
    listeners.forEach((fn) => fn());
  }
}

const listeners = new Set<() => void>();
/** UI components subscribe so their pressed visuals reset when input is force-released. */
export const onTouchReleaseAll = (fn: () => void): (() => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export const touchInput = new TouchInputState();

let installed = false;
/** Release everything when the page loses focus/visibility. Idempotent. */
export function installTouchSafety(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const release = (): void => touchInput.releaseAll();
  window.addEventListener('blur', release);
  window.addEventListener('pagehide', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
}
