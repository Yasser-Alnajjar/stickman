import type { BossId, EnemyKind, ItemId, MusicTrack, RegionId } from '@/shared/types';

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
export interface ZoneDef {
  id: string; kind: 'reach' | 'exit' | 'boss'; x: number; y: number; w: number; h: number; to?: RegionId; spawn?: string;
  /** The exit stays shut until this boss has been defeated. */
  requiresBoss?: BossId;
}

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
  /** Hit/damage scaling for every enemy placed in this region (stage difficulty). */
  enemyScale?: { hp: number; atk: number };
  /** Arena boss: where it stands and where the sealing barrier drops once the fight starts. */
  boss?: { id: BossId; x: number; barrierX: number };
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
      { id: 'e19', kind: 'basic', x: 1050, patrol: 120 },
      { id: 'e20', kind: 'basic', x: 2900, patrol: 160 },
      { id: 'e21', kind: 'fast', x: 3750, patrol: 200 },
      { id: 'e22', kind: 'basic', x: 5350, patrol: 140 },
      { id: 'e23', kind: 'archer', x: 6700, y: 740, patrol: 160 },
      { id: 'e24', kind: 'guard', x: 7550, patrol: 110 },
      { id: 'e25', kind: 'archer', x: 7220, y: 790, patrol: 80 },
      { id: 'e26', kind: 'guard', x: 8000, patrol: 100 },
      { id: 'e27', kind: 'fast', x: 8900, patrol: 200 },
      { id: 'e28', kind: 'archer', x: 8250, y: 760, patrol: 100 },
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
    enemyScale: { hp: 1, atk: 1 },
  };
}

/* ------------------------------------------------------------------ shared builder for the later stages */

class Builder {
  readonly solids: SolidDef[];
  readonly oneWays: OneWayDef[] = [];
  readonly decor: DecorDef[] = [];
  private did = 0;
  constructor(readonly width: number) { this.solids = groundSlices(width); }
  addDecor(kind: DecorKind, x: number, y: number, w: number, h: number, text?: string): void {
    this.decor.push({ id: `d${this.did++}`, kind, x, y, w, h, seed: this.did * 7919, text });
  }
  /** A solid roof/container with its building body hanging beneath it. */
  roof(id: string, x: number, y: number, w: number): void {
    this.solids.push({ id, x, y, w, h: 28, kind: 'roof' });
    this.addDecor('building', x, y + 28, w, GROUND_Y - y - 28);
  }
  crate(id: string, x: number, top: number, w = 100): void {
    this.solids.push({ id, x, y: top, w, h: GROUND_Y - top, kind: 'crate' });
  }
  ledge(x: number, y: number, w: number): void { this.oneWays.push({ id: `l${this.oneWays.length}`, x, y, w }); }
  /** Four-step zig-zag climb ending on a top ledge. */
  tower(x: number, steps: number[], topW = 320): void {
    steps.forEach((y, i) => this.ledge(x + (i % 2) * 230, y, 190));
    this.ledge(x + 240, steps[steps.length - 1] - 100, topW);
  }
  skyline(seed: number, minH = 260, spread = 460): void {
    const rnd = mulberry32(seed);
    for (let x = -100; x < this.width; ) {
      const w = 180 + Math.floor(rnd() * 190);
      const h = minH + Math.floor(rnd() * spread);
      this.addDecor('building', x, GROUND_Y - h, w, h);
      x += w + (rnd() < 0.3 ? 30 : 0);
    }
    for (let x = 240; x < this.width - 100; x += 380 + Math.floor(rnd() * 120)) this.addDecor('lamp', x, GROUND_Y, 20, 150);
  }
  door(x: number, label: string): void { this.addDecor('door', x, 820, 110, 140, label); }
}

const wall = (x: number): SolidDef => ({ id: 'wallEnd', x, y: 0, w: 40, h: GROUND_Y, kind: 'wall' });

