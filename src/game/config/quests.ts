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
};

export const QUEST_ORDER = ['clean_streets', 'rooftop_signal', 'lost_keycard', 'defeat_warden'];
