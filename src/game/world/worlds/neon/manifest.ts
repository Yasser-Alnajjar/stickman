import { COLORS } from '@/shared/constants';
import type { WorldPackMeta } from '../../types';
import { WORLD_WEAPONS } from '@/game/weapons/catalog/worlds';

/** Neon Street: manifest (data only). The level geometry and painters live in ./content and load on demand. */
export const neonManifest: WorldPackMeta = {
  id: 'neon_street',
  name: 'Neon Street',
  description: 'A rain-lit megacity where gang lords rule the rooftops. Fight through the plaza, the market and the warehouse district to the Warden Gate.',
  tagline: 'Find allies. Clear the streets. Open the Warden Gate.',
  doorLabel: 'NEON',
  cityRegion: 'city',
  arenaRegion: 'boss_arena',
  cityTheme: 'neon',
  arenaTheme: 'arena_warden',
  boss: {
    id: 'warden', name: 'Iron Warden Kaizo', subtitle: 'Guardian of the City Gate', prefix: 'boss',
    maxHealth: 480, attack: 8, defense: 3, width: 56, height: 160, walkSpeed: 105, xp: 400, gold: 150,
    drop: 'warden_core', phaseThresholds: [0.66, 0.33],
    patterns: [{ id: 'combo', weight: 3 }, { id: 'slam', weight: 3 }, { id: 'charge', weight: 3 }, { id: 'leap', weight: 3, from: 2 }],
    summon: { phase: 3, kinds: ['basic', 'basic'] },
    tempo: [1.2, 1, 0.85],
    style: { color: COLORS.boss, lineWidth: 11, scale: 1.85, accessory: 'warden', accent: 0xffd24a, headRadius: 10 },
    eye: 0xff2020,
  },
  items: [
    { id: 'keycard', name: 'Gate Keycard', description: 'A heavy access card for the Warden Gate.', icon: '🗝️', usable: false },
    { id: 'warden_core', name: "Warden's Core", description: 'The glowing heart of the Iron Warden. A trophy of a hard fight.', icon: '💠', usable: false },
  ],
  quests: [
    {
      id: 'clean_streets', title: 'Clean the Streets', world: 'neon_street',
      summary: 'Drive the street gangs back from Neon Street.',
      objectives: [{ type: 'kill', target: 'any', count: 5, label: 'Defeat gang members' }],
      reward: { xp: 120, gold: 20, items: { health_tonic: 2 } },
      hint: "Still some left out there. Chain your strikes: Punch, Punch, Kick, Heavy (J, J, J, J).",
    },
    {
      id: 'rooftop_signal', title: 'The Rooftop Signal', world: 'neon_street',
      summary: 'Light the signal beacon high above the market.',
      objectives: [{ type: 'reach', target: 'beacon', count: 1, label: 'Reach the rooftop beacon' }],
      reward: { xp: 100, items: { energy_cell: 2 } },
      hint: "The beacon is up the ledges to the east. Hold Space for full-height jumps.",
    },
    {
      id: 'lost_keycard', title: 'The Lost Keycard', world: 'neon_street',
      summary: 'Recover the Warden Gate keycard from a hidden room.',
      objectives: [{ type: 'collect', target: 'keycard', count: 1, label: 'Find the gate keycard' }],
      reward: { xp: 150, flags: ['gate_open'] },
      hint: "The warehouse east of the market. Walk into suspicious walls: some of them aren't solid.",
    },
    {
      id: 'defeat_warden', title: 'Break the Warden', world: 'neon_street',
      summary: 'Defeat the Iron Warden in his arena beyond the gate.',
      objectives: [{ type: 'boss', target: 'warden', count: 1, label: 'Defeat the Iron Warden' }],
      reward: { xp: 300, gold: 150 },
      hint: "The Warden waits beyond the gate. Save at a lamp first.",
    },
  ],
  text: {
    'A rain-lit megacity where gang lords rule the rooftops. Fight through the plaza, the market and the warehouse district to the Warden Gate.': 'مدينة عملاقة تغمرها أمطار النيون، تحكم عصابات زعمائها أسطح المباني. اشقّ طريقك عبر الساحة والسوق وحي المستودعات إلى بوابة الحارس.',
    'NEON': 'النيون',
  },
  weapons: WORLD_WEAPONS.neon_street,
  load: () => import('./content').then((m) => m.content),
};
