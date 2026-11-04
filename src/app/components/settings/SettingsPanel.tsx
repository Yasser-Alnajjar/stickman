import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { audio } from '@/game/managers/AudioManager';
import { isFullscreen, toggleFullscreen } from '@/app/fullscreen';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { getTouchPref, setTouchPref, useDevice, type TouchPref } from '@/app/mobile/device';
import { t, setLang, useLang, LANGS, type Lang } from '@/i18n';

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
  const lang = useLang();
  useDevice();
  const setAudio = (p: Partial<typeof a>): void => {
    gameApi.setAudio(p);
    useGameStore.setState({ audio: { ...audio.settings } });
  };
  return (
    <div className="settings">
      <label className="setting">
        <span>{t('Language')}</span>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label={t('Language')}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <span />
      </label>
      <label className="setting">
        <span>{t('Touch controls')}</span>
        <select value={getTouchPref()} onChange={(e) => setTouchPref(e.target.value as TouchPref)} aria-label={t('Touch controls')}>
          <option value="auto">{t('Auto')}</option>
          <option value="on">{t('Always on')}</option>
          <option value="off">{t('Off')}</option>
        </select>
        <span />
      </label>
      <Slider label={t('Master volume')} value={a.master} onChange={(v) => setAudio({ master: v })} />
      <Slider label={t('Effects volume')} value={a.sfx} onChange={(v) => setAudio({ sfx: v })} />
      <label className="setting check">
        <input type="checkbox" checked={a.muted} onChange={(e) => setAudio({ muted: e.target.checked })} />
        <span>{t('Mute all audio')}</span>
      </label>
      <label className="setting check">
        <input type="checkbox" checked={shake} onChange={(e) => { gameApi.setScreenShake(e.target.checked); useGameStore.setState({ shake: e.target.checked }); }} />
        <span>{t('Screen shake')}</span>
      </label>
      <button className="btn" onClick={async () => { await toggleFullscreen(); setFs(isFullscreen()); }}>
        {t(fs ? 'Exit fullscreen' : 'Enter fullscreen')}
      </button>
    </div>
  );
}
