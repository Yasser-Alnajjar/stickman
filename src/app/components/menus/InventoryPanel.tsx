import type { ReactElement } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { ITEMS, ITEM_ORDER } from '@/game/config/items';

export function InventoryPanel(): ReactElement {
  const inv = useGameStore((s) => s.profile.inventory);
  const owned = ITEM_ORDER.filter((id) => (inv.items[id] ?? 0) > 0);
  return (
    <div className="inventory">
      <p className="gold">🪙 {inv.gold} gold</p>
      {owned.length === 0 && <p className="muted">Your pockets are empty. Defeat enemies and open chests.</p>}
      <ul className="item-list">
        {owned.map((id) => (
          <li key={id} className="item">
            <span className="item-icon">{ITEMS[id].icon}</span>
            <div className="grow"><strong>{ITEMS[id].name}</strong> <span className="muted">×{inv.items[id]}</span><p className="small muted">{ITEMS[id].description}</p></div>
            {ITEMS[id].usable && <button className="btn small-btn" onClick={() => gameApi.useItem(id)}>Use</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
