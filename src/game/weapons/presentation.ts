import type { Rarity, WeaponCategory } from './types';

/** Rarity colours for effects and badges. UI always pairs them with a text label and an icon: colour is never the only cue. */
export const RARITY_COLOR: Record<Rarity, number> = {
  common: 0xcfd6e6, uncommon: 0x7dffa0, rare: 0x6aa8ff, epic: 0xc58bff, legendary: 0xffc24a,
};
export const RARITY_CSS: Record<Rarity, string> = {
  common: '#cfd6e6', uncommon: '#7dffa0', rare: '#6aa8ff', epic: '#c58bff', legendary: '#ffc24a',
};
/** Shape cue paired with the colour. */
export const RARITY_MARK: Record<Rarity, string> = { common: '●', uncommon: '◆', rare: '★', epic: '✦', legendary: '👑' };
export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
};
export const CATEGORY_LABEL: Record<WeaponCategory, string> = {
  fists: 'Fists', sword: 'Sword', daggers: 'Dual Daggers', axe: 'Battle Axe', spear: 'Spear', staff: 'Magic Staff', hammer: 'War Hammer',
};
export const CATEGORY_IDENTITY: Record<WeaponCategory, string> = {
  fists: 'Fast and reliable, no resource cost.',
  sword: 'Balanced melee weapon.',
  daggers: 'Very fast attacks and long combos at short range.',
  axe: 'Heavy damage that breaks shields.',
  spear: 'Long reach for spacing and piercing thrusts.',
  staff: 'Ranged elemental attacks that cost energy.',
  hammer: 'Very slow, crushing blows that stagger crowds.',
};
