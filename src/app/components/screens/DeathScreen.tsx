import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { gameApi } from '@/game/managers/game-api';

export function DeathScreen(): ReactElement {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus(); }, []);
  return (
    <div className="screen center death" role="dialog" aria-label="You died">
      <h1 className="death-title">YOU DIED</h1>
      <p className="muted">You will return to your last lamp.</p>
      <button ref={btn} className="btn primary" onClick={() => gameApi.respawn()}>Respawn</button>
      <button className="btn" onClick={() => void gameApi.returnToMenu()}>Main menu</button>
    </div>
  );
}
