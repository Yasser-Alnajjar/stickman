import { COLORS } from '@/shared/constants';
import type { WorldPackMeta } from '../../types';
import { WORLD_WEAPONS } from '@/game/weapons/catalog/worlds';

/** Ember Foundry: manifest (data only). The level geometry and painters live in ./content and load on demand. */
export const foundryManifest: WorldPackMeta = {
  id: 'ember_foundry',
  name: 'Ember Foundry',
  description: 'A volcanic forge-fortress of gears, lava and molten steel, where the Empress keeps her throne.',
  tagline: 'The forges never cool. Ignis awaits at the heart.',
  doorLabel: 'FOUNDRY',
  cityRegion: 'foundry',
  arenaRegion: 'empress_arena',
  cityTheme: 'foundry',
  arenaTheme: 'arena_ignis',
  boss: {
    id: 'ignis', name: 'Empress Ignis', subtitle: 'Sovereign of the Ember Foundry', prefix: 'ignis',
    maxHealth: 1000, attack: 15, defense: 6, width: 50, height: 158, walkSpeed: 130, xp: 1200, gold: 450,
    drop: 'ember_heart', phaseThresholds: [0.7, 0.35],
    patterns: [
      { id: 'combo', weight: 2 }, { id: 'teleport', weight: 3 }, { id: 'pillars', weight: 3 },
      { id: 'volley', weight: 2, from: 2 }, { id: 'whirl', weight: 2, from: 2 }, { id: 'leap', weight: 2, from: 3 },
    ],
    summon: { phase: 3, kinds: ['blade', 'blade'] },
    tempo: [1, 0.85, 0.7],
    style: { color: 0xff7a2a, lineWidth: 9, scale: 1.8, accessory: 'crown', accent: 0xfff2a0, headRadius: 10 },
    eye: 0xfff2a0,
    volley: { speed: 470, w: 26, h: 26, color: 0xff7a2a, heights: [70], aim: true, rounds: [2, 2, 3], fan: [1, 3, 3], burn: { dps: 6, duration: 2500 } },
  },
  bossAttacks: {
    scale: 1.6,
    extras: {
      volley: { damage: 14, knockback: { x: 380, y: -200 } },                 // fireballs
      pillars: { damage: 20, knockback: { x: 260, y: -520 }, hitStun: 600 },  // flame pillars
      whirl: { damage: 16, knockback: { x: 520, y: -260 }, hitStun: 500 },    // spin
      strike: {                                                               // teleport ambush
        damage: 24, hitbox: { w: 170, h: 130, ox: 100, oy: -10 }, startup: 380, active: 130, recovery: 650,
        knockback: { x: 700, y: -340 }, hitStun: 560, telegraph: true,
      },
    },
  },
  items: [
    { id: 'ember_heart', name: 'Ember Heart', description: 'The still-burning core of Empress Ignis. The foundry finally goes cold.', icon: '🔥', usable: false },
  ],
  quests: [
    {
      id: 'foundry_purge', title: 'Purge the Foundry', world: 'ember_foundry',
      summary: 'Cut down the Empress\'s elite guard.',
      objectives: [{ type: 'kill', target: 'blade', count: 5, label: 'Defeat Night Blades' }, { type: 'kill', target: 'heavy', count: 3, label: 'Defeat Iron Brutes' }],
      reward: { xp: 650, gold: 120, items: { health_tonic: 3, energy_cell: 2 } },
      hint: 'Blades dodge when you swing. Bait the dodge, then strike.',
    },
    {
      id: 'defeat_ignis', title: 'Extinguish the Empress', world: 'ember_foundry',
      summary: 'Defeat Empress Ignis in her throne room.',
      objectives: [{ type: 'boss', target: 'ignis', count: 1, label: 'Defeat Empress Ignis' }],
      reward: { xp: 1200, gold: 500 },
      hint: 'The throne room lies at the east end of the foundry. Rest at a lamp first.',
    },
  ],
  text: {
    'A volcanic forge-fortress of gears, lava and molten steel, where the Empress keeps her throne.': 'قلعة مسبك بركانية من التروس والحمم والفولاذ المصهور، حيث تحتفظ الإمبراطورة بعرشها.',
  },
  weapons: WORLD_WEAPONS.ember_foundry,
  load: () => import('./content').then((m) => m.content),
};
