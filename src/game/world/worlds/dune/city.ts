import type { RegionDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';
import { sp } from '../enemy-kit';

/**
 * Dune Kingdom: a desert capital above, and its tombs below. Two routes cross the middle: climb the palace roofs,
 * or take the low burial tunnel (a real ceiling, so jumps are cut short) and fight in the torchlight.
 */
export function buildDuneKingdom(): RegionDef {
  const W = 10800;
  const b = new RegionBuilder(W, 'palace');
  const rnd = mulberry32(6006);

  // Layer 0: skyline
  for (const [x, w, h] of [[500, 500, 380], [2700, 540, 430], [8500, 560, 400], [9800, 480, 360]]) b.add('palace', x, GROUND_Y - h, w, h);
  for (const x of [1300, 3600, 5100, 8200]) b.add('minaret', x, GROUND_Y - 520, 90, 520);
  b.add('sphinx', 4000, GROUND_Y - 300, 520, 300);
  for (const x of [2300, 7900, 10150]) b.add('obelisk', x, GROUND_Y - 360, 80, 360);
  for (let x = 140; x < 5400; x += 420 + Math.floor(rnd() * 260)) b.add('palm', x, GROUND_Y, 20, 230 + Math.floor(rnd() * 90));
  for (let x = 7800; x < W - 200; x += 480 + Math.floor(rnd() * 260)) b.add('palm', x, GROUND_Y, 20, 230 + Math.floor(rnd() * 90));
  b.add('sandfall', 4700, 260, 70, 700);

  // A: the bazaar terraces
  [[1000, 890], [1110, 820], [1220, 750]].forEach(([x, top], i) => b.crate(`bazaarStep${i}`, x, top, 110));
  b.roof('bazaarA', 1370, 700, 560); b.ledge(2060, 760, 200); b.ledge(2340, 700, 200); b.roof('terraceA', 2620, 640, 460);
  b.crate('bazaarDrop', 3150, 880, 120);
  // B: arches and awnings
  b.ledge(3400, 780, 200); b.ledge(3680, 720, 200); b.ledge(3960, 660, 200); b.ledge(4240, 720, 200);
  // C: obelisk tower with the scarab relic
  b.tower(4900, [860, 750, 640, 530], 340);
  // D: the tomb. A low ceiling over the road, with a rooftop route above it
  b.crate('tombStep0', 5460, 890, 110); b.crate('tombStep1', 5570, 820, 110);
  b.solids.push({ id: 'tombCeil', x: 5680, y: 770, w: 2020, h: 28, kind: 'roof' });
  b.add('tomb_back', 5680, 798, 2020, GROUND_Y - 798);
  b.crate('tombAltar1', 6200, 900, 150); b.crate('tombAltar2', 6900, 890, 150);
  b.crate('tombExit0', 7790, 820, 110); b.crate('tombExit1', 7900, 890, 110);
  // E: the palace road
  b.crate('gateStep0', 8040, 890, 110); b.crate('gateStep1', 8150, 830, 110);
  b.roof('gateE', 8300, 760, 480, 'palace'); b.ledge(8900, 700, 180); b.roof('hallE', 9150, 640, 560, 'palace');
  b.wallEnd(W - 40);

  [['BAZAAR', 760], ['ARCHES', 3300], ['TOMBS', 5380], ['PALACE', 8100], ['THRONE', 10100]].forEach(([t, x]) => b.add('sign', x as number, GROUND_Y - 320, 150, 40, t as string));
  for (let x = 220; x < W - 200; x += 460 + Math.floor(rnd() * 240)) b.add('jar', x, GROUND_Y, 44, 54);
  for (const x of [900, 2200, 3200, 4500, 8000, 9000, 10000]) b.add('brazier', x, GROUND_Y, 40, 90);
  for (let x = 1600; x < 5400; x += 700 + Math.floor(rnd() * 400)) b.add('stall', x, GROUND_Y - 100, 130, 100);
  for (const x of [1450, 2700, 3500, 8900, 9600]) b.add('banner', x, 520, 60, 160);
  for (const x of [5500, 7600]) b.add('cactus', x - 200, GROUND_Y, 20, 70);
  b.add('windband', 8800, GROUND_Y, 1500, 0);
  b.door(60, 'BACK'); b.door(W - 230, 'THRONE');

  return {
    id: 'dune_city', name: 'Dune Kingdom', width: W, height: 1080, groundY: GROUND_Y, theme: 'dune', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    spawns: [
      sp('dk1', 'sand_raider', 900, undefined, 200), sp('dk2', 'bone_archer', 1500, 700, 90), sp('dk3', 'mummy_warden', 1750, undefined, 100),
      sp('dk4', 'sand_raider', 2150, undefined, 200), sp('dk5', 'colossus', 2500, undefined, 80), sp('dk6', 'bone_archer', 2800, 640, 80),
      sp('dk7', 'sand_raider', 3500, 780, 90), sp('dk8', 'mummy_warden', 3300, undefined, 110), sp('dk9', 'bone_archer', 3980, 660, 60),
      sp('dk10', 'sand_raider', 4400, undefined, 230), sp('dk11', 'colossus', 4800, undefined, 80), sp('dk12', 'mummy_warden', 5100, undefined, 90),
      sp('dk13', 'bone_archer', 5200, 530, 60), sp('dk14', 'mummy_warden', 5900, undefined, 100), sp('dk15', 'sand_raider', 6200, undefined, 180),
      sp('dk16', 'colossus', 6500, undefined, 80), sp('dk17', 'mummy_warden', 6800, undefined, 90), sp('dk18', 'bone_archer', 7100, undefined, 80),
      sp('dk19', 'sand_raider', 7400, undefined, 160), sp('dk20', 'colossus', 7700, undefined, 70), sp('dk21', 'sand_raider', 8100, undefined, 220),
      sp('dk22', 'bone_archer', 8500, 760, 80), sp('dk23', 'mummy_warden', 8800, undefined, 100), sp('dk24', 'bone_archer', 9300, 640, 90),
      sp('dk25', 'colossus', 9500, undefined, 80), sp('dk26', 'sand_raider', 9800, undefined, 200), sp('dk27', 'mummy_warden', 10000, undefined, 90),
    ],
    checkpoints: [
      { id: 'dk_gate', name: 'Caravan Gate Lamp', x: 640 }, { id: 'dk_bazaar', name: 'Bazaar Lamp', x: 2300 },
      { id: 'dk_obelisk', name: 'Obelisk Lamp', x: 4750 }, { id: 'dk_tomb', name: 'Tomb Lamp', x: 5800 },
      { id: 'dk_palace', name: 'Palace Lamp', x: 8700 },
    ],
    pickups: [
      { id: 'chest_bazaar', item: 'health_tonic', qty: 1, x: 1700, y: 668, chest: true },
      { id: 'chest_arches', item: 'energy_cell', qty: 1, x: 4300, y: 688, chest: true },
      { id: 'golden_scarab', item: 'golden_scarab', qty: 1, x: 5340, y: 398 },
      { id: 'chest_tomb1', item: 'health_tonic', qty: 2, x: 6280, y: 868, chest: true },
      { id: 'chest_tomb2', item: 'energy_cell', qty: 2, x: 6980, y: 858, chest: true },
      { id: 'chest_hall', item: 'health_tonic', qty: 2, x: 9500, y: 608, chest: true },
    ],
    zones: [],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    drift: [{ x: 8800, w: 1500, vx: -90 }],
    enemyScale: { hp: 2.6, atk: 1.95 },
  };
}
