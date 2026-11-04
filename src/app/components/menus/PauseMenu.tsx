import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useGameStore, type Panel } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { SettingsPanel } from '@/app/components/settings/SettingsPanel';
import { ControlsScreen } from '@/app/components/screens/ControlsScreen';
import { SkillTree } from '@/app/components/menus/SkillTree';
import { InventoryPanel } from '@/app/components/menus/InventoryPanel';
import { AboutScreen } from '@/app/components/screens/AboutScreen';
import { QuestPanel } from '@/app/components/menus/QuestPanel';
import { t as tr } from '@/i18n';

const TABS: { id: Panel; label: string }[] = [
  { id: 'root', label: 'Pause' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'skills', label: 'Skills' },
  { id: 'quests', label: 'Quests' },
  { id: 'settings', label: 'Settings' },
  { id: 'controls', label: 'Controls' },
  { id: 'about', label: 'About' },
];

export function PauseMenu(): ReactElement {
  const panel = useGameStore((s) => s.panel);
  const setPanel = useGameStore((s) => s.setPanel);
  const points = useGameStore((s) => s.profile.skillPoints);
  const [saving, setSaving] = useState<'idle' | 'ok' | 'fail'>('idle');
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, [panel]);

  return (
    <div className="screen pause" role="dialog" aria-label={tr('Pause')}>
      <div className="card pause-card">
        <nav className="tabs" aria-label="Pause sections">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${panel === t.id ? 'on' : ''}`} onClick={() => setPanel(t.id)}>
              {tr(t.label)}{t.id === 'skills' && points > 0 ? <span className="badge">{points}</span> : null}
            </button>
          ))}
        </nav>
        <div className="pause-body">
          {panel === 'root' && (
            <div className="pause-root">
              <button ref={first} className="btn primary" onClick={() => gameApi.resume()}>{tr('Resume')}</button>
              <button className="btn" onClick={() => setPanel('inventory')}>{tr('Inventory')}</button>
              <button className="btn" onClick={() => setPanel('skills')}>{tr('Skills')}</button>
              <button className="btn" onClick={() => setPanel('quests')}>{tr('Quests')}</button>
              <button className="btn" onClick={() => setPanel('settings')}>{tr('Settings')}</button>
              <button
                className="btn"
                onClick={async () => { const ok = await gameApi.saveGame(); setSaving(ok ? 'ok' : 'fail'); }}
              >
                {tr(saving === 'ok' ? 'Saved ✓' : saving === 'fail' ? 'Save failed' : 'Save Game')}
              </button>
              <button className="btn" onClick={() => setPanel('about')}>{tr('About / Credits')}</button>
              <button className="btn danger" onClick={() => void gameApi.returnToMenu()}>{tr('Main Menu')}</button>
              <p className="muted small">{tr('Progress is also auto-saved at lamps, level-ups and quests.')}</p>
            </div>
          )}
          {panel === 'inventory' && <InventoryPanel />}
          {panel === 'skills' && <SkillTree />}
          {panel === 'quests' && <QuestPanel />}
          {panel === 'settings' && <SettingsPanel />}
          {panel === 'controls' && <ControlsScreen />}
          {panel === 'about' && <AboutScreen />}
        </div>
      </div>
    </div>
  );
}
