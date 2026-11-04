import type Phaser from 'phaser';

/** Game time: delta clamping, hit-stop (freeze frames) and slow motion. Entities consume `tick()` output. */
export class GameClock {
  now = 0;
  private hitStopLeft = 0;
  private slowLeft = 0;
  private slowScale = 1;

  constructor(private readonly world: Phaser.Physics.Arcade.World) {}

  hitStop(ms: number): void {
    if (ms <= 0) return;
    if (this.hitStopLeft <= 0) this.world.pause();
    this.hitStopLeft = Math.max(this.hitStopLeft, ms);
  }

  slowmo(scale: number, ms: number): void {
    this.slowScale = scale;
    this.slowLeft = ms;
    this.world.timeScale = 1 / scale;
  }

  get frozen(): boolean {
    return this.hitStopLeft > 0;
  }

  /** @returns scaled delta in ms (0 while in hit-stop). */
  tick(rawDelta: number): number {
    const raw = Math.min(rawDelta, 50);
    if (this.slowLeft > 0) {
      this.slowLeft -= raw;
      if (this.slowLeft <= 0) { this.slowScale = 1; this.world.timeScale = 1; }
    }
    if (this.hitStopLeft > 0) {
      this.hitStopLeft -= raw;
      if (this.hitStopLeft <= 0) this.world.resume();
      return 0;
    }
    const dt = raw * this.slowScale;
    this.now += dt;
    return dt;
  }

  dispose(): void {
    this.world.resume();
    this.world.timeScale = 1;
  }
}
