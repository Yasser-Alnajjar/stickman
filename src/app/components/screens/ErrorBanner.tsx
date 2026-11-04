import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useGameStore } from '@/store/game-store';

export function ErrorBanner(): ReactElement | null {
  const error = useGameStore((s) => s.error);
  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => useGameStore.setState({ error: null }), 6000);
    return () => window.clearTimeout(t);
  }, [error]);
  if (!error) return null;
  return (
    <div className="error-banner" role="alert">
      {error}
      <button className="link" onClick={() => useGameStore.setState({ error: null })}>Dismiss</button>
    </div>
  );
}
