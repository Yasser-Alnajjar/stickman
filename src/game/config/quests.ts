import type { QuestDef } from '@/shared/types';

export const QUESTS: Record<string, QuestDef> = {
  clean_streets: {
    id: 'clean_streets', title: 'Clean the Streets', world: 'neon_street',
    summary: 'Drive the street gangs back from Neon Street.',
    objectives: [{ type: 'kill', target: 'any', count: 5, label: 'Defeat gang members' }],
    reward: { xp: 120, gold: 20, items: { health_tonic: 2 } },
    hint: "Still some left out there. Chain your strikes: Punch, Punch, Kick, Heavy (J, J, J, J).",
  },
  rooftop_signal: {
    id: 'rooftop_signal', title: 'The Rooftop Signal', world: 'neon_street',
    summary: 'Light the signal beacon high above the market.',
    objectives: [{ type: 'reach', target: 'beacon', count: 1, label: 'Reach the rooftop beacon' }],
    reward: { xp: 100, items: { energy_cell: 2 } },
    hint: "The beacon is up the ledges to the east. Hold Space for full-height jumps.",
  },
  lost_keycard: {
    id: 'lost_keycard', title: 'The Lost Keycard', world: 'neon_street',
    summary: 'Recover the Warden Gate keycard from a hidden room.',
    objectives: [{ type: 'collect', target: 'keycard', count: 1, label: 'Find the gate keycard' }],
    reward: { xp: 150, flags: ['gate_open'] },
    hint: "The warehouse east of the market. Walk into suspicious walls: some of them aren't solid.",
  },
  defeat_warden: {
    id: 'defeat_warden', title: 'Break the Warden', world: 'neon_street',
    summary: 'Defeat the Iron Warden in his arena beyond the gate.',
    objectives: [{ type: 'boss', target: 'warden', count: 1, label: 'Defeat the Iron Warden' }],
    reward: { xp: 300, gold: 150 },
    hint: "The Warden waits beyond the gate. Save at a lamp first.",
  },
  dock_sweep: {
    id: 'dock_sweep', title: 'Sweep the Docks', world: 'rust_docks',
    summary: 'Thin out the dockside gangs before facing their lord.',
    objectives: [{ type: 'kill', target: 'archer', count: 4, label: 'Defeat Dock Slingers' }, { type: 'kill', target: 'guard', count: 3, label: 'Break Shield Guards' }],
    reward: { xp: 320, gold: 60, items: { health_tonic: 2, energy_cell: 1 } },
    hint: 'Slingers keep their distance: close in or block their shots. Heavy punches and abilities break shields.',
  },
  defeat_marrow: {
    id: 'defeat_marrow', title: 'Sink the Tyrant', world: 'rust_docks',
    summary: 'Defeat Tyrant Marrow on his quay.',
    objectives: [{ type: 'boss', target: 'marrow', count: 1, label: 'Defeat Tyrant Marrow' }],
    reward: { xp: 600, gold: 250 },
    hint: 'The quay lies past the pier. Rest at a lamp first.',
  },
  foundry_purge: {
    id: 'foundry_purge', title: 'Purge the Foundry', world: 'ember_foundry',
    summary: 'Cut down the Empress\'s elite guard.',
    objectives: [{ type: 'kill', target: 'blade', count: 5, label: 'Defeat Night Blades' }, { type: 'kill', target: 'heavy', count: 3, label: 'Defeat Iron Brutes' }],
    reward: { xp: 650, gold: 120, items: { health_tonic: 3, energy_cell: 2 } },
    hint: 'Blades dodge when you swing. Bait the dodge, then strike.',
  },
  defeat_ignis: {
    id: 'defeat_ignis', title: 'Extinguish the Empress', world: 'ember_foundry',
    summary: 'Defeat Empress Ignis in her throne room.',
    objectives: [{ type: 'boss', target: 'ignis', count: 1, label: 'Defeat Empress Ignis' }],
    reward: { xp: 1200, gold: 500 },
    hint: 'The throne room lies at the east end of the foundry. Rest at a lamp first.',
  },
};

export const QUEST_ORDER = [
  'clean_streets', 'rooftop_signal', 'lost_keycard', 'defeat_warden',
  'dock_sweep', 'defeat_marrow', 'foundry_purge', 'defeat_ignis',
];
