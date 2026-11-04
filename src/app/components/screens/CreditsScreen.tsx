import type { ReactElement } from 'react';
export function CreditsScreen(): ReactElement {
  return (
    <div className="credits">
      <p><strong>Stickman: Open World Fighter</strong></p>
      <p>Design, code, animation and audio: all original and procedural. No third-party assets.</p>
      <p className="muted">Built with Phaser 3, React, TypeScript, Vite and Zustand.</p>
      <p className="muted">Inspired by the feel of side-scrolling stickman action games.</p>
    </div>
  );
}
