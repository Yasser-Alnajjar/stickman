import type { ItemId } from '@/shared/types';
import { ITEMS, ITEM_ORDER } from '@/game/world/stores';

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  icon: string;
  usable: boolean;
}

/** Items every world shares. Story and trophy items are registered by the world pack that owns them. */
const CORE_ITEMS: ItemDef[] = [
  { id: 'health_tonic', name: 'Health Tonic', description: 'Restores 50% of maximum health. Hotkey: H', icon: '🧪', usable: true },
  { id: 'energy_cell', name: 'Energy Cell', description: 'Restores 60 energy. Hotkey: G', icon: '🔋', usable: true },
];
for (const d of CORE_ITEMS) ITEMS[d.id] = d;
ITEM_ORDER.unshift(...CORE_ITEMS.map((d) => d.id)); // core items always lead the inventory

export { ITEMS, ITEM_ORDER };

import '@/game/world/worlds';
