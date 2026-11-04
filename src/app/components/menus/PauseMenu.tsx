import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useGameStore, type Panel } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { SettingsPanel } from '@/app/components/settings/SettingsPanel';
import { ControlsScreen } from '@/app/components/screens/ControlsScreen';
import { SkillTree } from '@/app/components/menus/SkillTree';
import { InventoryPanel } from '@/app/components/menus/InventoryPanel';
import { QuestPanel } from '@/app/components/menus/QuestPanel';

const TABS: { id: Panel; label: string }[] = [
  { id: 'root', label: 'Pause' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'skills', label: 'Skills' },
  { id: 'quests', label: 'Quests' },
  { id: 'settings', label: 'Settings' },
  { id: 'controls', label: 'Controls' },
];

export function PauseMenu(): ReactElement {
  const panel = useGameStore((s) => s.panel);
  const setPanel = useGameStore((s) => s.setPanel);
  const points = useGameStore((s) => s.profile.skillPoints);
  const [saving, setSaving] = useState<'idle' | 'ok' | 'fail'>('idle');
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, [panel]);

  return (
    <div className="screen pause" role="dialog" aria-label="Pause menu">
      <div className="card pause-card">
        <nav className="tabs" aria-label="Pause sections">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${panel === t.id ? 'on' : ''}`} onClick={() => setPanel(t.id)}>
              {t.label}{t.id === 'skills' && points > 0 ? <span className="badge">{points}</span> : null}
            </button>
          ))}
        </nav>
        <div className="pause-body">
          {panel === 'root' && (
            <div className="pause-root">
              <button ref={first} className="btn primary" onClick={() => gameApi.resume()}>Resume</button>
              <button className="btn" onClick={() => setPanel('inventory')}>Inventory</button>
              <button className="btn" onClick={() => setPanel('skills')}>Skills</button>
              <button className="btn" onClick={() => setPanel('quests')}>Quests</button>
              <button className="btn" onClick={() => setPanel('settings')}>Settings</button>
              <button
                className="btn"
                onClick={async () => { const ok = await gameApi.saveGame(); setSaving(ok ? 'ok' : 'fail'); }}
              >
                {saving === 'ok' ? 'Saved ✓' : saving === 'fail' ? 'Save failed' : 'Save Game'}
              </button>
              <button className="btn danger" onClick={() => void gameApi.returnToMenu()}>Main Menu</button>
              <p className="muted small">Progress is also auto-saved at lamps, level-ups and quests.</p>
            </div>
          )}
          {panel === 'inventory' && <InventoryPanel />}
          {panel === 'skills' && <SkillTree />}
          {panel === 'quests' && <QuestPanel />}
          {panel === 'settings' && <SettingsPanel />}
          {panel === 'controls' && <ControlsScreen />}
        </div>
      </div>
    </div>
  );
}
