import type { ReactElement } from 'react';
import { t } from '@/i18n';
export function CreditsScreen(): ReactElement {
  return (
    <div className="credits">
      <p><strong>{t('STICKMAN')}: {t('OPEN WORLD FIGHTER')}</strong></p>
      <p>{t('Design, code, animation and audio: all original and procedural. No third-party assets.')}</p>
      <p className="muted">{t('Built with Phaser 3, React, TypeScript, Vite and Zustand.')}</p>
      <p className="muted">{t('Inspired by the feel of side-scrolling stickman action games.')}</p>
    </div>
  );
}
