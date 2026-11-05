import type { RegionDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';
import { sp } from '../enemy-kit';

/**
 * Frostpeak Station: an abandoned arctic research complex on a mountain. Vertical traversal: climbs on ice shelves
 * between lab roofs, a gale-swept pass where the wind carries you, and a radar spire.
 */
export function buildFrostpeak(): RegionDef {
  const W = 10400;
  const b = new RegionBuilder(W, 'lab');
  const rnd = mulberry32(31337);

  // Layer 0: the station on the slope
  for (const [x, w, h] of [[300, 520, 340], [2600, 600, 400], [5200, 560, 380], [7800, 640, 420], [9300, 520, 340]]) b.add('lab', x, GROUND_Y - h, w, h);
  for (const x of [1200, 3900, 6500, 9000]) b.add('dome', x, GROUND_Y - 190, 260, 190);
  for (const x of [1800, 4600, 7300]) b.add('antenna', x, GROUND_Y, 20, 520 + Math.floor(rnd() * 100));
  for (let x = 160; x < W; x += 320 + Math.floor(rnd() * 240)) b.add('pine', x, GROUND_Y + 8, 100 + Math.floor(rnd() * 24), 190 + Math.floor(rnd() * 90));
  for (const x of [700, 3300, 5900, 8500]) b.add('radar', x, GROUND_Y - 240, 0, 200);

  // A: supply depot ledges
  b.crate('crateA1', 1000, 890, 100); b.crate('crateA2', 1100, 820, 100);
  b.ledge(1260, 760, 200); b.ledge(1540, 700, 200); b.roof('depotA', 1800, 640, 520);
  // B: the frozen ladder (an ice-shelf zig-zag up the cliff)
  b.tower(3000, [860, 750, 640, 530], 320); b.ledge(3640, 440, 200); b.ledge(3920, 520, 200); b.ledge(4200, 610, 200);
  b.crate('crateB', 4460, 880, 120);
  // C: the gale pass: a long shelf walk carried by the wind
  b.crate('crateGale', 4740, 880, 110); b.ledge(4900, 760, 240); b.ledge(5260, 700, 240); b.ledge(5620, 640, 240); b.roof('lab2', 5980, 700, 540);
  // D: lab roofs and a radar spire
  b.crate('crateD1', 6700, 890); b.crate('crateD2', 6800, 820);
  b.roof('labD', 6980, 700, 620, 'lab'); b.ledge(7700, 640, 180); b.ledge(7960, 560, 180); b.ledge(8220, 480, 180);
  b.roof('spireD', 8480, 440, 340, 'lab');
  // E: the cryo gate approach
  b.crate('crateE1', 9100, 880, 110); b.crate('crateE2', 9210, 810, 110); b.roof('gateE', 9380, 760, 460, 'lab');
  b.wallEnd(W - 40);

  [['STATION', 800], ['LAB 3', 2400], ['SUMMIT', 4300], ['GALE PASS', 4700], ['CRYO', 9600]].forEach(([t, x]) => b.add('sign', x as number, GROUND_Y - 300, 150, 40, t as string));
  for (const x of [640, 2200, 4250, 6350, 8700, 9950]) b.add('heater', x, GROUND_Y, 36, 70);
  for (let x = 420; x < W - 200; x += 520 + Math.floor(rnd() * 300)) b.add('spikes', x, GROUND_Y, 120, 54 + Math.floor(rnd() * 30));
  for (let x = 300; x < W - 200; x += 700 + Math.floor(rnd() * 400)) b.add('supplies', x, GROUND_Y - 56, 70, 56);
  for (const x of [1700, 4500, 7500, 9500]) b.add('hangice', x, 0, 400, 200, undefined, 'front');
  b.add('windband', 4850, GROUND_Y, 1400, 0); b.add('windband', 7350, GROUND_Y, 700, 0);
  b.door(60, 'BACK'); b.door(W - 230, 'CRYO');

  return {
    id: 'frostpeak', name: 'Frostpeak Station', width: W, height: 1080, groundY: GROUND_Y, theme: 'frost', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    spawns: [
      sp('fp1', 'snow_stalker', 900, undefined, 180), sp('fp2', 'cryo_trooper', 1450, undefined, 90), sp('fp3', 'rime_knight', 1700, undefined, 100),
      sp('fp4', 'cryo_trooper', 2000, 640, 80), sp('fp5', 'snow_stalker', 2400, undefined, 220), sp('fp6', 'yeti_brute', 2800, undefined, 90),
      sp('fp7', 'cryo_trooper', 3100, 860, 40), sp('fp8', 'rime_knight', 3500, undefined, 100), sp('fp9', 'snow_stalker', 3700, 440, 60),
      sp('fp10', 'cryo_trooper', 4000, 520, 60), sp('fp11', 'yeti_brute', 4400, undefined, 90), sp('fp12', 'snow_stalker', 4800, undefined, 220),
      sp('fp13', 'cryo_trooper', 5000, 760, 80), sp('fp14', 'rime_knight', 5380, 700, 80), sp('fp15', 'snow_stalker', 5700, 640, 90),
      sp('fp16', 'cryo_trooper', 6100, 700, 100), sp('fp17', 'yeti_brute', 6400, undefined, 90), sp('fp18', 'rime_knight', 6600, undefined, 100),
      sp('fp19', 'snow_stalker', 7100, 700, 100), sp('fp20', 'cryo_trooper', 7200, 700, 90), sp('fp21', 'yeti_brute', 7500, undefined, 80),
      sp('fp22', 'cryo_trooper', 8000, 560, 60), sp('fp23', 'snow_stalker', 8300, 480, 70), sp('fp24', 'rime_knight', 8600, 440, 80),
      sp('fp25', 'yeti_brute', 8900, undefined, 90), sp('fp26', 'cryo_trooper', 9500, 760, 100), sp('fp27', 'rime_knight', 9700, 760, 90),
      sp('fp28', 'snow_stalker', 9900, undefined, 200), sp('fp29', 'yeti_brute', 10050, undefined, 70),
    ],
    checkpoints: [
      { id: 'fp_gate', name: 'Station Gate Lamp', x: 640 }, { id: 'fp_depot', name: 'Supply Depot Lamp', x: 2300 },
      { id: 'fp_summit', name: 'Summit Lamp', x: 4300 }, { id: 'fp_lab', name: 'Lab Roof Lamp', x: 6350 },
      { id: 'fp_cryo', name: 'Cryo Gate Lamp', x: 9900 },
    ],
    pickups: [
      { id: 'chest_depot', item: 'health_tonic', qty: 1, x: 2100, y: 608, chest: true },
      { id: 'chest_ladder', item: 'energy_cell', qty: 1, x: 3730, y: 408, chest: true },
      { id: 'chest_gale', item: 'health_tonic', qty: 2, x: 5740, y: 608, chest: true },
      { id: 'frost_core', item: 'frozen_core', qty: 1, x: 8580, y: 408 },
      { id: 'chest_lab', item: 'energy_cell', qty: 2, x: 7300, y: 668, chest: true },
      { id: 'chest_gateE', item: 'health_tonic', qty: 2, x: 9600, y: 728, chest: true },
    ],
    zones: [],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    drift: [{ x: 4850, w: 1400, vx: -95 }, { x: 7350, w: 700, vx: 80 }],
    enemyScale: { hp: 2.3, atk: 1.8 },
  };
}
