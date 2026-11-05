import type { ReactElement } from 'react';
import { RARITY_CSS, RARITY_LABEL, RARITY_MARK, CATEGORY_LABEL } from '@/game/weapons/presentation';
import type { Rarity, WeaponCategory } from '@/game/weapons/types';
import type { StatTrend } from '@/game/weapons/info';
import { t } from '@/i18n';

/** Rarity is shown as colour + a shape mark + a text label, so it never depends on colour alone. */
export function RarityTag({ rarity }: { rarity: Rarity }): ReactElement {
  return (
    <span className="rarity-tag" style={{ ['--rc' as string]: RARITY_CSS[rarity] }}>
      <span aria-hidden="true">{RARITY_MARK[rarity]}</span> {t(RARITY_LABEL[rarity])}
    </span>
  );
}

export function CategoryTag({ category, icon }: { category: WeaponCategory; icon: string }): ReactElement {
  return <span className="cat-tag"><span aria-hidden="true">{icon}</span> {t(CATEGORY_LABEL[category])}</span>;
}

const ARROW: Record<StatTrend, string> = { up: '▲', down: '▼', same: '=' };
const TREND_LABEL: Record<StatTrend, string> = { up: 'Higher than equipped', down: 'Lower than equipped', same: 'Same as equipped' };

/** Comparison marker with an arrow glyph and a screen-reader label (not colour only). */
export function Delta({ trend, text }: { trend: StatTrend; text?: string }): ReactElement {
  return <span className={`delta ${trend}`} title={t(TREND_LABEL[trend])}><span aria-hidden="true">{ARROW[trend]}</span>{text ? ` ${text}` : ''}<span className="sr-only">{t(TREND_LABEL[trend])}</span></span>;
}

export function Coins({ n, big }: { n: number; big?: boolean }): ReactElement {
  return <span className={`coins ${big ? 'big' : ''}`}><span aria-hidden="true">🪙</span> {n.toLocaleString()}</span>;
}
