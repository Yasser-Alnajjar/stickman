import type { ReactElement } from 'react';
import { t } from '@/i18n';

/** Shown on touch devices held in portrait. Never tries to lock orientation (unsupported on many browsers). */
export function RotateDevice(): ReactElement {
  return (
    <div className="rotate-screen" role="alertdialog" aria-live="assertive" aria-label={t('Rotate your device')}>
      <svg className="rotate-icon" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="20" y="8" width="24" height="44" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M10 40a24 24 0 0 0 40 8M54 40l-4 8-8-3" fill="none" stroke="var(--accent-2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2>{t('Rotate your device')}</h2>
      <p>{t('Stickman is played in landscape. Turn your phone sideways to continue.')}</p>
    </div>
  );
}
