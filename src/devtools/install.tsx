import { createRoot } from 'react-dom/client';
import { DevPanel } from './DevPanel';

let mounted = false;

/** Mounts the developer panel in its own React root, fully separate from the player-facing app. */
export function installDevTools(): void {
  if (mounted || typeof document === 'undefined') return;
  mounted = true;
  const host = document.createElement('div');
  host.id = 'stickman-devtools-root';
  document.body.appendChild(host);
  createRoot(host).render(<DevPanel />);
}
