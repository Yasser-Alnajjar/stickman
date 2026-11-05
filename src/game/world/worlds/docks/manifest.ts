import { COLORS } from '@/shared/constants';
import type { WorldPackMeta } from '../../types';
import { WORLD_WEAPONS } from '@/game/weapons/catalog/worlds';

/** Rust Docks: manifest (data only). The level geometry and painters live in ./content and load on demand. */
export const docksManifest: WorldPackMeta = {
  id: 'rust_docks',
  name: 'Rust Docks',
  description: 'A storm-battered harbour of cranes, containers and cutthroats, ruled by the Tyrant on his quay.',
  tagline: 'Cargo, cranes and cutthroats. Marrow rules the pier.',
  doorLabel: 'DOCKS',
  cityRegion: 'docks',
  arenaRegion: 'tyrant_arena',
  cityTheme: 'docks',
  arenaTheme: 'arena_marrow',
  boss: {
    id: 'marrow', name: 'Tyrant Marrow', subtitle: 'Harbor Lord of the Rust Docks', prefix: 'marrow',
    maxHealth: 760, attack: 12, defense: 5, width: 62, height: 170, walkSpeed: 118, xp: 700, gold: 260,
    drop: 'tyrant_anchor', phaseThresholds: [0.65, 0.3],
    patterns: [
      { id: 'combo', weight: 3 }, { id: 'volley', weight: 3 }, { id: 'slam', weight: 2 },
      { id: 'rain', weight: 3, from: 2 }, { id: 'charge', weight: 2, from: 2 },
    ],
    summon: { phase: 3, kinds: ['archer', 'guard'] },
    tempo: [1.1, 0.95, 0.8],
    style: { color: 0x3fb6c9, lineWidth: 12, scale: 1.95, accessory: 'anchor', accent: 0xffb454, headRadius: 11 },
    eye: 0xffb454,
    volley: { speed: 640, w: 46, h: 10, color: 0xffb454, heights: [26, 125], aim: false, rounds: [2, 3, 4], fan: [1, 1, 1] },
  },
  bossAttacks: {
    scale: 1.3,
    extras: {
      volley: { damage: 14, knockback: { x: 420, y: -200 } },                 // harpoons
      rain: { damage: 22, knockback: { x: 300, y: -420 }, hitStun: 600 },     // falling cargo
    },
  },
  items: [
    { id: 'tyrant_anchor', name: "Tyrant's Anchor", description: 'A barnacled anchor-link torn from Marrow\'s chain. Proof the docks are free.', icon: '⚓', usable: false },
  ],
  quests: [
    {
      id: 'dock_sweep', title: 'Sweep the Docks', world: 'rust_docks',
      summary: 'Thin out the dockside gangs before facing their lord.',
      objectives: [{ type: 'kill', target: 'archer', count: 4, label: 'Defeat Dock Slingers' }, { type: 'kill', target: 'guard', count: 3, label: 'Break Shield Guards' }],
      reward: { xp: 320, gold: 60, items: { health_tonic: 2, energy_cell: 1 } },
      hint: 'Slingers keep their distance: close in or block their shots. Heavy punches and abilities break shields.',
    },
    {
      id: 'defeat_marrow', title: 'Sink the Tyrant', world: 'rust_docks',
      summary: 'Defeat Tyrant Marrow on his quay.',
      objectives: [{ type: 'boss', target: 'marrow', count: 1, label: 'Defeat Tyrant Marrow' }],
      reward: { xp: 600, gold: 250 },
      hint: 'The quay lies past the pier. Rest at a lamp first.',
    },
  ],
  text: {
    'DOCKS': 'الأرصفة',
    'A storm-battered harbour of cranes, containers and cutthroats, ruled by the Tyrant on his quay.': 'ميناء عاصف من الرافعات والحاويات وقطّاع الطرق، يحكمه الطاغية من رصيفه.',
  },
  weapons: WORLD_WEAPONS.rust_docks,
  load: () => import('./content').then((m) => m.content),
};
