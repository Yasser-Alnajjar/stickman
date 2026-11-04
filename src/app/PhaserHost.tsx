import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame, resizeGame } from '@/game/createGame';
import { runtime } from '@/game/managers/runtime';

/** Owns the Phaser canvas. Everything else in React talks to the game through the API / event bus. */
export function PhaserHost(): ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const game: Phaser.Game = createGame(el);
    let raf = 0;
    const fit = (): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => resizeGame(game, el.clientWidth, el.clientHeight));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('orientationchange', fit);
    const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQuery.addEventListener?.('change', fit);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('orientationchange', fit);
      dprQuery.removeEventListener?.('change', fit);
      game.destroy(true);
      runtime.game = null;
      runtime.world = null;
    };
  }, []);

  return <div ref={ref} className="game-host" aria-label="Game canvas" />;
}
