import type { RegionDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';
import { sp } from '../enemy-kit';

/**
 * Jade Ruins: a drowned jungle temple. Traversal is stairs and ledges: stone stairways climb the idol's flank,
 * rope bridges span the ravines, a pyramid tower hides the relic, and a hall of pillars guards the sanctum road.
 */
export function buildJadeRuins(): RegionDef {
  const W = 10000;
  const b = new RegionBuilder(W, 'column');
  const rnd = mulberry32(2024);

  // --- Layer 0: the lost city behind the path
  for (const [x, w, h] of [[500, 900, 470], [3700, 1000, 520], [6900, 900, 460], [9000, 760, 420]]) b.add('pyramid', x, GROUND_Y - h, w, h);
  for (const x of [1900, 4900, 7900]) b.add('idol', x, GROUND_Y - 380, 200, 260);
  for (let x = 120; x < W; x += 340 + Math.floor(rnd() * 260)) b.add('tree', x, GROUND_Y - 330 - Math.floor(rnd() * 70), 170 + Math.floor(rnd() * 50), 330);
  for (const x of [1400, 2900, 4300, 5800, 7400, 8700]) b.add('arch', x, GROUND_Y - 300, 220, 300);
  for (const x of [1050, 3300, 5400, 6600, 8400]) b.add('obelisk', x, GROUND_Y - 330, 70, 330);
  b.add('waterfall', 2650, 220, 90, 700); b.add('waterfall', 6200, 200, 110, 720);

  // --- Layer 1: gameplay platforms
  // A: the idol's stairway (stone steps up to a temple roof, then back down)
  [[1000, 890], [1110, 820], [1220, 750], [1330, 680]].forEach(([x, top], i) => b.crate(`stairA${i}`, x, top, 110));
  b.roof('templeA', 1480, 640, 560, 'column');
  [[2100, 700], [2210, 770], [2320, 840]].forEach(([x, top], i) => b.crate(`stairB${i}`, x, top, 110));
  // B: rope bridges over the ravine
  b.ledge(3000, 760, 200); b.ledge(3340, 700, 200); b.ledge(3680, 640, 200); b.ledge(4020, 700, 200); b.ledge(4360, 760, 200);
  b.crate('plinthB', 4650, 880, 120);
  // C: the pyramid tower, relic at its crown
  b.tower(5100, [860, 750, 640, 530], 340);
  b.roof('shrineC', 5750, 760, 420, 'column');
  // D: hall of pillars
  b.roof('hallD1', 6500, 820, 460, 'column'); b.ledge(7040, 700, 180); b.roof('hallD2', 7280, 640, 560, 'column');
  b.crate('plinthD', 7950, 870, 120);
  // E: the sanctum steps
  [[8350, 890], [8460, 830], [8570, 770], [8680, 710]].forEach(([x, top], i) => b.crate(`stairE${i}`, x, top, 110));
  b.roof('sanctumE', 8830, 690, 520, 'column');
  b.wallEnd(W - 40);

  // --- Layer 2: detail
  [['RUINS', 800], ['TEMPLE', 2750], ['SUN GATE', 5000], ['HALL', 6300], ['SANCTUM', 9500]].forEach(([t, x]) => b.add('sign', x as number, GROUND_Y - 300, 150, 40, t as string));
  for (let x = 260; x < W - 200; x += 420 + Math.floor(rnd() * 200)) b.add('torch', x, GROUND_Y, 20, 150);
  for (const x of [1600, 3500, 5600, 7500, 9200]) b.add('brazier', x, GROUND_Y, 40, 90);
  for (let x = 380; x < W - 200; x += 260 + Math.floor(rnd() * 260)) b.add('fern', x, GROUND_Y, 40, 40 + Math.floor(rnd() * 30));
  for (const x of [1500, 3900, 6800, 8900]) b.add('vines', x, 0, 80, 260 + Math.floor(rnd() * 140), undefined, 'front');
  b.door(60, 'BACK', 'door'); b.door(W - 230, 'SANCTUM', 'door');

  return {
    id: 'jade_ruins', name: 'Jade Ruins', width: W, height: 1080, groundY: GROUND_Y, theme: 'jade', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    spawns: [
      sp('jr1', 'vine_stalker', 900, undefined, 160), sp('jr2', 'dart_priest', 1500, 640, 90), sp('jr3', 'temple_guardian', 1800, undefined, 100),
      sp('jr4', 'vine_stalker', 2300, undefined, 200), sp('jr5', 'moss_golem', 2600, undefined, 90), sp('jr6', 'dart_priest', 3100, 760, 60),
      sp('jr7', 'vine_stalker', 3400, 700, 80), sp('jr8', 'temple_guardian', 3800, undefined, 110), sp('jr9', 'dart_priest', 3760, 640, 60),
      sp('jr10', 'vine_stalker', 4300, undefined, 220), sp('jr11', 'moss_golem', 4800, undefined, 80), sp('jr12', 'temple_guardian', 5400, undefined, 100),
      sp('jr13', 'dart_priest', 5500, 530, 70), sp('jr14', 'vine_stalker', 5850, 760, 100), sp('jr15', 'dart_priest', 6000, undefined, 100),
      sp('jr16', 'moss_golem', 6400, undefined, 90), sp('jr17', 'temple_guardian', 6700, 820, 90), sp('jr18', 'vine_stalker', 7000, undefined, 230),
      sp('jr19', 'dart_priest', 7400, 640, 100), sp('jr20', 'temple_guardian', 7650, 640, 110), sp('jr21', 'moss_golem', 8000, undefined, 80),
      sp('jr22', 'vine_stalker', 8300, undefined, 200), sp('jr23', 'temple_guardian', 8900, 690, 100), sp('jr24', 'dart_priest', 9050, 690, 80),
      sp('jr25', 'moss_golem', 9300, undefined, 80), sp('jr26', 'vine_stalker', 9600, undefined, 180), sp('jr27', 'temple_guardian', 9800, undefined, 90),
    ],
    checkpoints: [
      { id: 'jr_gate', name: 'Ruin Gate Lamp', x: 640 }, { id: 'jr_stair', name: 'Idol Stair Lamp', x: 2700 },
      { id: 'jr_bridge', name: 'Rope Bridge Lamp', x: 4850 }, { id: 'jr_hall', name: 'Pillar Hall Lamp', x: 6300 },
      { id: 'jr_sanctum', name: 'Sanctum Lamp', x: 9400 },
    ],
    pickups: [
      { id: 'chest_templeA', item: 'health_tonic', qty: 1, x: 1760, y: 608, chest: true },
      { id: 'chest_bridge', item: 'energy_cell', qty: 1, x: 3780, y: 608, chest: true },
      { id: 'sun_disc', item: 'jade_sun_disc', qty: 1, x: 5440, y: 398 },
      { id: 'chest_shrine', item: 'health_tonic', qty: 2, x: 5960, y: 728, chest: true },
      { id: 'chest_hall', item: 'energy_cell', qty: 2, x: 7560, y: 608, chest: true },
      { id: 'chest_sanctum', item: 'health_tonic', qty: 2, x: 9100, y: 658, chest: true },
    ],
    zones: [],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    enemyScale: { hp: 2.0, atk: 1.65 },
  };
}
