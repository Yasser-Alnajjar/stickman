import type { RegionDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';
import { sp } from '../enemy-kit';

/**
 * Cogwork Depths: a city of brass built inside a cavern. Rhythm traversal: travelator belts carry you through the
 * workshops, catwalks climb the boiler spire, and a clocktower road ends at the great escapement.
 */
export function buildCogworkDepths(): RegionDef {
  const W = 11200;
  const b = new RegionBuilder(W, 'building');
  const rnd = mulberry32(9009);

  for (const [x, w, h] of [[300, 520, 420], [2900, 640, 480], [6200, 560, 440], [9000, 620, 460]]) b.add('building', x, GROUND_Y - h, w, h);
  for (let x = 200; x < W; x += 700 + Math.floor(rnd() * 400)) b.add('gear', x, GROUND_Y - 520 - Math.floor(rnd() * 120), 200 + Math.floor(rnd() * 120), 200);
  for (const x of [1500, 4300, 7400, 10100]) b.add('clock', x, GROUND_Y - 560, 160, 0);
  for (const x of [900, 3900, 6900, 9700]) b.add('chimney', x, GROUND_Y, 40, 480);
  for (const x of [1200, 5200, 8100]) b.add('boiler', x, GROUND_Y - 200, 110, 200);
  for (const x of [1900, 4700, 7800]) b.add('pipe', x, GROUND_Y - 360, 700, 14);
  for (const x of [2200, 5800, 8700]) b.add('furnace', x, GROUND_Y - 180, 170, 180);

  // A: foundry approach
  b.crate('plateA1', 1000, 890, 110); b.crate('plateA2', 1110, 820, 110); b.crate('plateA3', 1220, 750, 110);
  b.roof('workshopA', 1370, 700, 600); b.ledge(2090, 760, 200); b.ledge(2370, 700, 200);
  // B: gear hall: climbing catwalks
  b.roof('hallB', 2650, 760, 400, 'building'); b.ledge(3180, 700, 180); b.ledge(3440, 640, 180); b.ledge(3700, 580, 180); b.ledge(3960, 640, 180); b.roof('hallB2', 4220, 700, 460, 'building');
  // C: boiler spire
  b.crate('stepC', 4750, 880, 110); b.tower(4900, [860, 750, 640, 530], 340);
  // D: belt works: crushers and conveyors
  b.crate('beltD1', 5900, 890, 110); b.crate('beltD2', 6010, 820, 110);
  b.roof('beltD', 6160, 760, 520, 'building'); b.ledge(6840, 700, 200); b.ledge(7140, 640, 200); b.roof('beltD3', 7440, 700, 560, 'building');
  // E: clocktower road
  b.crate('towerE1', 8300, 890, 110); b.crate('towerE2', 8410, 830, 110); b.roof('towerE', 8560, 760, 560, 'building');
  b.ledge(9250, 700, 180); b.roof('escapeE', 9500, 640, 640, 'building');
  b.wallEnd(W - 40);

  [['FOUNDRY', 780], ['GEAR HALL', 2500], ['BOILER', 4600], ['BELT WORKS', 5800], ['CLOCKTOWER', 8200]].forEach(([t, x]) => b.add('sign', x as number, GROUND_Y - 330, 160, 40, t as string));
  for (let x = 260; x < W - 200; x += 420 + Math.floor(rnd() * 240)) b.add('lamp', x, GROUND_Y, 20, 190);
  for (let x = 500; x < W - 200; x += 780 + Math.floor(rnd() * 360)) b.add('valve', x, GROUND_Y, 20, 70);
  for (const x of [800, 1700, 3300, 5300, 7600, 9400]) b.add('steamvent', x, GROUND_Y, 30, 0, undefined, 'front');
  for (const x of [1100, 4000, 7000, 9800]) b.add('chain', x, 0, 0, 260, undefined, 'front');
  for (const x of [1600, 3000, 8000, 10000]) b.add('piston', x, GROUND_Y - 240, 50, 220);
  b.add('conveyor', 2650, GROUND_Y, 2030, 1); b.add('conveyor', 6160, GROUND_Y, 1840, -1);
  b.door(60, 'BACK'); b.door(W - 230, 'ESCAPEMENT');

  return {
    id: 'cogwork_city', name: 'Cogwork Depths', width: W, height: 1080, groundY: GROUND_Y, theme: 'cogwork', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    spawns: [
      sp('cw1', 'spring_runner', 900, undefined, 200), sp('cw2', 'steam_gunner', 1500, 700, 80), sp('cw3', 'clockwork_soldier', 1800, undefined, 100),
      sp('cw4', 'steam_gunner', 2200, 760, 60), sp('cw5', 'spring_runner', 2500, undefined, 230), sp('cw6', 'cog_brute', 2800, undefined, 80),
      sp('cw7', 'steam_gunner', 3250, 700, 60), sp('cw8', 'clockwork_soldier', 3600, undefined, 100), sp('cw9', 'spring_runner', 3500, 640, 80),
      sp('cw10', 'steam_gunner', 4000, 640, 60), sp('cw11', 'cog_brute', 4400, undefined, 80), sp('cw12', 'clockwork_soldier', 5200, undefined, 100),
      sp('cw13', 'steam_gunner', 5300, 530, 60), sp('cw14', 'spring_runner', 5700, undefined, 240), sp('cw15', 'steam_gunner', 6300, 760, 80),
      sp('cw16', 'cog_brute', 6500, undefined, 80), sp('cw17', 'clockwork_soldier', 6900, undefined, 100), sp('cw18', 'steam_gunner', 7200, 640, 60),
      sp('cw19', 'spring_runner', 7600, 700, 100), sp('cw20', 'cog_brute', 7900, undefined, 70), sp('cw21', 'clockwork_soldier', 8400, undefined, 100),
      sp('cw22', 'steam_gunner', 8800, 760, 80), sp('cw23', 'spring_runner', 9100, undefined, 240), sp('cw24', 'steam_gunner', 9700, 640, 80),
      sp('cw25', 'cog_brute', 9900, undefined, 70), sp('cw26', 'clockwork_soldier', 10200, undefined, 90), sp('cw27', 'spring_runner', 10500, undefined, 200),
    ],
    checkpoints: [
      { id: 'cw_gate', name: 'Depths Gate Lamp', x: 640 }, { id: 'cw_hall', name: 'Gear Hall Lamp', x: 2560 },
      { id: 'cw_boiler', name: 'Boiler Lamp', x: 4650 }, { id: 'cw_belt', name: 'Belt Works Lamp', x: 6100 },
      { id: 'cw_tower', name: 'Clocktower Lamp', x: 8250 },
    ],
    pickups: [
      { id: 'chest_workshop', item: 'health_tonic', qty: 1, x: 1700, y: 668, chest: true },
      { id: 'chest_gear', item: 'energy_cell', qty: 1, x: 3770, y: 548, chest: true },
      { id: 'master_cog', item: 'master_cog', qty: 1, x: 5340, y: 398 },
      { id: 'chest_belt', item: 'health_tonic', qty: 2, x: 6500, y: 728, chest: true },
      { id: 'chest_belt2', item: 'energy_cell', qty: 2, x: 7800, y: 668, chest: true },
      { id: 'chest_escape', item: 'health_tonic', qty: 2, x: 9900, y: 608, chest: true },
    ],
    zones: [],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    drift: [{ x: 2650, w: 2030, vx: 125 }, { x: 6160, w: 1840, vx: -115 }],
    enemyScale: { hp: 3.6, atk: 2.5 },
  };
}
