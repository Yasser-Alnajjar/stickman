import type { RegionDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';

/** Neon Street layout. Solid/ledge/spawn/pickup/checkpoint ids are the save-compatible originals. */
export function buildNeonStreet(): RegionDef {
  const W = 9600;
  const b = new RegionBuilder(W, 'tower');

  // --- Segment A: Plaza
  b.solids.push({ id: 'crate1', x: 980, y: 890, w: 100, h: 70, kind: 'crate' });
  b.solids.push({ id: 'crate2', x: 1080, y: 820, w: 100, h: 140, kind: 'crate' });
  b.ledge(1230, 770, 240); b.ledge(1530, 700, 240);
  b.roof('roof1', 1750, 640, 500);
  // --- Segment B: Market
  b.roof('roof2', 2420, 590, 520);
  b.ledge(3010, 700, 200); b.ledge(3250, 800, 200);
  // --- Segment C: signal tower & hidden rooftop room
  [[4100, 840], [4330, 730], [4100, 620], [4330, 510], [4100, 400]].forEach(([x, y]) => b.ledge(x, y, 190));
  b.ledge(4340, 300, 300);
  b.add('beacon', 4560, 300, 60, 140);
  b.ledge(4640, 850, 130);
  b.solids.push({ id: 'roofW', x: 4800, y: 720, w: 520, h: 28, kind: 'roof' });
  b.add('tower', 4800, 748, 520, GROUND_Y - 748);
  b.solids.push({ id: 'ceilW', x: 4830, y: 590, w: 460, h: 26, kind: 'roof' });
  b.solids.push({ id: 'wallW', x: 5290, y: 590, w: 30, h: 158, kind: 'wall' });
  b.add('tower', 4830, 560, 460, 40);
  b.add('neon', 4900, 540, 300, 30, 'WAREHOUSE');
  b.add('arrow', 4690, 780, 90, 30, 'SECRET?');
  // --- Segment D: Industrial row
  b.solids.push({ id: 'crate3', x: 6200, y: 890, w: 100, h: 70, kind: 'crate' });
  b.solids.push({ id: 'crate4', x: 6300, y: 820, w: 100, h: 140, kind: 'crate' });
  b.roof('roof3', 6440, 740, 600);
  b.ledge(7110, 790, 240);
  // --- Segment E: Gate approach
  b.solids.push({ id: 'crate5', x: 7900, y: 890, w: 100, h: 70, kind: 'crate' });
  b.roof('roof4', 8050, 760, 380);
  b.solids.push({ id: 'gate', x: 9000, y: 700, w: 44, h: 260, kind: 'gate', openFlag: 'gate_open' });
  b.add('door', 9400, 820, 120, 140, 'WARDEN GATE');
  b.solids.push({ id: 'wallEast', x: 9560, y: 0, w: 40, h: GROUND_Y, kind: 'wall' });

  // --- Layer 1: skyline of setback skyscrapers (non-colliding, behind everything)
  const rnd = mulberry32(1337);
  for (let x = -100; x < W; ) {
    const w = 180 + Math.floor(rnd() * 190);
    const h = 300 + Math.floor(rnd() * 480);
    b.add('skyscraper', x, GROUND_Y - h, w, h);
    x += w + (rnd() < 0.3 ? 30 : 0);
  }
  // --- Layer 2: skybridges tying the towers together, signs, billboards, holograms
  for (const [x, y, w] of [[1300, 330, 640], [3300, 380, 560], [5500, 300, 760], [7400, 350, 700]]) b.add('skybridge', x, y, w, 46);
  for (const x of [900, 2300, 3700, 5900, 7100, 8500]) b.add('billboard', x, 400 + Math.floor(rnd() * 80), 210 + Math.floor(rnd() * 60), 110);
  [['BAR', 700], ['RAMEN', 2050], ['ARCADE', 3000], ['HOTEL', 5800], ['DOJO', 520], ['METRO', 7400], ['NOODLE', 6900]].forEach(([t, x]) =>
    b.add('neon', x as number, GROUND_Y - 280 - rnd() * 80, 150, 36, t as string));
  for (const x of [1450, 3430, 5650, 7600, 8900]) b.add('hologram', x, 720, 120, 240);
  b.add('pipes', 6000, 700, 900, 80);
  b.add('banner', 8800, 700, 60, 200);
  // --- Layer 3: street furniture
  for (let x = 240; x < W - 100; x += 380 + Math.floor(rnd() * 120)) b.add('streetlight', x, GROUND_Y, 20, 160);
  for (let x = 620; x < W - 300; x += 700 + Math.floor(rnd() * 300)) b.add('vent', x, GROUND_Y, 52, 26);
  for (let x = 400; x < W - 300; x += 520 + Math.floor(rnd() * 260)) b.add('puddle', x, GROUND_Y + 2, 110 + Math.floor(rnd() * 90), 8);
  // --- Layer 4: foreground (drawn over the actors, kept thin so play stays readable)
  for (let x = 300; x < W - 400; x += 1100 + Math.floor(rnd() * 500)) b.add('cables', x, 250, 900, 70, undefined, 'front');
  for (const x of [1900, 4000, 6400, 8300]) b.add('drone', x, 360, 160, 0, undefined, 'front');

  return {
    id: 'city', name: 'Neon Street', width: W, height: 1080, groundY: GROUND_Y, theme: 'neon', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor,
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
    ],
    spawnPoints: { from_arena: { x: 9300, y: GROUND_Y } },
    portals: { forward: { x: 9400, y: 800, w: 120, h: 160 } },
    enemyScale: { hp: 1, atk: 1 },
  };
}
