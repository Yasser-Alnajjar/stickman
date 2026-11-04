import Phaser from 'phaser';
import { generateFxTextures } from '@/game/managers/Fx';
import { bus } from '@/game/events/bus';

/** Generates every texture procedurally (no external assets), reporting progress to the loading screen. */
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  create(): void {
    const steps: (() => void)[] = [
      () => generateFxTextures(this),
      // World backdrops are painted lazily per theme by BackdropScene, so adding a world needs no change here.
    ];
    let i = 0;
    const next = (): void => {
      if (i >= steps.length) {
        this.scene.launch('Backdrop');
        this.scene.start('MainMenu');
        bus.emit('loading', 1);
        return;
      }
      try { steps[i++](); } catch (e) { bus.emit('error', `Failed to build graphics: ${String(e)}`); throw e; }
      bus.emit('loading', i / steps.length);
      this.time.delayedCall(30, next);
    };
    next();
  }
}
