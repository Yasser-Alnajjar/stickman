import type { RegionDef, SpawnDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';

/** Rust Docks layout. Solid/ledge/spawn/pickup/checkpoint ids are the save-compatible originals. */
export function buildRustDocks(): RegionDef {
  const W = 10400;
  const b = new RegionBuilder(W, 'container_stack');

  // --- Layer 0 (furthest): moored freighters. Added first so everything else paints over them.
  for (const [x, w] of [[1500, 980], [5150, 1120], [8600, 940]]) b.add('ship', x, GROUND_Y - 330, w, 400);
  // --- Layer 1: working harbour behind the pier: container yards, warehouses and gantry cranes, with gaps to see the bay
  const rnd = mulberry32(4242);
  for (let x = -60; x < W; ) {
    const r = rnd();
    if (r < 0.34) { const w = 260 + Math.floor(rnd() * 240), h = 130 + Math.floor(rnd() * 130); b.add('container_stack', x, GROUND_Y - h, w, h); x += w + 20 + rnd() * 80; }
    else if (r < 0.55) { const w = 320 + Math.floor(rnd() * 120); b.add('warehouse', x, GROUND_Y - 240, w, 240); x += w + 40; }
    else x += 260 + rnd() * 360;
  }
  for (const x of [2350, 4650, 7350, 9300]) b.add('crane', x, GROUND_Y, 230, 540 + Math.floor(rnd() * 60));

  // --- Layer 2: gameplay platforms (container roofs, sheds) and their bodies
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
  b.roof('shedD', 6900, 740, 900, 'warehouse'); b.ledge(7870, 820, 200); b.crate('crateD3', 8150, 890);
  // E: the pier
  b.ledge(8500, 860, 160); b.roof('pierE', 8700, 780, 420, 'warehouse'); b.crate('crateE1', 9500, 890);
  b.wallEnd(W - 40);

  // --- Layer 3: dockside detail
  [['CARGO', 800], ['FERRY', 2300], ['DOCK 9', 3500], ['SALT', 5900], ['HARBOR', 7600], ['PIER 4', 9000]].forEach(([t, x]) =>
    b.add('sign', x as number, GROUND_Y - 330, 150, 36, t as string));
  b.add('pipes', 2500, 700, 700, 80); b.add('pipes', 6000, 720, 800, 80);
  b.add('banner', 9900, 700, 60, 200);
  for (let x = 240; x < W - 100; x += 480 + Math.floor(rnd() * 140)) b.add('lamp', x, GROUND_Y, 20, 190);
  for (let x = 460; x < W - 200; x += 620 + Math.floor(rnd() * 300)) b.add('bollard', x, GROUND_Y, 26, 40);
  for (let x = 700; x < W - 300; x += 900 + Math.floor(rnd() * 500)) b.add('barrels', x, GROUND_Y, 100, 74);
  for (const x of [1900, 3650, 5300, 7050, 9200]) b.add('welder', x, 780, 24, 8);
  b.door(60, 'BACK'); b.door(W - 230, 'TYRANT');
  // --- Layer 4: foreground chains from unseen cranes
  for (const x of [1200, 3900, 6100, 8300]) b.add('chain', x, 0, 0, 250, undefined, 'front');

  const sp = (id: string, kind: SpawnDef['kind'], x: number, y?: number, patrol = 150): SpawnDef => ({ id, kind, x, y, patrol });
  return {
    id: 'docks', name: 'Rust Docks', width: W, height: 1080, groundY: GROUND_Y, theme: 'docks', music: 'city',
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
    ],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    enemyScale: { hp: 1.3, atk: 1.2 },
  };
}
