// Everything weapon-related that other systems import. Loading it registers core weapons and (through the world
// manifests) every pack's weapons, in campaign order.
import './catalog/core';
import '@/game/world/worlds';

export * from './types';
export * from './stats';
export { WEAPONS, WEAPON_ORDER, STARTING_WEAPON, registerWeapon, validateWeaponDef, weaponDef } from './registry';
