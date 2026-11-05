import Phaser from 'phaser';
import type { HitOutcome, HitSpec } from '@/shared/types';
import type { Fighter } from '@/game/entities/Fighter';
import type { AttackRunner } from './AttackRunner';
import { audio } from '@/game/managers/AudioManager';
import type { Fx } from '@/game/managers/Fx';
import type { GameClock } from './GameClock';
import { t } from '@/i18n';
import { HitGate } from '@/game/weapons/hit-gate';
import { COLORS } from '@/shared/constants';

export interface HitResult { outcome: HitOutcome; damage: number; dir: number }

const rectA = new Phaser.Geom.Rectangle();
const rectB = new Phaser.Geom.Rectangle();

/** Registry of fighters plus the single place where hits are resolved and given feedback. */
export class CombatSystem {
  readonly fighters = new Set<Fighter>();
  debug = false;
  /** Limits how often the player's weapons can hit the same target (see weapons/hit-gate.ts). */
  readonly gate = new HitGate();

  constructor(private readonly fx: Fx, private readonly clock: GameClock) {}

  register(f: Fighter): void { this.fighters.add(f); }
  unregister(f: Fighter): void { this.fighters.delete(f); }

  /** Checks the owner's active hitbox against all hostile fighters. Returns number of new hits. */
  processAttack(owner: Fighter, runner: AttackRunner): number {
    if (!runner.active || !runner.def || !runner.spec) return 0;
    runner.hitbox(owner.cx, owner.cy, owner.facing, rectA);
    return this.hitRect(owner, rectA, runner.spec, runner.hitSet, owner.cx, runner);
  }

  /** Area hit (shockwaves, lightning path...). Each target can be hit once per `hitSet`. */
  hitRect(attacker: Fighter, rect: Phaser.Geom.Rectangle, spec: HitSpec, hitSet: Set<number>, fromX: number, runner?: AttackRunner): number {
    let hits = 0;
    for (const t of this.fighters) {
      if (t.team === attacker.team || !t.alive || hitSet.has(t.id)) continue;
      t.hurtbox(rectB);
      if (!Phaser.Geom.Rectangle.Overlaps(rect, rectB)) continue;
      const fromPlayer = attacker.team === 'player';
      if (fromPlayer && !this.gate.allows(t.id, this.clock.now)) continue; // too soon after another hit: try again next frame
      const outcome = this.resolve(attacker, t, spec, fromX);
      if (outcome === 'ignored') continue; // may hit later once invulnerability ends
      if (fromPlayer) this.gate.record(t.id, this.clock.now);
      hitSet.add(t.id);
      hits++;
      if (runner) runner.hitLanded = true;
    }
    return hits;
  }

  resolve(attacker: Fighter, target: Fighter, spec: HitSpec, fromX: number): HitOutcome {
    const res = target.receiveHit(spec, attacker, fromX);
    if (res.outcome === 'ignored') return 'ignored';
    const { fx, clock } = this;
    const px = target.cx - res.dir * (target.w / 2);
    const py = target.cy - target.h * 0.12;
    const def = spec.def;
    attacker.onHitLanded(target, spec, res);

    if (res.outcome === 'blocked') {
      fx.hitSparks(px, py, res.dir, 5);
      fx.text(target.cx, target.cy - target.h * 0.6, t('BLOCK'), '#8fd3ff', 18, 500);
      audio.play('block');
      clock.hitStop(45);
      return 'blocked';
    }
    if (res.outcome === 'perfect') {
      fx.ring(px, py, 0x8fd3ff, 10, 90, 300, 5);
      fx.hitSparks(px, py, res.dir, 10, true);
      fx.text(target.cx, target.cy - target.h * 0.6, t('PERFECT BLOCK'), '#fff1b0', 20, 800);
      audio.play('perfect');
      clock.hitStop(130);
      fx.shake(0.004, 100);
      return 'perfect';
    }

    const heavy = def.hitStop >= 100;
    fx.hitSparks(px, py, res.dir, 6 + Math.min(10, Math.round(res.damage / 4)), heavy);
    const isPlayerVictim = target.team === 'player';
    fx.text(target.cx + (Math.random() - 0.5) * 16, target.cy - target.h * 0.55, String(res.damage),
      isPlayerVictim ? '#ff6b6b' : spec.element === 'fire' ? '#ffb347' : spec.element === 'lightning' ? '#7ff3ff' : spec.element === 'ice' ? '#bfe9ff' : '#ffffff', heavy ? 28 : 22);
    if (spec.element === 'fire') fx.fireBurst(px, py, 16);
    if (spec.element === 'lightning') fx.boltBurst(px, py, 12);
    if (spec.element === 'ice') fx.ring(px, py, COLORS.ice, 6, 60, 260, 3);
    audio.play(isPlayerVictim ? 'hurt' : heavy ? 'hitHeavy' : 'hit');
    clock.hitStop(def.hitStop * (res.outcome === 'killed' ? 1.5 : 1));
    fx.shake(def.shake * (isPlayerVictim ? 1.3 : 1), 140);
    return res.outcome;
  }
}
