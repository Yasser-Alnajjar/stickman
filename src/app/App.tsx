import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { PhaserHost } from '@/app/PhaserHost';
import { bindGameToStore } from '@/app/bindings';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { audio } from '@/game/managers/AudioManager';
import { bus } from '@/game/events/bus';
import { MainMenu } from '@/app/components/menus/MainMenu';
import { PauseMenu } from '@/app/components/menus/PauseMenu';
import { Hud } from '@/app/components/hud/Hud';
import { LoadingScreen } from '@/app/components/screens/LoadingScreen';
import { DeathScreen } from '@/app/components/screens/DeathScreen';
import { ErrorBanner } from '@/app/components/screens/ErrorBanner';
import { t, useLang } from '@/i18n';

/** Remounted when the language changes so every string re-renders; the Phaser canvas is a sibling and is untouched. */
function Overlays({ play }: { play: string }): ReactElement {
  return (
    <>
      {(play === 'playing' || play === 'paused' || play === 'dead') && <Hud />}
      {play === 'loading' && <LoadingScreen />}
      {play === 'menu' && <MainMenu />}
      {play === 'paused' && <PauseMenu />}
      {play === 'dead' && <DeathScreen />}
      <ErrorBanner />
    </>
  );
}

export function App(): ReactElement {
  const play = useGameStore((s) => s.play);
  const lang = useLang();

  // One-time wiring: event bus -> store, audio unlock, global keys. A single cleanup removes everything.
  useEffect(() => {
    const unbind = bindGameToStore();
    const unlockAudio = audio.installUnlockListeners();
    void gameApi.refreshSaveInfo();

    const onKey = (e: KeyboardEvent): void => {
      const state = useGameStore.getState().play;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (state === 'playing') { e.preventDefault(); gameApi.pause(); }
        else if (state === 'paused') {
          e.preventDefault();
          const { panel, setPanel } = useGameStore.getState();
          if (panel === 'root') gameApi.resume(); else setPanel('root');
        }
      } else if (e.key === 'Tab' && state === 'playing') {
        e.preventDefault();
        gameApi.pause();
        useGameStore.getState().setPanel('skills');
      }
    };
    const onVisibility = (): void => {
      if (document.hidden && useGameStore.getState().play === 'playing') gameApi.pause();
    };
    const onError = (e: ErrorEvent): void => { console.error(e.error ?? e.message); bus.emit('error', t('An unexpected error occurred. The game will try to keep running.')); };
    const onRejection = (e: PromiseRejectionEvent): void => { console.error(e.reason); bus.emit('error', t('An operation failed unexpectedly.')); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      unbind();
      unlockAudio();
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="app">
      <PhaserHost />
      <Overlays key={lang} play={play} />
    </div>
  );
}
