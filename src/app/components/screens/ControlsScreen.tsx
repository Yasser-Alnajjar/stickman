import type { ReactElement } from 'react';
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
  return (
    <div className="controls-grid">
      {ROWS.map(([k, v]) => (
        <div className="control-row" key={k}>
          <kbd>{k}</kbd>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}
