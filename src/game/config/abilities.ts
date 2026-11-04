import type { AbilityId } from '@/shared/types';

export interface AbilityDef {
  id: AbilityId;
  name: string;
  description: string;
  icon: string;
  color: string;
  slot: 0 | 1;
  keyLabel: string;
  unlockLevel: number;
  maxRank: number;
  /** Skill-point cost to reach rank 1, 2, 3... */
  rankCosts: number[];
  /** Everything below is indexed by (rank - 1). */
  energyCost: number[];
  cooldown: number[];
  damage: number[];
  range: number[];
  rankNotes: string[];
}

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  fire_punch: {
    id: 'fire_punch',
    name: 'Fire Punch',
    description: 'A flaming uppercut that blasts enemies back and sets them alight.',
    icon: '🔥',
    color: '#ff7a1a',
    slot: 0,
    keyLabel: '1',
    unlockLevel: 1,
    maxRank: 3,
    rankCosts: [1, 1, 2],
    energyCost: [25, 22, 20],
    cooldown: [6000, 5200, 4400],
    damage: [24, 32, 40],
    range: [84, 96, 110],
    rankNotes: ['Fiery uppercut.', 'Adds burning: 5 damage/s for 3s.', 'Bigger flames, burning 8 damage/s for 4s.'],
  },
  lightning_dash: {
    id: 'lightning_dash',
    name: 'Lightning Dash',
    description: 'Blink forward as lightning, striking every enemy in your path. Invulnerable while dashing.',
    icon: '⚡',
    color: '#5cf0ff',
    slot: 1,
    keyLabel: '2',
    unlockLevel: 3,
    maxRank: 3,
    rankCosts: [1, 1, 2],
    energyCost: [30, 27, 24],
    cooldown: [5500, 4800, 4000],
    damage: [18, 25, 32],
    range: [320, 380, 440],
    rankNotes: ['Dash 320px, damages enemies in the path.', 'Longer dash and more damage.', 'Longest dash; stuns every enemy hit.'],
  },
};

export const ABILITY_ORDER: AbilityId[] = ['fire_punch', 'lightning_dash'];

export const FIRE_BURN: Record<number, { dps: number; duration: number } | undefined> = {
  1: undefined,
  2: { dps: 5, duration: 3000 },
  3: { dps: 8, duration: 4000 },
};
