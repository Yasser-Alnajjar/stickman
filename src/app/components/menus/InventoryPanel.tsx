import type { ReactElement } from 'react';
import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { ITEMS, ITEM_ORDER } from '@/game/config/items';
import { WeaponInventory } from '@/app/components/weapons/WeaponInventory';
import { t } from '@/i18n';

function Items(): ReactElement {
  const inv = useGameStore((s) => s.profile.inventory);
  const owned = ITEM_ORDER.filter((id) => (inv.items[id] ?? 0) > 0);
  return (
    <div className="inventory">
      <p className="gold">🪙 {inv.gold.toLocaleString()} {t('Gold Coins')}</p>
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

/** Inventory: consumables and trophies, plus the Weapons section (equip, compare, upgrade). */
export function InventoryPanel(): ReactElement {
  const [tab, setTab] = useState<'weapons' | 'items'>('weapons');
  return (
    <div className="inv-root">
      <nav className="subtabs" aria-label={t('Inventory sections')}>
        <button className={`subtab ${tab === 'weapons' ? 'on' : ''}`} aria-pressed={tab === 'weapons'} onClick={() => setTab('weapons')}>⚔ {t('Weapons')}</button>
        <button className={`subtab ${tab === 'items' ? 'on' : ''}`} aria-pressed={tab === 'items'} onClick={() => setTab('items')}>🎒 {t('Items')}</button>
      </nav>
      {tab === 'weapons' ? <WeaponInventory /> : <Items />}
    </div>
  );
}
