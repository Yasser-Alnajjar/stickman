import type { ReactElement } from 'react';
import { useGameStore } from '@/store/game-store';
import { t } from '@/i18n';

export function LoadingScreen(): ReactElement {
  const p = useGameStore((s) => s.loading);
  return (
    <div className="screen center loading" role="status" aria-live="polite">
      <h1 className="logo">{t('STICKMAN')}</h1>
      <div className="bar" aria-label="Loading"><div className="bar-fill" style={{ width: `${Math.round(p * 100)}%` }} /></div>
      <p className="muted">{t('Forging the city…')}</p>
    </div>
  );
}
