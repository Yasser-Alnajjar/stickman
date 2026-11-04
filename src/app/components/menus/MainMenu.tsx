import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { SettingsPanel } from '@/app/components/settings/SettingsPanel';
import { ControlsScreen } from '@/app/components/screens/ControlsScreen';
import { CreditsScreen } from '@/app/components/screens/CreditsScreen';

export function MainMenu(): ReactElement {
  const panel = useGameStore((s) => s.panel);
  const setPanel = useGameStore((s) => s.setPanel);
  const hasSave = useGameStore((s) => s.hasSave);
  const [busy, setBusy] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, [panel]);

  if (panel !== 'root') {
    const titles = { settings: 'Settings', controls: 'Controls', credits: 'Credits' } as Record<string, string>;
    return (
      <div className="screen center menu">
        <div className="card wide">
          <h2>{titles[panel] ?? ''}</h2>
          {panel === 'settings' && <SettingsPanel />}
          {panel === 'controls' && <ControlsScreen />}
          {panel === 'credits' && <CreditsScreen />}
          <button ref={first} className="btn" onClick={() => setPanel('root')}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen menu">
      <div className="menu-column">
        <h1 className="logo">STICKMAN</h1>
        <p className="subtitle">OPEN WORLD FIGHTER</p>
        <button ref={first} className="btn primary" onClick={() => gameApi.newGame()}>New Game</button>
        <button
          className="btn"
          disabled={!hasSave || busy}
          title={hasSave ? 'Load your most recent save' : 'No save found'}
          onClick={async () => { setBusy(true); await gameApi.continueGame(); setBusy(false); }}
        >
          Continue
        </button>
        <button className="btn" onClick={() => setPanel('settings')}>Settings</button>
        <button className="btn" onClick={() => setPanel('controls')}>Controls</button>
        <button className="btn" onClick={() => setPanel('credits')}>Credits</button>
      </div>
    </div>
  );
}
