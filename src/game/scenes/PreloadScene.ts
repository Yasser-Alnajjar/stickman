import Phaser from 'phaser';
import { generateFxTextures } from '@/game/managers/Fx';
import { bus } from '@/game/events/bus';
import { loadPack } from '@/game/world/loader';
import { WORLD_PACKS } from '@/game/world/stores';

/** Generates the shared textures and loads world 1 (the menu is painted with its theme), reporting progress. */
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  create(): void {
    // Only the first world is needed now; every other world loads when the player gets close to it.
    const steps: (() => void | Promise<void>)[] = [
      () => generateFxTextures(this),
      () => loadPack(WORLD_PACKS[0].id),
    ];
    let i = 0;
    const next = async (): Promise<void> => {
      if (i >= steps.length) {
        this.scene.launch('Backdrop');
        this.scene.start('MainMenu');
        bus.emit('loading', 1);
        return;
      }
      try { await steps[i++](); } catch (e) { bus.emit('error', `Failed to build graphics: ${String(e)}`); throw e; }
      bus.emit('loading', i / steps.length);
      this.time.delayedCall(30, () => { void next(); });
    };
    void next();
  }
}
