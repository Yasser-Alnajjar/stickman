import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { audio } from '@/game/managers/AudioManager';
import { isFullscreen, toggleFullscreen } from '@/app/fullscreen';
import type { ReactElement } from 'react';
import { useState } from 'react';

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }): ReactElement {
  return (
    <label className="setting">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
      <span className="val">{Math.round(value * 100)}</span>
    </label>
  );
}

export function SettingsPanel(): ReactElement {
  const a = useGameStore((s) => s.audio);
  const shake = useGameStore((s) => s.shake);
  const [fs, setFs] = useState(isFullscreen());
  const setAudio = (p: Partial<typeof a>): void => {
    gameApi.setAudio(p);
    useGameStore.setState({ audio: { ...audio.settings } });
  };
  return (
    <div className="settings">
      <Slider label="Master volume" value={a.master} onChange={(v) => setAudio({ master: v })} />
      <Slider label="Music volume" value={a.music} onChange={(v) => setAudio({ music: v })} />
      <Slider label="Effects volume" value={a.sfx} onChange={(v) => setAudio({ sfx: v })} />
      <label className="setting check">
        <input type="checkbox" checked={a.muted} onChange={(e) => setAudio({ muted: e.target.checked })} />
        <span>Mute all audio</span>
      </label>
      <label className="setting check">
        <input type="checkbox" checked={shake} onChange={(e) => { gameApi.setScreenShake(e.target.checked); useGameStore.setState({ shake: e.target.checked }); }} />
        <span>Screen shake</span>
      </label>
      <button className="btn" onClick={async () => { await toggleFullscreen(); setFs(isFullscreen()); }}>
        {fs ? 'Exit fullscreen' : 'Enter fullscreen'}
      </button>
    </div>
  );
}
