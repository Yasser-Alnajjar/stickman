import type { RegionDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';
import { sp } from '../enemy-kit';

/**
 * Hollow Wood: a haunted forest that gives way to a cursed castle. The first half is graveyards and branch
 * walks above the fog; the second half is the castle's outer wall, gatehouse and courtyard parapets.
 */
export function buildHollowWood(): RegionDef {
  const W = 10600;
  const b = new RegionBuilder(W, 'crypt');
  const rnd = mulberry32(1313);

  // Layer 0: forest and castle backdrop
  for (let x = 100; x < 5500; x += 300 + Math.floor(rnd() * 240)) b.add('deadtree', x, GROUND_Y - 340 - Math.floor(rnd() * 90), 180, 340 + Math.floor(rnd() * 80));
  for (const [x, w, h] of [[5800, 800, 460], [7000, 620, 520], [8300, 760, 480], [9600, 700, 440]]) b.add('castle', x, GROUND_Y - h, w, h);

  // A: the graveyard
  b.crate('tombA1', 1000, 890, 110); b.crate('tombA2', 1110, 820, 110); b.crate('tombA3', 1220, 750, 110);
  b.roof('cryptA', 1370, 700, 560, 'crypt'); b.ledge(2060, 760, 200); b.crate('tombA4', 2340, 880, 110);
  // B: the branch walk over the fog
  b.ledge(2520, 790, 200); b.ledge(2800, 730, 200); b.ledge(3080, 670, 200); b.ledge(3360, 610, 200); b.ledge(3640, 670, 200); b.ledge(3920, 730, 200);
  // C: the ruined chapel tower, with the chalice at its top
  b.crate('stepC', 4300, 880, 110); b.tower(4560, [860, 750, 640, 530], 340);
  // D: castle outer wall, gatehouse
  b.crate('wallStep0', 5500, 890, 110); b.crate('wallStep1', 5610, 820, 110);
  b.roof('wallD', 5780, 760, 640, 'castle'); b.ledge(6540, 700, 200); b.roof('gatehouseD', 6840, 640, 560, 'castle');
  b.crate('dropD', 7550, 880, 120);
  // E: courtyard parapets up to the keep door
  b.crate('keepStep0', 7900, 890, 110); b.crate('keepStep1', 8010, 830, 110); b.roof('parapetE', 8160, 760, 620, 'castle');
  b.ledge(8880, 700, 180); b.ledge(9140, 640, 180); b.roof('keepE', 9420, 600, 620, 'castle');
  b.wallEnd(W - 40);

  [['GRAVEYARD', 780], ['FOG WALK', 2500], ['CHAPEL', 4300], ['GATEHOUSE', 5400], ['KEEP', 9300]].forEach(([t, x]) => b.add('sign', x as number, GROUND_Y - 320, 160, 40, t as string));
  for (let x = 240; x < 5500; x += 130 + Math.floor(rnd() * 200)) b.add('gravestone', x, GROUND_Y - 64, 40, 64);
  for (let x = 160; x < 5400; x += 520 + Math.floor(rnd() * 240)) b.add('fence', x, GROUND_Y - 80, 300, 80);
  for (let x = 300; x < W - 200; x += 360 + Math.floor(rnd() * 200)) b.add('lantern', x, GROUND_Y, 20, 180);
  for (const x of [5700, 6700, 7700, 8700, 9700]) b.add('candelabra', x, GROUND_Y, 20, 90);
  for (const x of [1500, 3800, 6200, 8400]) b.add('coffin', x, GROUND_Y - 70, 60, 70);
  for (const x of [1800, 3300, 5000, 7300, 9100]) b.add('thorns', x, 0, 80, 280 + Math.floor(rnd() * 140), undefined, 'front');
  b.door(60, 'BACK'); b.door(W - 230, 'KEEP');

  return {
    id: 'hollow_city', name: 'Hollow Wood', width: W, height: 1080, groundY: GROUND_Y, theme: 'hollow', music: 'city',
    spawns: [
      sp('hw1', 'grave_ghoul', 900, undefined, 200), sp('hw2', 'wailing_wraith', 1500, 700, 100), sp('hw3', 'bone_knight', 1800, undefined, 100),
      sp('hw4', 'grave_ghoul', 2200, undefined, 220), sp('hw5', 'hollow_wolf', 2600, undefined, 160), sp('hw6', 'wailing_wraith', 2900, 730, 80),
      sp('hw7', 'grave_ghoul', 3180, 670, 90), sp('hw8', 'bone_knight', 3500, undefined, 100), sp('hw9', 'wailing_wraith', 3460, 610, 70),
      sp('hw10', 'hollow_wolf', 4000, undefined, 200), sp('hw11', 'grave_ghoul', 4400, undefined, 230), sp('hw12', 'bone_knight', 4900, undefined, 100),
      sp('hw13', 'wailing_wraith', 5000, 530, 60), sp('hw14', 'hollow_wolf', 5400, undefined, 180), sp('hw15', 'bone_knight', 5900, 760, 110),
      sp('hw16', 'wailing_wraith', 6200, 760, 90), sp('hw17', 'grave_ghoul', 6600, 700, 70), sp('hw18', 'bone_knight', 7000, 640, 100),
      sp('hw19', 'hollow_wolf', 7400, undefined, 200), sp('hw20', 'wailing_wraith', 7100, 640, 100), sp('hw21', 'grave_ghoul', 7900, undefined, 220),
      sp('hw22', 'bone_knight', 8300, 760, 100), sp('hw23', 'wailing_wraith', 8700, 760, 90), sp('hw24', 'hollow_wolf', 9000, undefined, 200),
      sp('hw25', 'bone_knight', 9300, undefined, 100), sp('hw26', 'wailing_wraith', 9600, 600, 100), sp('hw27', 'hollow_wolf', 9900, 600, 120),
    ],
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    checkpoints: [
      { id: 'hw_gate', name: 'Wood Gate Lamp', x: 640 }, { id: 'hw_yard', name: 'Graveyard Lamp', x: 2400 },
      { id: 'hw_chapel', name: 'Chapel Lamp', x: 4300 }, { id: 'hw_wall', name: 'Castle Wall Lamp', x: 6000 },
      { id: 'hw_court', name: 'Courtyard Lamp', x: 8250 },
    ],
    pickups: [
      { id: 'chest_crypt', item: 'health_tonic', qty: 1, x: 1700, y: 668, chest: true },
      { id: 'chest_fog', item: 'energy_cell', qty: 1, x: 3470, y: 578, chest: true },
      { id: 'moon_chalice', item: 'moon_chalice', qty: 1, x: 5000, y: 398 },
      { id: 'chest_wall', item: 'health_tonic', qty: 2, x: 6100, y: 728, chest: true },
      { id: 'chest_gatehouse', item: 'energy_cell', qty: 2, x: 7100, y: 608, chest: true },
      { id: 'chest_keep', item: 'health_tonic', qty: 2, x: 9800, y: 568, chest: true },
    ],
    zones: [],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    enemyScale: { hp: 3.2, atk: 2.3 },
  };
}