function buildDocks(): RegionDef {
  const W = 10400;
  const b = new Builder(W);
  // A: loading bays
  b.crate('crateA1', 1000, 890); b.crate('crateA2', 1100, 820);
  b.ledge(1250, 760, 220); b.ledge(1540, 690, 220); b.roof('roofA', 1800, 630, 520);
  // B: container stacks
  b.crate('crateB1', 3000, 890); b.crate('crateB2', 3100, 820);
  b.roof('containerB', 3300, 740, 700); b.ledge(4070, 800, 200); b.ledge(4330, 700, 200);
  // C: crane tower
  b.tower(5000, [850, 740, 630, 520], 320);
  // D: sheds
  b.crate('crateD1', 6600, 890); b.crate('crateD2', 6700, 820);
  b.roof('shedD', 6900, 740, 900); b.ledge(7870, 820, 200); b.crate('crateD3', 8150, 890);
  // E: the pier
  b.ledge(8500, 860, 160); b.roof('pierE', 8700, 780, 420); b.crate('crateE1', 9500, 890);
  b.solids.push(wall(W - 40));
  b.skyline(4242, 200, 380);
  [['CARGO', 800], ['FERRY', 2300], ['DOCK 9', 3500], ['SALT', 5900], ['HARBOR', 7600], ['PIER 4', 9000]].forEach(([t, x]) =>
    b.addDecor('neon', x as number, GROUND_Y - 300, 150, 36, t as string));
  b.addDecor('pipes', 2500, 700, 700, 80); b.addDecor('pipes', 6000, 720, 800, 80);
  b.addDecor('banner', 9900, 700, 60, 200);
  b.door(60, 'BACK'); b.door(W - 230, 'TYRANT');
  const sp = (id: string, kind: SpawnDef['kind'], x: number, y?: number, patrol = 150): SpawnDef => ({ id, kind, x, y, patrol });
  return {
    id: 'docks', name: 'Rust Docks', width: W, height: 1080, groundY: GROUND_Y, theme: 'city', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    spawns: [
      sp('dk1', 'basic', 800), sp('dk2', 'archer', 1400, undefined, 90), sp('dk3', 'guard', 1700, undefined, 110),
      sp('dk4', 'archer', 2050, 630, 100), sp('dk5', 'fast', 2400, undefined, 200), sp('dk6', 'basic', 2800),
      sp('dk7', 'guard', 2900, undefined, 90), sp('dk8', 'archer', 3600, 740, 120), sp('dk9', 'basic', 3550, 740, 100),
      sp('dk10', 'fast', 3900, undefined, 200), sp('dk11', 'heavy', 4200, undefined, 110), sp('dk12', 'archer', 4430, 700, 60),
      sp('dk13', 'basic', 4700), sp('dk14', 'blade', 5100, undefined, 180), sp('dk15', 'guard', 5600, undefined, 100),
      sp('dk16', 'archer', 5400, 420, 60), sp('dk17', 'fast', 5900, undefined, 220), sp('dk18', 'heavy', 6300, undefined, 100),
      sp('dk19', 'basic', 6450), sp('dk20', 'blade', 7000, 740, 200), sp('dk21', 'archer', 7500, 740, 120),
      sp('dk22', 'guard', 7300, undefined, 110), sp('dk23', 'basic', 7700), sp('dk24', 'heavy', 8000, undefined, 100),
      sp('dk25', 'fast', 8250, undefined, 200), sp('dk26', 'blade', 8600, undefined, 160), sp('dk27', 'archer', 8900, 780, 100),
      sp('dk28', 'guard', 9300, undefined, 110), sp('dk29', 'heavy', 9500, undefined, 80), sp('dk30', 'blade', 9750, undefined, 160),
      sp('dk31', 'guard', 9900, undefined, 100),
    ],
    npcs: [{ npc: 'tess', x: 520 }],
    checkpoints: [
      { id: 'dock_gate', name: 'Dock Gate Lamp', x: 640 }, { id: 'dock_bays', name: 'Loading Bay Lamp', x: 2700 },
      { id: 'dock_crane', name: 'Crane Lamp', x: 4750 }, { id: 'dock_sheds', name: 'Shed Lamp', x: 6450 },
      { id: 'dock_pier', name: 'Pier Lamp', x: 9200 },
    ],
    pickups: [
      { id: 'dk_chest_roofA', item: 'health_tonic', qty: 1, x: 2100, y: 598, chest: true },
      { id: 'dk_chest_containerB', item: 'energy_cell', qty: 1, x: 3800, y: 708, chest: true },
      { id: 'dk_chest_crane', item: 'health_tonic', qty: 2, x: 5400, y: 388, chest: true },
      { id: 'dk_chest_shed', item: 'energy_cell', qty: 1, x: 7300, y: 708, chest: true },
      { id: 'dk_chest_pier', item: 'health_tonic', qty: 1, x: 8900, y: 748, chest: true },
    ],
    zones: [
      { id: 'to_warden', kind: 'exit', x: 60, y: 820, w: 110, h: 140, to: 'boss_arena', spawn: 'from_east' },
      { id: 'to_tyrant', kind: 'exit', x: W - 230, y: 820, w: 110, h: 140, to: 'tyrant_arena', spawn: 'entry' },
    ],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_east: { x: W - 340, y: GROUND_Y } },
    enemyScale: { hp: 1.3, atk: 1.2 },
  };
}

