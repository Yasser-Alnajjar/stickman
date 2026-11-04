import type Phaser from 'phaser';
import type { WorldScene } from '@/game/scenes/WorldScene';

/** Late-bound handles used by the React-facing API. Scenes register themselves here. */
export const runtime: { game: Phaser.Game | null; world: WorldScene | null } = { game: null, world: null };
