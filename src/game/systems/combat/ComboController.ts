import type { AttackDef } from '@/shared/types';
import { PLAYER_ATTACKS } from '@/game/config/attacks';
import { PLAYER_CFG } from '@/game/config/player';
import { comboScale } from '@/game/systems/combat/damage';

export type AttackInput = 'light' | 'kick' | 'heavy';

const OPENERS: Record<AttackInput, string> = { light: 'punch1', kick: 'kick', heavy: 'heavy' };

/**
 * Pure combo logic: input buffer, chain windows and hit counter.
 * The player drives it with `update(dt)`, `push()` and `onAttackStarted/Ended`.
 * The attack graph comes from the equipped weapon (`setTable`); the default is the unarmed combo.
 */
export class ComboController {
  private table: Record<string, AttackDef> = PLAYER_ATTACKS;
  private openers: Record<AttackInput, string> = OPENERS;
  private gain = 0.08;
  lastAttackId: string | null = null;
  /** Remaining ms in which a chain input after the last attack is still honoured. */
  chainWindow = 0;
  buffered: { input: AttackInput; ttl: number } | null = null;
  hits = 0;
  private hitTimer = 0;

  /** Switches the combo graph (weapon change). Always starts a clean chain. */
  setTable(attacks: Record<string, AttackDef>, openers: Record<AttackInput, string>, gain = 0.08): void {
    this.table = attacks;
    this.openers = openers;
    this.gain = gain;
    this.reset();
  }

  push(input: AttackInput): void {
    this.buffered = { input, ttl: PLAYER_CFG.inputBufferMs };
  }

  update(dt: number): void {
    if (this.buffered) {
      this.buffered.ttl -= dt;
      if (this.buffered.ttl <= 0) this.buffered = null;
    }
    if (this.chainWindow > 0) {
      this.chainWindow -= dt;
      if (this.chainWindow <= 0) this.lastAttackId = null;
    }
    if (this.hits > 0) {
      this.hitTimer -= dt;
      if (this.hitTimer <= 0) this.hits = 0;
    }
  }

  /** Which attack should `input` trigger right now? `attackInProgress` = the previous attack is still running. */
  resolve(input: AttackInput, attackInProgress: boolean): string {
    const prev = this.lastAttackId ? this.table[this.lastAttackId] : undefined;
    if (prev && (attackInProgress || this.chainWindow > 0)) {
      const nxt = prev.next?.[input];
      if (nxt) return nxt;
    }
    return this.openers[input];
  }

  hasChainFrom(id: string, input: AttackInput): boolean {
    return !!this.table[id]?.next?.[input];
  }

  onAttackStarted(id: string): void {
    this.lastAttackId = id;
    this.chainWindow = 0;
    this.buffered = null;
  }

  onAttackEnded(): void {
    const def = this.lastAttackId ? this.table[this.lastAttackId] : undefined;
    this.chainWindow = def?.comboWindow ?? 0;
    if (!this.chainWindow) this.lastAttackId = null;
  }

  registerHit(): number {
    this.hits += 1;
    this.hitTimer = PLAYER_CFG.comboResetMs;
    return this.hits;
  }

  /** Scale applied to the *next* hit (hits already landed). */
  scale(): number {
    return comboScale(this.hits, this.gain);
  }

  reset(): void {
    this.lastAttackId = null;
    this.chainWindow = 0;
    this.buffered = null;
    this.hits = 0;
    this.hitTimer = 0;
  }
}