function buildFoundry(): RegionDef {
  const W = 11200;
  const b = new Builder(W);
  // A: forge floor
  b.crate('crateA1', 1000, 890); b.crate('crateA2', 1100, 820);
  b.roof('forgeA', 1300, 740, 600); b.ledge(1990, 660, 220); b.roof('forgeB', 2300, 580, 500);
  // B: scaffold tower into a long catwalk
  b.tower(3300, [850, 740, 630, 520], 200);
  b.roof('catwalk', 3800, 520, 900); b.ledge(4800, 620, 200); b.ledge(5050, 720, 200); b.ledge(5300, 820, 200);
  // C: presses and the bridge
  b.crate('crateC1', 5900, 890); b.crate('crateC2', 6000, 820);
  b.roof('press', 6200, 740, 400); b.ledge(6700, 650, 200); b.roof('bridge', 6990, 580, 800);
  // D: the crucible
  b.crate('crateD1', 8100, 890); b.crate('crateD2', 8200, 820);
  b.ledge(8350, 750, 200); b.ledge(8650, 700, 200); b.roof('crucible', 8950, 640, 600); b.ledge(9650, 740, 200);
  // E: sanctum approach
  b.crate('crateE1', 10100, 890);
  b.solids.push(wall(W - 40));
  b.skyline(777, 240, 420);
  for (const x of [900, 2600, 4400, 6300, 8300, 10300]) b.addDecor('torch', x, GROUND_Y, 16, 150);
  [['FORGE', 700], ['SMELT', 3000], ['KILN', 5600], ['SLAG', 7700], ['ANVIL', 9400]].forEach(([t, x]) =>
    b.addDecor('neon', x as number, GROUND_Y - 300, 150, 36, t as string));
  b.addDecor('pipes', 2000, 700, 900, 80); b.addDecor('pipes', 7500, 700, 900, 80);
  b.addDecor('banner', 10500, 700, 60, 200);
  b.door(60, 'BACK'); b.door(W - 230, 'EMPRESS');
  const sp = (id: string, kind: SpawnDef['kind'], x: number, y?: number, patrol = 150): SpawnDef => ({ id, kind, x, y, patrol });
  return {
    id: 'foundry', name: 'Ember Foundry', width: W, height: 1080, groundY: GROUND_Y, theme: 'arena', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    spawns: [
      sp('fd1', 'guard', 800, undefined, 90), sp('fd2', 'blade', 1150, undefined, 160), sp('fd3', 'archer', 1500, 740, 120),
      sp('fd4', 'heavy', 1700, undefined, 100), sp('fd5', 'blade', 2000, undefined, 200), sp('fd6', 'archer', 2500, 580, 120),
      sp('fd7', 'guard', 2900, undefined, 100), sp('fd8', 'fast', 3000, undefined, 220), sp('fd9', 'archer', 3500, undefined, 100),
      sp('fd10', 'heavy', 3900, 520, 120), sp('fd11', 'blade', 4200, 520, 150), sp('fd12', 'guard', 4500, undefined, 100),
      sp('fd13', 'archer', 4300, 520, 80), sp('fd14', 'blade', 5200, undefined, 180), sp('fd15', 'heavy', 5500, undefined, 100),
      sp('fd16', 'guard', 5750, undefined, 90), sp('fd17', 'archer', 6300, 740, 100), sp('fd18', 'blade', 6600, undefined, 180),
      sp('fd19', 'heavy', 6850, undefined, 90), sp('fd20', 'archer', 7200, 580, 150), sp('fd21', 'guard', 7500, 580, 120),
      sp('fd22', 'blade', 7800, undefined, 200), sp('fd23', 'fast', 8000, undefined, 240), sp('fd24', 'heavy', 8450, undefined, 100),
      sp('fd25', 'archer', 9100, 640, 100), sp('fd26', 'guard', 9300, 640, 90), sp('fd27', 'blade', 9000, undefined, 180),
      sp('fd28', 'heavy', 9700, undefined, 90), sp('fd29', 'guard', 9900, undefined, 90), sp('fd30', 'archer', 10150, undefined, 80),
      sp('fd31', 'blade', 10300, undefined, 200), sp('fd32', 'blade', 10550, undefined, 160), sp('fd33', 'heavy', 10700, undefined, 80),
    ],
    npcs: [{ npc: 'ash', x: 520 }],
    checkpoints: [
      { id: 'fd_gate', name: 'Foundry Gate Lamp', x: 640 }, { id: 'fd_forge', name: 'Forge Lamp', x: 2950 },
      { id: 'fd_catwalk', name: 'Catwalk Lamp', x: 5600 }, { id: 'fd_bridge', name: 'Bridge Lamp', x: 7900 },
      { id: 'fd_crucible', name: 'Crucible Lamp', x: 10000 },
    ],
    pickups: [
      { id: 'fd_chest_forge', item: 'health_tonic', qty: 1, x: 2500, y: 548, chest: true },
      { id: 'fd_chest_catwalk', item: 'energy_cell', qty: 1, x: 4300, y: 488, chest: true },
      { id: 'fd_chest_tower', item: 'health_tonic', qty: 2, x: 3640, y: 388, chest: true },
      { id: 'fd_chest_bridge', item: 'energy_cell', qty: 2, x: 7400, y: 548, chest: true },
      { id: 'fd_chest_crucible', item: 'health_tonic', qty: 2, x: 9250, y: 608, chest: true },
    ],
    zones: [
      { id: 'to_tyrant', kind: 'exit', x: 60, y: 820, w: 110, h: 140, to: 'tyrant_arena', spawn: 'from_east' },
      { id: 'to_empress', kind: 'exit', x: W - 230, y: 820, w: 110, h: 140, to: 'empress_arena', spawn: 'entry' },
    ],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_east: { x: W - 340, y: GROUND_Y } },
    enemyScale: { hp: 1.7, atk: 1.45 },
  };
}

