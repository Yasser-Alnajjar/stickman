import type { QuestDef } from '@/shared/types';

export const QUESTS: Record<string, QuestDef> = {
  clean_streets: {
    id: 'clean_streets', title: 'Clean the Streets', giver: 'ren',
    summary: 'Master Ren wants the street gangs driven back.',
    objectives: [{ type: 'kill', target: 'any', count: 5, label: 'Defeat gang members' }],
    reward: { xp: 120, gold: 20, items: { health_tonic: 2 } },
    offer: [
      "Ah, a fighter! The Ironfist gangs have taken over Neon Street.",
      "Show them the old ways: strike, combo, block. Defeat five of them and I'll make it worth your while.",
    ],
    inProgress: ["Still some left out there. Chain your strikes: Punch, Punch, Kick, Heavy (J, J, J, J)."],
    turnIn: ["Five down! The street breathes easier. Take these tonics, they'll keep you standing."],
  },
  rooftop_signal: {
    id: 'rooftop_signal', title: 'The Rooftop Signal', giver: 'juno',
    summary: 'Light the signal beacon high above the market.',
    objectives: [{ type: 'reach', target: 'beacon', count: 1, label: 'Reach the rooftop beacon' }],
    reward: { xp: 100, items: { energy_cell: 2 } },
    offer: [
      "Psst. See that tower of ledges? A beacon sits on top.",
      "Climb up there and light it. My crew will know the street is safe. Variable jump height helps: tap or hold Space.",
    ],
    inProgress: ["The beacon is up the ledges to the east. Hold Space for full-height jumps."],
    turnIn: ["I saw the light from here! Take these energy cells. You've earned them."],
  },
  lost_keycard: {
    id: 'lost_keycard', title: 'The Lost Keycard', giver: 'mira',
    summary: 'Recover the Warden Gate keycard from a hidden room.',
    objectives: [{ type: 'collect', target: 'keycard', count: 1, label: 'Find the gate keycard' }],
    reward: { xp: 150, flags: ['gate_open'] },
    offer: [
      "The Warden Gate is sealed. Whoever runs the Ironfists hides behind it.",
      "The keycard was stashed in a hidden room in the old warehouse east of here. Some walls aren't what they seem.",
    ],
    inProgress: ["The warehouse east of the market. Walk into suspicious walls: some of them aren't solid."],
    turnIn: ["That's the one! I'll open the gate. Beyond it waits the Iron Warden himself."],
  },
  defeat_warden: {
    id: 'defeat_warden', title: 'Break the Warden', giver: 'mira',
    summary: 'Defeat the Iron Warden in his arena beyond the gate.',
    requires: ['lost_keycard'],
    objectives: [{ type: 'boss', target: 'warden', count: 1, label: 'Defeat the Iron Warden' }],
    reward: { xp: 300, gold: 150 },
    autoComplete: true,
    offer: [
      "The gate is open. The Iron Warden telegraphs his big attacks: watch for the red warnings.",
      "Dodge through his charge, jump his shockwaves, and punish him when he's exhausted. Good luck.",
    ],
    inProgress: ["The Warden waits beyond the gate. Save at a lamp first."],
    turnIn: ["The city is free."],
  },
  dock_sweep: {
    id: 'dock_sweep', title: 'Sweep the Docks', giver: 'tess', requires: ['defeat_warden'],
    summary: 'Thin out the dockside gangs before facing their lord.',
    objectives: [{ type: 'kill', target: 'archer', count: 4, label: 'Defeat Dock Slingers' }, { type: 'kill', target: 'guard', count: 3, label: 'Break Shield Guards' }],
    reward: { xp: 320, gold: 60, items: { health_tonic: 2, energy_cell: 1 } },
    offer: ['The Warden is gone, but Marrow filled the vacuum. His slingers hold every rooftop.', 'Take out four slingers and three shield guards and the pier is half yours.'],
    inProgress: ['Slingers keep their distance: close in or block their shots. Heavy punches and abilities break shields.'],
    turnIn: ['Good work. The docks breathe again. Marrow is waiting at the end of the pier.'],
  },
  defeat_marrow: {
    id: 'defeat_marrow', title: 'Sink the Tyrant', giver: 'tess', requires: ['dock_sweep'],
    summary: 'Defeat Tyrant Marrow on his quay.',
    objectives: [{ type: 'boss', target: 'marrow', count: 1, label: 'Defeat Tyrant Marrow' }],
    reward: { xp: 600, gold: 250 },
    autoComplete: true,
    offer: ['Marrow throws harpoons low and high. Jump the low ones, stay grounded for the high ones.', 'When he calls down cargo, watch the floor markers and keep moving.'],
    inProgress: ['The quay lies past the pier. Rest at a lamp first.'],
    turnIn: ['The tyrant has fallen.'],
  },
  foundry_purge: {
    id: 'foundry_purge', title: 'Purge the Foundry', giver: 'ash', requires: ['defeat_marrow'],
    summary: 'Cut down the Empress\'s elite guard.',
    objectives: [{ type: 'kill', target: 'blade', count: 5, label: 'Defeat Night Blades' }, { type: 'kill', target: 'heavy', count: 3, label: 'Defeat Iron Brutes' }],
    reward: { xp: 650, gold: 120, items: { health_tonic: 3, energy_cell: 2 } },
    offer: ['Ignis keeps blades and brutes on every catwalk. You will not reach her without bleeding for it.', 'Five Night Blades and three Brutes. Do it and I will tell you how to survive her.'],
    inProgress: ['Blades dodge when you swing. Bait the dodge, then strike.'],
    turnIn: ['Impressive. Now the Empress: she vanishes, then strikes from behind. Listen for the warning.'],
  },
  defeat_ignis: {
    id: 'defeat_ignis', title: 'Extinguish the Empress', giver: 'ash', requires: ['foundry_purge'],
    summary: 'Defeat Empress Ignis in her throne room.',
    objectives: [{ type: 'boss', target: 'ignis', count: 1, label: 'Defeat Empress Ignis' }],
    reward: { xp: 1200, gold: 500 },
    autoComplete: true,
    offer: ['Flame pillars erupt outward from where you stand. Never stay still.', 'Finish her and the whole city is free.'],
    inProgress: ['The throne room lies at the east end of the foundry. Rest at a lamp first.'],
    turnIn: ['The fires are out. You did it.'],
  },
};

export const QUEST_ORDER = [
  'clean_streets', 'rooftop_signal', 'lost_keycard', 'defeat_warden',
  'dock_sweep', 'defeat_marrow', 'foundry_purge', 'defeat_ignis',
];
