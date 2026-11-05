export type BlockResult = 'none' | 'block' | 'perfect';

export interface DamageInput {
  baseDamage: number;
  attackerAttack: number;
  targetDefense: number;
  comboScale: number;
  multiplier: number;
  block: BlockResult;
  vulnerable?: boolean;
  blockFactor: number;
}

/** Single source of truth for damage: used by player, enemies, bosses and abilities. */
export function computeDamage(i: DamageInput): number {
  if (i.block === 'perfect') return 0;
  let d = i.baseDamage * (1 + (i.attackerAttack - 10) * 0.06) * i.comboScale * i.multiplier;
  d -= i.targetDefense * 0.4;
  if (i.vulnerable) d *= 1.5;
  if (i.block === 'block') d *= i.blockFactor;
  return Math.max(1, Math.round(d));
}

/** Combo damage scaling: +8% per hit already landed in the chain (weapons may change the gain), capped at 10 hits. */
export function comboScale(hits: number, gain = 0.08): number {
  return 1 + Math.min(hits, 10) * gain;
}