/* ------------------------------------------------------------------ boss arenas */

interface ArenaCfg {
  id: RegionId; name: string; width: number; boss: BossId; bossX: number; lampId: string; lampName: string;
  platforms: [number, number, number][];
  /** Exit leading further on; omitted for the final arena. */
  next?: { to: RegionId; spawn: string; label: string };
  back: { to: RegionId; spawn: string };
  palette: number;
  scale?: { hp: number; atk: number };
}

function buildArena(c: ArenaCfg): RegionDef {
  const W = c.width;
  const solids: SolidDef[] = groundSlices(W);
  solids.push({ id: 'wallE', x: W - 40, y: 0, w: 40, h: GROUND_Y, kind: 'wall' });
  const oneWays: OneWayDef[] = c.platforms.map(([x, y, w], i) => ({ id: `a${i + 1}`, x, y, w }));
  const decor: DecorDef[] = [];
  let i = 0;
  for (let x = 120; x < W; x += 440) decor.push({ id: `p${i++}`, kind: 'pillar', x, y: 960, w: 60, h: 520, seed: i });
  for (let x = 330; x < W - 200; x += 440) decor.push({ id: `t${i++}`, kind: 'torch', x, y: 960, w: 16, h: 150, seed: i });
  decor.push({ id: `b${i++}`, kind: 'banner', x: 900, y: 420, w: 70, h: 220, seed: 5 + c.palette });
  decor.push({ id: `b${i++}`, kind: 'banner', x: 1340, y: 420, w: 70, h: 220, seed: 6 + c.palette });
  decor.push({ id: `door${i++}`, kind: 'door', x: 40, y: 820, w: 110, h: 140, seed: 8, text: 'BACK' });
  const zones: ZoneDef[] = [
    { id: 'boss_trigger', kind: 'boss', x: 620, y: 0, w: 60, h: 1080 },
    { id: 'to_back', kind: 'exit', x: 40, y: 820, w: 110, h: 140, to: c.back.to, spawn: c.back.spawn },
  ];
  if (c.next) {
    decor.push({ id: `door${i++}`, kind: 'door', x: W - 160, y: 820, w: 110, h: 140, seed: 9, text: c.next.label });
    zones.push({ id: 'to_next', kind: 'exit', x: W - 160, y: 820, w: 110, h: 140, to: c.next.to, spawn: c.next.spawn, requiresBoss: c.boss });
  }
  return {
    id: c.id, name: c.name, width: W, height: 1080, groundY: GROUND_Y, theme: 'arena', music: 'none',
    solids, oneWays, decor, secrets: [], spawns: [], npcs: [],
    checkpoints: [{ id: c.lampId, name: c.lampName, x: 240 }],
    pickups: [], zones,
    spawnPoints: { entry: { x: 330, y: GROUND_Y }, from_east: { x: W - 340, y: GROUND_Y } },
    boss: { id: c.boss, x: c.bossX, barrierX: 590 },
    enemyScale: c.scale,
  };
}

