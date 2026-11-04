import type { ReactElement } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { ITEMS, ITEM_ORDER } from '@/game/config/items';
import { t } from '@/i18n';

export function InventoryPanel(): ReactElement {
  const inv = useGameStore((s) => s.profile.inventory);
  const owned = ITEM_ORDER.filter((id) => (inv.items[id] ?? 0) > 0);
  return (
    <div className="inventory">
      <p className="gold">🪙 {inv.gold} {t('gold')}</p>
      {owned.length === 0 && <p className="muted">{t('Your pockets are empty. Defeat enemies and open chests.')}</p>}
      <ul className="item-list">
        {owned.map((id) => (
          <li key={id} className="item">
            <span className="item-icon">{ITEMS[id].icon}</span>
            <div className="grow"><strong>{t(ITEMS[id].name)}</strong> <span className="muted">×{inv.items[id]}</span><p className="small muted">{t(ITEMS[id].description)}</p></div>
            {ITEMS[id].usable && <button className="btn small-btn" onClick={() => gameApi.useItem(id)}>{t('Use')}</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
