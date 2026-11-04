import type { EnemyKind, ItemId, MusicTrack, RegionId } from '@/shared/types';

export type SolidKind = 'ground' | 'roof' | 'crate' | 'wall' | 'gate';
export interface SolidDef { id: string; x: number; y: number; w: number; h: number; kind: SolidKind; /** hidden once this profile flag is set */ openFlag?: string }
export interface OneWayDef { id: string; x: number; y: number; w: number }
export type DecorKind = 'building' | 'lamp' | 'neon' | 'pipes' | 'banner' | 'arrow' | 'beacon' | 'pillar' | 'torch' | 'door';
export interface DecorDef { id: string; kind: DecorKind; x: number; y: number; w: number; h: number; seed: number; text?: string }
export interface SecretDef { id: string; x: number; y: number; w: number; h: number }
export interface SpawnDef { id: string; kind: Exclude<EnemyKind, 'boss'>; x: number; y?: number; patrol: number }
export interface NpcPlacement { npc: string; x: number }
export interface CheckpointDef { id: string; name: string; x: number }
export interface PickupDef { id: string; item: ItemId; qty: number; x: number; y: number; chest?: boolean }
export interface ZoneDef { id: string; kind: 'reach' | 'exit' | 'boss'; x: number; y: number; w: number; h: number; to?: RegionId; spawn?: string }

export interface RegionDef {
  id: RegionId;
  name: string;
  width: number;
  height: number;
  groundY: number;
  theme: 'city' | 'arena';
  music: MusicTrack;
  solids: SolidDef[];
  oneWays: OneWayDef[];
  decor: DecorDef[];
  secrets: SecretDef[];
  spawns: SpawnDef[];
  npcs: NpcPlacement[];
  checkpoints: CheckpointDef[];
  pickups: PickupDef[];
  zones: ZoneDef[];
  spawnPoints: Record<string, { x: number; y: number }>;
  bossSpawn?: { x: number };
}

