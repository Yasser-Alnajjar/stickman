export interface NpcDef {
  id: string;
  name: string;
  quests: string[];
  idle: string[];
  style: { color: number; lineWidth: number; scale: number; accessory: string; accent: number; headRadius: number };
}

export const NPCS: Record<string, NpcDef> = {
  ren: {
    id: 'ren', name: 'Master Ren', quests: ['clean_streets'],
    idle: ['Balance, patience, timing. Master all three.', 'Block just as a blow lands (S) for a perfect block.'],
    style: { color: 0xe8e2cf, lineWidth: 4.5, scale: 1, accessory: 'elder', accent: 0xffffff, headRadius: 10 },
  },
  juno: {
    id: 'juno', name: 'Scout Juno', quests: ['rooftop_signal'],
    idle: ['The roofs are the fastest way across the city.', 'Dash (Shift) can save your skin and your jumps.'],
    style: { color: 0x7ee0ff, lineWidth: 4, scale: 0.95, accessory: 'scarf', accent: 0xffd24a, headRadius: 9 },
  },
  mira: {
    id: 'mira', name: 'Guard Captain Mira', quests: ['lost_keycard', 'defeat_warden'],
    idle: ["Rest at lamps. They'll heal you and save your place.", 'The gate stands to the far east.'],
    style: { color: 0xffc46b, lineWidth: 5, scale: 1.05, accessory: 'guard', accent: 0x5c8dff, headRadius: 10 },
  },
};
