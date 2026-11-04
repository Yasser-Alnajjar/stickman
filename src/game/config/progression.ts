import type { AttributeId } from '@/shared/types';

export const MAX_LEVEL = 10;
export const xpToNext = (level: number): number => 100 + 50 * (level - 1);

export interface AttributeDef {
  id: AttributeId;
  name: string;
  description: string;
  maxRank: number;
  perRank: string;
}

export const ATTRIBUTES: Record<AttributeId, AttributeDef> = {
  vitality: { id: 'vitality', name: 'Vitality', description: 'Raises maximum health.', maxRank: 5, perRank: '+15 max health' },
  strength: { id: 'strength', name: 'Strength', description: 'Raises the damage of every attack.', maxRank: 5, perRank: '+2 attack (+12% damage)' },
  endurance: { id: 'endurance', name: 'Endurance', description: 'More stamina and faster stamina recovery.', maxRank: 5, perRank: '+12 stamina, +4/s regen' },
  agility: { id: 'agility', name: 'Agility', description: 'Move faster on foot.', maxRank: 5, perRank: '+4% move speed' },
  focus: { id: 'focus', name: 'Focus', description: 'Larger energy pool and faster energy recovery.', maxRank: 5, perRank: '+10 energy, +0.6/s regen' },
};

/** Flat bonuses granted automatically per level so levelling always matters. */
export const LEVEL_BONUS = { health: 8, energy: 2, attack: 0.5 } as const;
export const ATTRIBUTE_ORDER: AttributeId[] = ['vitality', 'strength', 'endurance', 'agility', 'focus'];