/** Deterministic PRNG so generated skylines are identical every run. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUND_Y = 960;

function groundSlices(width: number): SolidDef[] {
  const out: SolidDef[] = [];
  for (let x = 0; x < width; x += 800) out.push({ id: `ground_${x}`, x, y: GROUND_Y, w: Math.min(800, width - x), h: 120, kind: 'ground' });
  return out;
}

function buildCity(): RegionDef {
  const W = 9600;
  const solids: SolidDef[] = groundSlices(W);
  const oneWays: OneWayDef[] = [];
  const decor: DecorDef[] = [];
  let did = 0;
  const addDecor = (kind: DecorDef['kind'], x: number, y: number, w: number, h: number, text?: string): void => {
    decor.push({ id: `d${did++}`, kind, x, y, w, h, seed: did * 7919, text });
  };
  const roof = (id: string, x: number, y: number, w: number): void => {
    solids.push({ id, x, y, w, h: 28, kind: 'roof' });
    addDecor('building', x, y + 28, w, GROUND_Y - y - 28);
  };
  const ledge = (x: number, y: number, w: number): void => { oneWays.push({ id: `l${oneWays.length}`, x, y, w }); };

  // --- Segment A: Plaza
  solids.push({ id: 'crate1', x: 980, y: 890, w: 100, h: 70, kind: 'crate' });
  solids.push({ id: 'crate2', x: 1080, y: 820, w: 100, h: 140, kind: 'crate' });
  ledge(1230, 770, 240); ledge(1530, 700, 240);
  roof('roof1', 1750, 640, 500);
  // --- Segment B: Market
  roof('roof2', 2420, 590, 520);
  ledge(3010, 700, 200); ledge(3250, 800, 200);
  // --- Segment C: signal tower & hidden rooftop room
  [[4100, 840], [4330, 730], [4100, 620], [4330, 510], [4100, 400]].forEach(([x, y]) => ledge(x, y, 190));
  ledge(4340, 300, 300);
  addDecor('beacon', 4560, 300, 60, 140);
  ledge(4640, 850, 130);
  solids.push({ id: 'roofW', x: 4800, y: 720, w: 520, h: 28, kind: 'roof' });
  addDecor('building', 4800, 748, 520, GROUND_Y - 748);
  solids.push({ id: 'ceilW', x: 4830, y: 590, w: 460, h: 26, kind: 'roof' });
  solids.push({ id: 'wallW', x: 5290, y: 590, w: 30, h: 158, kind: 'wall' });
  addDecor('building', 4830, 560, 460, 40);
  addDecor('neon', 4900, 540, 300, 30, 'WAREHOUSE');
  addDecor('arrow', 4690, 780, 90, 30, 'SECRET?');
  // --- Segment D: Industrial row
  solids.push({ id: 'crate3', x: 6200, y: 890, w: 100, h: 70, kind: 'crate' });
  solids.push({ id: 'crate4', x: 6300, y: 820, w: 100, h: 140, kind: 'crate' });
  roof('roof3', 6440, 740, 600);
  ledge(7110, 790, 240);
  // --- Segment E: Gate approach
  solids.push({ id: 'crate5', x: 7900, y: 890, w: 100, h: 70, kind: 'crate' });
  roof('roof4', 8050, 760, 380);
  solids.push({ id: 'gate', x: 9000, y: 700, w: 44, h: 260, kind: 'gate', openFlag: 'gate_open' });
  addDecor('door', 9400, 820, 120, 140, 'WARDEN GATE');
  solids.push({ id: 'wallEast', x: 9560, y: 0, w: 40, h: GROUND_Y, kind: 'wall' });

  // --- Background skyline (non-colliding) + lamps/signs
  const rnd = mulberry32(1337);
  for (let x = -100; x < W; ) {
    const w = 180 + Math.floor(rnd() * 190);
    const h = 260 + Math.floor(rnd() * 460);
    addDecor('building', x, GROUND_Y - h, w, h);
    x += w + (rnd() < 0.3 ? 30 : 0);
  }
  for (let x = 240; x < W - 100; x += 380 + Math.floor(rnd() * 120)) addDecor('lamp', x, GROUND_Y, 20, 150);
  [['BAR', 700], ['RAMEN', 2050], ['ARCADE', 3000], ['HOTEL', 5800], ['DOJO', 520], ['METRO', 7400], ['NOODLE', 6900]].forEach(([t, x]) =>
    addDecor('neon', x as number, GROUND_Y - 280 - rnd() * 80, 150, 36, t as string));
  addDecor('pipes', 6000, 700, 900, 80);
  addDecor('banner', 8800, 700, 60, 200);

  return {
    id: 'city', name: 'Neon Street', width: W, height: 1080, groundY: GROUND_Y, theme: 'city', music: 'city',
    solids, oneWays, decor,
    secrets: [{ id: 'secretW', x: 4830, y: 616, w: 460, h: 104 }],
    spawns: [
      { id: 'e1', kind: 'basic', x: 1330, patrol: 170 },
      { id: 'e2', kind: 'basic', x: 1680, patrol: 120 },
      { id: 'e3', kind: 'basic', x: 2000, y: 640, patrol: 180 },
      { id: 'e4', kind: 'basic', x: 2450, patrol: 200 },
      { id: 'e5', kind: 'fast', x: 2680, y: 590, patrol: 200 },
      { id: 'e6', kind: 'fast', x: 3050, patrol: 220 },
      { id: 'e7', kind: 'basic', x: 4500, patrol: 140 },
      { id: 'e8', kind: 'basic', x: 4100, patrol: 120 },
      { id: 'e9', kind: 'fast', x: 5050, patrol: 200 },
      { id: 'e10', kind: 'basic', x: 5600, patrol: 180 },
      { id: 'e11', kind: 'basic', x: 6050, patrol: 120 },
      { id: 'e12', kind: 'fast', x: 6550, y: 740, patrol: 200 },
      { id: 'e13', kind: 'heavy', x: 6900, patrol: 110 },
      { id: 'e14', kind: 'basic', x: 7300, patrol: 160 },
      { id: 'e15', kind: 'fast', x: 7750, patrol: 200 },
      { id: 'e16', kind: 'basic', x: 8200, y: 760, patrol: 120 },
      { id: 'e17', kind: 'heavy', x: 8450, patrol: 100 },
      { id: 'e18', kind: 'basic', x: 8700, patrol: 140 },
    ],
    npcs: [{ npc: 'ren', x: 520 }, { npc: 'mira', x: 3520 }, { npc: 'juno', x: 3960 }],
    checkpoints: [
      { id: 'plaza', name: 'Plaza Lamp', x: 840 },
      { id: 'market', name: 'Market Lamp', x: 3330 },
      { id: 'warehouse', name: 'Warehouse Lamp', x: 5520 },
      { id: 'industrial', name: 'Industrial Lamp', x: 7260 },
      { id: 'gate', name: 'Gate Lamp', x: 8780 },
    ],
    pickups: [
      { id: 'chest_plaza', item: 'health_tonic', qty: 1, x: 1640, y: 668, chest: true },
      { id: 'chest_roof2', item: 'energy_cell', qty: 1, x: 2800, y: 558, chest: true },
      { id: 'chest_tower', item: 'health_tonic', qty: 1, x: 4400, y: 268, chest: true },
      { id: 'chest_warehouse', item: 'energy_cell', qty: 1, x: 5020, y: 688, chest: true },
      { id: 'keycard', item: 'keycard', qty: 1, x: 5210, y: 684 },
      { id: 'chest_roof3', item: 'health_tonic', qty: 1, x: 6900, y: 708, chest: true },
      { id: 'chest_gate', item: 'energy_cell', qty: 1, x: 8300, y: 728, chest: true },
    ],
    zones: [
      { id: 'beacon', kind: 'reach', x: 4540, y: 190, w: 110, h: 110 },
      { id: 'to_arena', kind: 'exit', x: 9400, y: 800, w: 120, h: 160, to: 'boss_arena', spawn: 'entry' },
    ],
    spawnPoints: { gate_exit: { x: 9300, y: GROUND_Y } },
  };
}

function buildArena(): RegionDef {
  const W = 2000;
  const solids: SolidDef[] = groundSlices(W);
  solids.push({ id: 'wallE', x: 1960, y: 0, w: 40, h: GROUND_Y, kind: 'wall' });
  const oneWays: OneWayDef[] = [
    { id: 'a1', x: 760, y: 830, w: 240 }, { id: 'a2', x: 1160, y: 730, w: 280 }, { id: 'a3', x: 1580, y: 830, w: 240 },
  ];
  const decor: DecorDef[] = [];
  let i = 0;
  for (const x of [120, 560, 1000, 1440, 1880]) decor.push({ id: `p${i++}`, kind: 'pillar', x, y: 960, w: 60, h: 520, seed: i });
  for (const x of [330, 780, 1220, 1660]) decor.push({ id: `t${i++}`, kind: 'torch', x, y: 960, w: 16, h: 150, seed: i });
  decor.push({ id: `b${i++}`, kind: 'banner', x: 900, y: 420, w: 70, h: 220, seed: 5 });
  decor.push({ id: `b${i++}`, kind: 'banner', x: 1340, y: 420, w: 70, h: 220, seed: 6 });
  decor.push({ id: `door${i++}`, kind: 'door', x: 1840, y: 820, w: 110, h: 140, seed: 9, text: 'EXIT' });
  return {
    id: 'boss_arena', name: 'Warden Arena', width: W, height: 1080, groundY: GROUND_Y, theme: 'arena', music: 'none',
    solids, oneWays, decor, secrets: [], spawns: [], npcs: [],
    checkpoints: [{ id: 'arena', name: 'Arena Lamp', x: 200 }],
    pickups: [],
    zones: [
      { id: 'boss_trigger', kind: 'boss', x: 620, y: 0, w: 60, h: 1080 },
      { id: 'to_city', kind: 'exit', x: 1840, y: 820, w: 110, h: 140, to: 'city', spawn: 'gate_exit' },
    ],
    spawnPoints: { entry: { x: 240, y: GROUND_Y } },
    bossSpawn: { x: 1500 },
  };
}

export const REGIONS: Record<RegionId, RegionDef> = {
  city: buildCity(),
  boss_arena: buildArena(),
};
