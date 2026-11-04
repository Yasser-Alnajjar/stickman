import type { AbilityId } from '@/shared/types';
import { ABILITIES, ABILITY_ORDER } from '@/game/config/abilities';
import { session } from '@/game/managers/session';
import { audio } from '@/game/managers/AudioManager';

export interface AbilityHost {
  energy: number;
  spendEnergy(n: number): void;
  canCast(): boolean;
  cast(id: AbilityId, rank: number): boolean;
  flashText(text: string, color: string): void;
}

/** Cooldowns, energy checks and rank lookups for abilities. The ability effects live on the host (Player). */
export class AbilityManager {
  readonly cooldowns: Record<AbilityId, { remaining: number; total: number }> = {
    fire_punch: { remaining: 0, total: 1 },
    lightning_dash: { remaining: 0, total: 1 },
  };

  constructor(private readonly host: AbilityHost) {}

  rank(id: AbilityId): number {
    return session.profile.abilities[id];
  }

  update(dt: number): void {
    for (const id of ABILITY_ORDER) {
      const c = this.cooldowns[id];
      if (c.remaining > 0) c.remaining = Math.max(0, c.remaining - dt);
    }
  }

  resetCooldowns(): void {
    for (const id of ABILITY_ORDER) this.cooldowns[id].remaining = 0;
  }

  /** @returns true when the ability fired. */
  tryActivate(slot: 0 | 1): boolean {
    const id = ABILITY_ORDER.find((a) => ABILITIES[a].slot === slot);
    if (!id) return false;
    const def = ABILITIES[id];
    const rank = this.rank(id);
    if (rank <= 0) {
      this.host.flashText('Locked', '#9aa3c7');
      audio.play('uiBack');
      return false;
    }
    const cd = this.cooldowns[id];
    if (cd.remaining > 0) {
      audio.play('uiBack');
      return false;
    }
    const cost = def.energyCost[rank - 1];
    if (this.host.energy < cost) {
      this.host.flashText('Not enough energy', '#6aa8ff');
      audio.play('uiBack');
      return false;
    }
    if (!this.host.canCast()) return false;
    if (!this.host.cast(id, rank)) return false;
    this.host.spendEnergy(cost);
    cd.total = def.cooldown[rank - 1];
    cd.remaining = cd.total;
    return true;
  }
}
