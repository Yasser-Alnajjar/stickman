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
  tess: {
    id: 'tess', name: 'Dockhand Tess', quests: ['dock_sweep', 'defeat_marrow'],
    idle: ['Slingers fire from the rooftops. Block the shot or jump it.', 'Shield guards laugh at light hits. Hit them hard, or walk around.'],
    style: { color: 0x9be7d0, lineWidth: 4.5, scale: 1, accessory: 'scarf', accent: 0xffb454, headRadius: 10 },
  },
  ash: {
    id: 'ash', name: 'Smith Ash', quests: ['foundry_purge', 'defeat_ignis'],
    idle: ['Night Blades dodge when you swing. Bait them, then punish.', 'Rest at every lamp. The Empress will not give you a second chance.'],
    style: { color: 0xffb08a, lineWidth: 5.5, scale: 1.08, accessory: 'brute', accent: 0xfff2a0, headRadius: 10 },
  },
};
