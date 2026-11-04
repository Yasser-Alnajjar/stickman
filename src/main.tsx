import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import '@/app/styles.css';

// StrictMode is intentionally not used: the Phaser game is a singleton created in an effect and a
// double mount/unmount in development would boot and destroy two engines.
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App /></ErrorBoundary>);
