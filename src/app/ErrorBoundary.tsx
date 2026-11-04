import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State { error: Error | null }

/** Last line of defence for the React UI: shows a recoverable error screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ui] render error', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="screen center" role="alert">
        <h2>Something went wrong</h2>
        <p className="muted">{this.state.error.message}</p>
        <button className="btn primary" onClick={() => window.location.reload()}>Reload game</button>
        <p className="muted small">Your last auto-save is kept.</p>
      </div>
    );
  }
}
