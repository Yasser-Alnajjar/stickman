import type { ItemId } from '@/shared/types';

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  icon: string;
  usable: boolean;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  health_tonic: { id: 'health_tonic', name: 'Health Tonic', description: 'Restores 50% of maximum health. Hotkey: H', icon: '🧪', usable: true },
  energy_cell: { id: 'energy_cell', name: 'Energy Cell', description: 'Restores 60 energy. Hotkey: G', icon: '🔋', usable: true },
  keycard: { id: 'keycard', name: 'Gate Keycard', description: 'A heavy access card for the Warden Gate.', icon: '🗝️', usable: false },
  warden_core: { id: 'warden_core', name: "Warden's Core", description: 'The glowing heart of the Iron Warden. A trophy of a hard fight.', icon: '💠', usable: false },
  tyrant_anchor: { id: 'tyrant_anchor', name: "Tyrant's Anchor", description: 'A barnacled anchor-link torn from Marrow\'s chain. Proof the docks are free.', icon: '⚓', usable: false },
  ember_heart: { id: 'ember_heart', name: 'Ember Heart', description: 'The still-burning core of Empress Ignis. The foundry finally goes cold.', icon: '🔥', usable: false },
};

export const ITEM_ORDER: ItemId[] = ['health_tonic', 'energy_cell', 'keycard', 'warden_core', 'tyrant_anchor', 'ember_heart'];
