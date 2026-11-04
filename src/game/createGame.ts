import Phaser from 'phaser';
import { GRAVITY } from '@/shared/constants';
import { BootScene } from '@/game/scenes/BootScene';
import { PreloadScene } from '@/game/scenes/PreloadScene';
import { BackdropScene } from '@/game/scenes/BackdropScene';
import { MainMenuScene } from '@/game/scenes/MainMenuScene';
import { WorldScene } from '@/game/scenes/WorldScene';
import { detectDpr, setDpr } from '@/game/utils/viewport';
import { runtime } from '@/game/managers/runtime';

/**
 * Creates the Phaser game inside `parent`. The canvas is sized in device pixels (crisp vector rendering on
 * HiDPI screens) and shown at CSS size via `scale.zoom`; WebGL is preferred with automatic Canvas fallback.
 */
export function createGame(parent: HTMLElement): Phaser.Game {
  const dpr = detectDpr();
  setDpr(dpr);
  const w = Math.max(1, parent.clientWidth), h = Math.max(1, parent.clientHeight);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.round(w * dpr),
    height: Math.round(h * dpr),
    backgroundColor: '#070816',
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / dpr },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY }, fps: 60, debug: false } },
    render: { antialias: true, powerPreference: 'high-performance' },
    input: { keyboard: true, mouse: true, touch: true, gamepad: false },
    disableContextMenu: true,
    scene: [BootScene, PreloadScene, BackdropScene, MainMenuScene, WorldScene],
  });
  runtime.game = game;
  return game;
}

export function resizeGame(game: Phaser.Game, cssW: number, cssH: number): void {
  const dpr = detectDpr();
  setDpr(dpr);
  game.scale.setZoom(1 / dpr);
  game.scale.resize(Math.max(1, Math.round(cssW * dpr)), Math.max(1, Math.round(cssH * dpr)));
  // Phaser applies the CSS size one refresh late in NONE mode; set it explicitly so the canvas always matches its host.
  game.canvas.style.width = `${Math.round(cssW)}px`;
  game.canvas.style.height = `${Math.round(cssH)}px`;
}
