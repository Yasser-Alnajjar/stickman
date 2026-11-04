import Phaser from 'phaser';
import type { AttackDef, AttackPhase, Facing, HitSpec } from '@/shared/types';

/**
 * Runs one attack through startup -> active -> recovery using accumulated delta time,
 * and produces the attack's independent hitbox. Shared by player, enemies and boss.
 */
export class AttackRunner {
  def: AttackDef | null = null;
  spec: HitSpec | null = null;
  phase: AttackPhase = 'idle';
  /** Time spent in the current phase, ms. */
  t = 0;
  /** Fighters already struck by this swing (prevents multi-hits). */
  readonly hitSet = new Set<number>();
  hitLanded = false;
  onPhase?: (phase: AttackPhase, prev: AttackPhase) => void;

  start(def: AttackDef, spec: HitSpec): void {
    this.def = def;
    this.spec = spec;
    this.hitSet.clear();
    this.hitLanded = false;
    this.t = 0;
    this.setPhase(def.startup > 0 ? 'startup' : 'active');
  }

  get running(): boolean {
    return this.phase !== 'idle';
  }

  get active(): boolean {
    return this.phase === 'active';
  }

  private duration(): number {
    const d = this.def;
    if (!d) return 0;
    return this.phase === 'startup' ? d.startup : this.phase === 'active' ? d.active : d.recovery;
  }

  /** 0..1 progress within the current phase. */
  get progress(): number {
    const dur = this.duration();
    return dur <= 0 ? 1 : Math.min(1, this.t / dur);
  }

  private setPhase(p: AttackPhase): void {
    const prev = this.phase;
    this.phase = p;
    this.t = 0;
    this.onPhase?.(p, prev);
  }

  update(dt: number): void {
    if (!this.def || this.phase === 'idle') return;
    this.t += dt;
    for (let guard = 0; guard < 3 && this.running && this.t >= this.duration(); guard++) {
      const carry = this.t - this.duration();
      const cur: AttackPhase = this.phase;
      if (cur === 'startup') { this.setPhase('active'); this.t = carry; }
      else if (cur === 'active') { this.setPhase(this.def.recovery > 0 ? 'recovery' : 'idle'); this.t = carry; }
      else this.setPhase('idle');
    }
  }

  /** Cancels without running the recovery. */
  cancel(): void {
    if (this.phase !== 'idle') this.setPhase('idle');
    this.def = null;
    this.spec = null;
  }

  /** Writes the current hitbox in world space. Centre of the owner body + facing-relative offset. */
  hitbox(cx: number, cy: number, facing: Facing, out: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    const hb = this.def!.hitbox;
    // The near edge is extended back to the owner's centre so point-blank targets (standing inside the
    // owner's body) are still hittable. Forward reach is unchanged.
    const near = Math.min(hb.ox - hb.w / 2, -6);
    const far = hb.ox + hb.w / 2;
    const mid = (near + far) / 2;
    return out.setTo(cx + facing * mid - (far - near) / 2, cy + hb.oy - hb.h / 2, far - near, hb.h);
  }
}
