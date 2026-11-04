import type { ReactElement } from 'react';
import { useDevice } from '@/app/mobile/device';
import { t } from '@/i18n';
const TOUCH_ROWS: [string, string][] = [
  ['◐', 'Left stick: move. Pull down to block'],
  ['⤒  👊  💥  🦶', 'Jump, light, heavy, kick'],
  ['⇢  ↺  🛡', 'Dash, dodge, block (hold)'],
  ['🔥  ⚡', 'Abilities (once unlocked)'],
  ['🧪  🔋  ❚❚', 'Health Tonic, Energy Cell, Pause'],
];
const ROWS: [string, string][] = [
  ['A / D  ·  ← / →', 'Move'],
  ['Space  ·  W  ·  ↑', 'Jump (hold for height). Down + Jump drops through ledges'],
  ['Shift', 'Dash (invulnerable at the start). Attack during a dash for a Dash Strike'],
  ['X  ·  C', 'Dodge roll (invulnerable)'],
  ['J', 'Light punch. Chain: J J J J = Punch → Punch → Roundhouse → Finisher'],
  ['K', 'Kick'],
  ['L', 'Heavy punch'],
  ['S  ·  ↓ (hold)', 'Block. Tap just before a hit lands for a PERFECT block'],
  ['1', 'Fire Punch (energy)'],
  ['2', 'Lightning Dash (energy)'],
  ['E', 'Talk / advance dialogue'],
  ['H  ·  G', 'Use Health Tonic  ·  Energy Cell'],
  ['Esc  ·  P  ·  Tab', 'Pause menu  ·  Skills'],
  ['F3', 'Show hitboxes (debug)'],
];

export function ControlsScreen(): ReactElement {
  const { touch } = useDevice();
  return (
    <div className="controls-grid">
      {touch && TOUCH_ROWS.map(([k, v]) => (
        <div className="control-row" key={k}><kbd>{k}</kbd><span>{t(v)}</span></div>
      ))}
      {ROWS.map(([k, v]) => (
        <div className="control-row" key={k}>
          <kbd>{k}</kbd>
          <span>{t(v)}</span>
        </div>
      ))}
    </div>
  );
}
