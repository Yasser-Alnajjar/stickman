import type { AttackDef, ProfileData } from '@/shared/types';
import { PLAYER_ATTACKS } from '@/game/config/attacks';
import { WEAPONS, STARTING_WEAPON } from './registry';
import { equippedId, levelOf } from './ownership';
import { scaleAttackTiming, weaponStats } from './stats';
import type { WeaponDef, WeaponStats } from './types';

export type SpecialCheck =
  | { ok: true; cost: number }
  | { ok: false; reason: 'cooldown' | 'energy'; cost: number };

/** States in which the player may swap weapons from the quick-switch controls. */
const SWITCHABLE = new Set(['Idle', 'Moving', 'Jumping', 'Falling', 'Blocking']);

/**
 * The equipped weapon as combat sees it: definition + upgrade level -> concrete attacks and stats, special-ability
 * cooldowns (kept per weapon, so swapping never refreshes a cooldown) and switching rules. No engine dependencies.
 */
export class WeaponRuntime {
  def: WeaponDef = WEAPONS[STARTING_WEAPON];
  level = 1;
  stats: WeaponStats = weaponStats(this.def, 1);
  private readonly cooldowns = new Map<string, { remaining: number; total: number }>();

  constructor(private readonly profile: () => ProfileData) { this.sync(); }

  /** Re-reads the profile. Returns true when the weapon (not just its level) changed. */
  sync(): boolean {
    const p = this.profile();
    const id = equippedId(p);
    const changed = id !== this.def.id;
    this.def = WEAPONS[id];
    this.level = levelOf(p, id);
    this.stats = weaponStats(this.def, this.level);
    return changed;
  }

  update(dt: number): void {
    for (const c of this.cooldowns.values()) if (c.remaining > 0) c.remaining = Math.max(0, c.remaining - dt);
  }

  cooldown(id = this.def.id): { remaining: number; total: number } {
    return this.cooldowns.get(id) ?? { remaining: 0, total: this.def.special.cooldown };
  }

  resetCooldowns(): void { this.cooldowns.clear(); }

  /** Concrete attack for a combo id: timing sped up by the weapon's speed and cost reduced by its efficiency. */
  attack(id: string): AttackDef {
    const a = this.def.combo.attacks[id] ?? PLAYER_ATTACKS[id];
    return this.def.category === 'fists' && this.level === 1 ? a : scaleAttackTiming(a, this.stats.speedMult, this.stats.costMult);
  }

  /** Attack to use now: swaps in the weapon's fallback when the player cannot pay the energy for `id`. */
  resolveAttack(id: string, energy: number): AttackDef {
    const a = this.attack(id);
    const fb = this.def.combo.fallback;
    if (fb && a.energyCost && energy < a.energyCost && id !== fb) return this.attack(fb);
    return a;
  }

  specialCost(): number {
    return Math.max(1, Math.round(this.def.special.energyCost * this.stats.costMult));
  }

  checkSpecial(energy: number): SpecialCheck {
    const cost = this.specialCost();
    if (this.cooldown().remaining > 0) return { ok: false, reason: 'cooldown', cost };
    if (energy < cost) return { ok: false, reason: 'energy', cost };
    return { ok: true, cost };
  }

  /** Starts the special's cooldown (call after the special actually fired). */
  startSpecialCooldown(): void {
    const total = this.def.special.cooldown;
    this.cooldowns.set(this.def.id, { remaining: total, total });
  }

  static canSwitchIn(state: string, attackCancellable: boolean): boolean {
    return SWITCHABLE.has(state) || (state === 'Attacking' && attackCancellable);
  }
}
