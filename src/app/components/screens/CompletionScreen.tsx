import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { gameApi } from '@/game/managers/game-api';
import { getLang, LANGS, t } from '@/i18n';

/** Shown after the final available boss falls. The save has already completed; nothing here navigates automatically. */
export function CompletionScreen(): ReactElement {
  const btn = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { btn.current?.focus(); }, []);
  const dir = LANGS.find((l) => l.id === getLang())?.dir ?? 'ltr';
  return (
    <div className="screen center complete" role="dialog" aria-modal="true" aria-label={t('Congratulations!')} dir={dir}>
      <h1 className="complete-title">{t('Congratulations!')}</h1>
      <div className="complete-body">
        <p>{t('You have successfully completed all currently available stages!')}</p>
        <p className="muted">{t('Thank you for playing. We are currently working on adding more stages and exciting new adventures. Stay tuned for future updates!')}</p>
      </div>
      <button
        ref={btn}
        className="btn primary"
        disabled={busy}
        onClick={() => { setBusy(true); void gameApi.returnToMenu(); }}
      >
        {t('Return to Main Menu')}
      </button>
    </div>
  );
}
