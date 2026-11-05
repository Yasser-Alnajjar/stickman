import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { WEAPONS, WEAPON_ORDER } from '@/game/weapons/registry';
import { equippedId, owns } from '@/game/weapons/ownership';
import { weaponView } from '@/game/weapons/info';
import { t } from '@/i18n';
import { Coins, RarityTag } from './WeaponParts';
import { WeaponDetail } from './WeaponDetail';

/** The Weapons section of the Inventory: owned weapons first, then the locked ones that are already known about. */
export function WeaponInventory(): ReactElement {
  const profile = useGameStore((s) => s.profile);
  const [picked, setPicked] = useState<string | null>(null);
  const eq = equippedId(profile);
  const rows = useMemo(() => WEAPON_ORDER.map((id) => weaponView(profile, WEAPONS[id])), [profile]);
  const owned = rows.filter((r) => r.owned);
  const locked = rows.filter((r) => !r.owned && r.revealed);
  const hidden = rows.filter((r) => !r.owned && !r.revealed).length;
  const selected = WEAPONS[picked && WEAPONS[picked] ? picked : eq];

  const renderRow = (r: (typeof rows)[number]): ReactElement => (
    <li key={r.def.id}>
      <button className={`wrow ${selected.id === r.def.id ? 'on' : ''} ${r.owned ? '' : 'locked'}`} aria-pressed={selected.id === r.def.id} onClick={() => setPicked(r.def.id)}>
        <span className="wicon" aria-hidden="true">{r.def.icon}</span>
        <span className="grow">
          <strong>{t(r.def.name)}</strong>
          <span className="small muted wrow-sub"><RarityTag rarity={r.def.rarity} />{r.owned ? ` · ${t('Level')} ${r.level}` : ''}</span>
        </span>
        {r.def.id === eq ? <span className="tag good">✓ {t('Equipped')}</span> : !r.owned ? <span className="tag">🔒</span> : null}
      </button>
    </li>
  );

  return (
    <div className="wlayout">
      <div className="wlist-col">
        <p className="gold"><Coins n={profile.inventory.gold} big /> <span className="muted small">{t('Gold Coins')}</span></p>
        <h4 className="wsec">{t('Owned weapons')} ({owned.length})</h4>
        <ul className="wlist">{owned.map(renderRow)}</ul>
        {locked.length > 0 && <h4 className="wsec muted">{t('Locked weapons')}</h4>}
        <ul className="wlist">{locked.map(renderRow)}</ul>
        {hidden > 0 && <p className="small muted">❔ {t('{n} more weapons to discover as you progress', { n: hidden })}</p>}
      </div>
      <div className="wdetail-col">
        <WeaponDetail def={selected} profile={profile} mode="inventory" key={`${selected.id}:${owns(profile, selected.id)}`} />
      </div>
    </div>
  );
}
