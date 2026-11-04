import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { SettingsPanel } from '@/app/components/settings/SettingsPanel';
import { ControlsScreen } from '@/app/components/screens/ControlsScreen';
import { AboutScreen } from '@/app/components/screens/AboutScreen';
import { t } from '@/i18n';

export function MainMenu(): ReactElement {
  const panel = useGameStore((s) => s.panel);
  const setPanel = useGameStore((s) => s.setPanel);
  const hasSave = useGameStore((s) => s.hasSave);
  const [busy, setBusy] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, [panel]);

  if (panel !== 'root') {
    const titles = { settings: t('Settings'), controls: t('Controls'), about: t('About / Credits') } as Record<string, string>;
    return (
      <div className="screen center menu">
        <div className="card wide">
          <h2>{titles[panel] ?? ''}</h2>
          <div className="card-body">
          {panel === 'settings' && <SettingsPanel />}
          {panel === 'controls' && <ControlsScreen />}
          {panel === 'about' && <AboutScreen />}
          </div>
          <button ref={first} className="btn" onClick={() => setPanel('root')}>{t('Back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen menu">
      <div className="menu-column">
        <h1 className="logo">{t('STICKMAN')}</h1>
        <p className="subtitle">{t('OPEN WORLD FIGHTER')}</p>
        <button ref={first} className="btn primary" onClick={() => gameApi.newGame()}>{t('New Game')}</button>
        <button
          className="btn"
          disabled={!hasSave || busy}
          title={hasSave ? t('Load your most recent save') : t('No save found')}
          onClick={async () => { setBusy(true); await gameApi.continueGame(); setBusy(false); }}
        >
          {t('Continue')}
        </button>
        <button className="btn" onClick={() => setPanel('settings')}>{t('Settings')}</button>
        <button className="btn" onClick={() => setPanel('controls')}>{t('Controls')}</button>
        <button className="btn" onClick={() => setPanel('about')}>{t('About / Credits')}</button>
      </div>
    </div>
  );
}
