import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { hiddenShopCount, shopEntries, type ShopEntry } from '@/game/weapons/shop';
import { t } from '@/i18n';
import { Coins, RarityTag } from './WeaponParts';
import { WeaponDetail } from './WeaponDetail';

const STATUS_TEXT: Record<ShopEntry['status'], string> = {
  equipped: '✓ Equipped', owned: '✓ Owned', available: 'Available', unaffordable: 'Too expensive', locked: '🔒 Locked',
};

/** The Weapon Shop: browse, compare and buy weapons with Gold Coins. Stock grows as worlds are reached. */
export function WeaponShop(): ReactElement {
  const profile = useGameStore((s) => s.profile);
  const entries = useMemo(() => shopEntries(profile), [profile]);
  const [picked, setPicked] = useState<string | null>(null);
  const hidden = hiddenShopCount(profile);
  const sel = entries.find((e) => e.def.id === picked) ?? entries[0];

  return (
    <div className="shop">
      <div className="shop-bar">
        <h3>🛒 {t('Weapon Shop')}</h3>
        <p className="gold" aria-live="polite">{t('Your coins')}: <Coins n={profile.inventory.gold} big /></p>
      </div>
      <div className="wlayout">
        <div className="wlist-col">
          <ul className="wlist">
            {entries.map((e) => (
              <li key={e.def.id}>
                <button className={`wrow ${sel?.def.id === e.def.id ? 'on' : ''} ${e.status === 'locked' ? 'locked' : ''}`} aria-pressed={sel?.def.id === e.def.id} onClick={() => setPicked(e.def.id)}>
                  <span className="wicon" aria-hidden="true">{e.def.icon}</span>
                  <span className="grow">
                    <strong>{t(e.def.name)}</strong>
                    <span className="small muted wrow-sub"><RarityTag rarity={e.def.rarity} /></span>
                  </span>
                  <span className="wprice">
                    <Coins n={e.price} />
                    <span className={`small status ${e.status}`}>{t(STATUS_TEXT[e.status])}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {hidden > 0 && <p className="small muted">❔ {t('{n} more weapons to discover as you progress', { n: hidden })}</p>}
        </div>
        <div className="wdetail-col">
          {sel ? <WeaponDetail def={sel.def} profile={profile} mode="shop" key={`${sel.def.id}:${sel.status}`} /> : <p className="muted">{t('The shop is empty.')}</p>}
        </div>
      </div>
    </div>
  );
}
