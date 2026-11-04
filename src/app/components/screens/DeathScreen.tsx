import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { gameApi } from '@/game/managers/game-api';
import { t } from '@/i18n';

export function DeathScreen(): ReactElement {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus(); }, []);
  return (
    <div className="screen center death" role="dialog" aria-label={t('YOU DIED')}>
      <h1 className="death-title">{t('YOU DIED')}</h1>
      <p className="muted">{t('You will return to your last lamp.')}</p>
      <button ref={btn} className="btn primary" onClick={() => gameApi.respawn()}>{t('Respawn')}</button>
      <button className="btn" onClick={() => void gameApi.returnToMenu()}>{t('Main menu')}</button>
    </div>
  );
}