export const REGIONS: Record<RegionId, RegionDef> = {
  city: buildCity(),
  boss_arena: buildArena({
    id: 'boss_arena', name: 'Warden Arena', width: 2000, boss: 'warden', bossX: 1500, lampId: 'arena', lampName: 'Arena Lamp',
    platforms: [[760, 830, 240], [1160, 730, 280], [1580, 830, 240]], palette: 0,
    back: { to: 'city', spawn: 'gate_exit' }, next: { to: 'docks', spawn: 'from_west', label: 'DOCKS' },
  }),
  docks: buildDocks(),
  tyrant_arena: buildArena({
    id: 'tyrant_arena', name: 'Tyrant Quay', width: 2300, boss: 'marrow', bossX: 1750, lampId: 'quay', lampName: 'Quay Lamp',
    platforms: [[760, 840, 220], [1080, 750, 240], [1420, 840, 220], [1760, 750, 240]], palette: 1, scale: { hp: 1.3, atk: 1.2 },
    back: { to: 'docks', spawn: 'from_east' }, next: { to: 'foundry', spawn: 'from_west', label: 'FOUNDRY' },
  }),
  foundry: buildFoundry(),
  empress_arena: buildArena({
    id: 'empress_arena', name: 'Empress Throne', width: 2500, boss: 'ignis', bossX: 1900, lampId: 'throne', lampName: 'Throne Lamp',
    platforms: [[760, 840, 220], [1040, 750, 220], [1320, 660, 240], [1640, 750, 220], [1920, 840, 220]], palette: 2, scale: { hp: 1.7, atk: 1.45 },
    back: { to: 'foundry', spawn: 'from_east' },
  }),
};
