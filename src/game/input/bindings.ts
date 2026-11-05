/**
 * Keyboard bindings for the weapon actions, kept out of the combat code. Values are Phaser key names
 * (`Phaser.Input.Keyboard.KeyCodes`). Touch controls drive the same intents through `touchInput`.
 */
export const WEAPON_BINDINGS = {
  special: ['E'],
  weaponNext: ['R'],
  weaponPrev: ['Q'],
} as const;

export type WeaponAction = keyof typeof WEAPON_BINDINGS;
