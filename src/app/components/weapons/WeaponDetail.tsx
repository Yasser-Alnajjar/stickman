import type { ReactElement } from 'react';
import { useState } from 'react';
import type { ProfileData } from '@/shared/types';
import { WEAPONS } from '@/game/weapons/registry';
import { summarize, nextUpgradeCost, MAX_WEAPON_LEVEL } from '@/game/weapons/stats';
import { equippedId } from '@/game/weapons/ownership';
import { describeSource, shopLockText, trend, weaponView } from '@/game/weapons/info';
import { shopEntries, shopSource } from '@/game/weapons/shop';
import { gameApi } from '@/game/managers/game-api';
import { t } from '@/i18n';
import { CategoryTag, Coins, Delta, RarityTag } from './WeaponParts';
import type { WeaponDef } from '@/game/weapons/types';

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function Stat({ label, value, cmp, base }: { label: string; value: string; cmp?: number; base?: number }): ReactElement {
  return (
    <div className="wstat">
      <dt>{t(label)}</dt>
      <dd>{value}{cmp !== undefined && base !== undefined ? <Delta trend={trend(cmp, base)} /> : null}</dd>
    </div>
  );
}

/**
 * Everything about one weapon: identity, stats compared with the equipped weapon, the special ability, where to get it,
 * and the actions that make sense in context (equip / upgrade in the inventory, buy in the shop).
 */
export function WeaponDetail({ def, profile, mode }: { def: WeaponDef; profile: ProfileData; mode: 'inventory' | 'shop' }): ReactElement {
  const view = weaponView(profile, def);
  const eq = WEAPONS[equippedId(profile)];
  const eqSum = summarize(eq, profile.weapons.levels[eq.id] ?? 1);
  const isEq = eq.id === def.id;
  const s = view.summary;
  const gold = profile.inventory.gold;
  const [confirming, setConfirming] = useState(false);
  const shop = shopSource(def);
  const entry = shop ? shopEntries(profile).find((e) => e.def.id === def.id) : undefined;

  const nextCost = view.owned ? nextUpgradeCost(def, view.level) : null;
  const nextSum = view.owned && nextCost !== null ? summarize(def, view.level + 1) : null;

  return (
    <article className="wdetail" aria-label={t(def.name)}>
      <header className="whead">
        <span className="wicon" aria-hidden="true">{def.icon}</span>
        <div className="grow">
          <h4>{t(def.name)}</h4>
          <div className="wtags"><CategoryTag category={def.category} icon={def.icon} /><RarityTag rarity={def.rarity} />
            {view.owned && <span className="tag good">{isEq ? `✓ ${t('Equipped')}` : t('Owned')}</span>}
            {!view.owned && <span className="tag">🔒 {t('Locked')}</span>}
          </div>
        </div>
      </header>
      <p className="small">{t(def.description)}</p>

      <dl className="wstats">
        <Stat label="Damage" value={fmt(s.damage)} cmp={isEq ? undefined : s.damage} base={eqSum.damage} />
        <Stat label="Attack speed" value={t('{n} hits/s', { n: fmt(s.attackSpeed) })} cmp={isEq ? undefined : s.attackSpeed} base={eqSum.attackSpeed} />
        <Stat label="Range" value={t('{n} px', { n: s.range })} cmp={isEq ? undefined : s.range} base={eqSum.range} />
        <Stat label="Upgrade level" value={`${view.level} / ${def.maxLevel}`} />
      </dl>
      {!isEq && <p className="small muted">{t('Compared with your equipped weapon: {name}', { name: t(eq.name) })}</p>}

      <div className="wspecial">
        <strong>✦ {t('Special')}: {t(def.special.name)}</strong>
        <p className="small">{t(def.special.description)}</p>
        <p className="small muted">{t('Cooldown {n}s', { n: fmt(s.specialCooldown / 1000) })} · {t('Energy {n}', { n: s.specialCost })}</p>
      </div>

      <div className="wsource">
        <strong>{t('How to get it')}</strong>
        <ul>
          {def.sources.map((src, i) => {
            const d = describeSource(src);
            return <li key={i} className="small">{t(d.key, { ...d.vars, name: typeof d.vars.name === 'string' ? t(d.vars.name) : d.vars.name })}</li>;
          })}
        </ul>
        {entry?.status === 'locked' && entry.requiresPack && <p className="small warn">🔒 {t(shopLockText(entry.requiresPack).key, { name: t(String(shopLockText(entry.requiresPack).vars.name)) })}</p>}
      </div>

      {mode === 'inventory' && view.owned && (
        <div className="wactions">
          <button className="btn primary" disabled={isEq} aria-disabled={isEq} onClick={() => gameApi.equipWeapon(def.id)}>
            {isEq ? `✓ ${t('Equipped')}` : t('Equip')}
          </button>
          {nextCost !== null && nextSum ? (
            <div className="wupgrade">
              <p className="small">
                <strong>{t('Next level')} {view.level + 1}/{MAX_WEAPON_LEVEL}:</strong>{' '}
                {t('Damage')} {fmt(s.damage)} → {fmt(nextSum.damage)} · {t('Attack speed')} {fmt(s.attackSpeed)} → {fmt(nextSum.attackSpeed)}
              </p>
              <button className="btn" disabled={gold < nextCost} aria-disabled={gold < nextCost} onClick={() => gameApi.upgradeWeapon(def.id)}>
                {t('Upgrade')} · <Coins n={nextCost} />
              </button>
              {gold < nextCost && <p className="small warn">{t('Need {n} more coins', { n: nextCost - gold })}</p>}
            </div>
          ) : <p className="small good">★ {t('Maximum level')}</p>}
        </div>
      )}

      {mode === 'shop' && shop && entry && (
        <div className="wactions">
          <p className="price">{t('Price')}: <Coins n={shop.price} big /></p>
          {entry.status === 'equipped' || entry.status === 'owned' ? (
            <button className="btn" disabled aria-disabled>{entry.status === 'equipped' ? `✓ ${t('Equipped')}` : `✓ ${t('Owned')}`}</button>
          ) : entry.status === 'locked' ? (
            <button className="btn" disabled aria-disabled>🔒 {t('Locked')}</button>
          ) : confirming ? (
            <div className="wconfirm" role="alertdialog" aria-label={t('Confirm purchase')}>
              <p className="small">{t('Buy {name} for {n} coins?', { name: t(def.name), n: shop.price })}</p>
              <button className="btn primary" onClick={() => { setConfirming(false); gameApi.buyWeapon(def.id); }}>{t('Confirm purchase')}</button>
              <button className="btn" onClick={() => setConfirming(false)}>{t('Cancel')}</button>
            </div>
          ) : (
            <>
              <button className="btn primary" disabled={entry.status === 'unaffordable'} aria-disabled={entry.status === 'unaffordable'} onClick={() => setConfirming(true)}>
                {t('Buy')} · <Coins n={shop.price} />
              </button>
              {entry.status === 'unaffordable' && <p className="small warn">{t('Not enough coins')} — {t('Need {n} more coins', { n: shop.price - gold })}</p>}
            </>
          )}
        </div>
      )}
    </article>
  );
}
