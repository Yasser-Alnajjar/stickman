import type { RegionDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';
import { sp } from '../enemy-kit';

/**
 * Aether Citadel: a kingdom of floating isles and marble spires above a sea of cloud. The most vertical layout of
 * the campaign (platforms rise to 250px above the floor of the sky) and the strongest winds: gust corridors push
 * you with, then against, your direction of travel.
 */
export function buildAetherCitadel(): RegionDef {
  const W = 11600;
  const b = new RegionBuilder(W, 'column');
  const rnd = mulberry32(2112);

  for (const [x, w, h] of [[500, 190, 520], [2800, 200, 560], [6000, 190, 540], [9000, 200, 580], [10500, 190, 500]]) b.add('spire', x, GROUND_Y - h, w, h);
  for (let x = 300; x < W; x += 900 + Math.floor(rnd() * 500)) b.add('isle', x, GROUND_Y - 640 - Math.floor(rnd() * 160), 260 + Math.floor(rnd() * 120), 130);
  for (const x of [1500, 4300, 7000, 9800]) b.add('windmill', x, GROUND_Y - 360, 130, 360);
  for (const x of [900, 3600, 6600, 9400]) b.add('statue', x, GROUND_Y - 280, 130, 280);

  // A: the cloud stairs
  b.crate('stepA1', 1000, 890, 110); b.crate('stepA2', 1110, 820, 110); b.crate('stepA3', 1220, 750, 110);
  b.roof('isleA', 1370, 700, 560); b.ledge(2090, 650, 190); b.ledge(2370, 590, 190); b.ledge(2650, 650, 190);
  // B: the windmill rise (a tailwind carries you up the ledges)
  b.crate('stepB', 3000, 880, 110); b.ledge(3180, 770, 190); b.ledge(3450, 700, 190); b.ledge(3720, 630, 190); b.ledge(3990, 560, 190); b.roof('isleB', 4260, 520, 460);
  // C: the sky tower with the prism
  b.crate('stepC', 4850, 880, 110); b.tower(5000, [860, 750, 640, 530], 340);
  // D: the chain bridges, against a headwind
  b.crate('stepD1', 5900, 890, 110); b.crate('stepD2', 6010, 820, 110); b.roof('bridgeD1', 6160, 760, 420);
  b.ledge(6720, 700, 190); b.ledge(7000, 640, 190); b.ledge(7280, 580, 190); b.roof('bridgeD2', 7560, 640, 460); b.ledge(8160, 690, 190);
  // E: the citadel approach
  b.crate('stepE1', 8650, 890, 110); b.crate('stepE2', 8760, 830, 110); b.roof('terraceE', 8910, 760, 560);
  b.ledge(9600, 700, 180); b.ledge(9870, 640, 180); b.roof('thronesE', 10140, 580, 640);
  b.wallEnd(W - 40);

  [['CLOUD STAIRS', 780], ['WINDMILLS', 2850], ['SKY TOWER', 4750], ['BRIDGES', 5800], ['CITADEL', 8550]].forEach(([t, x]) => b.add('sign', x as number, GROUND_Y - 320, 170, 40, t as string));
  for (let x = 220; x < W - 200; x += 520 + Math.floor(rnd() * 260)) b.add('column', x, GROUND_Y - 150, 36, 150);
  for (const x of [700, 3900, 7200, 10200]) b.add('fountain', x, GROUND_Y - 90, 120, 90);
  for (const x of [1300, 3300, 5500, 8200, 10900]) b.add('banner', x, 480, 60, 180);
  for (let x = 360; x < W - 200; x += 560 + Math.floor(rnd() * 240)) b.add('lantern', x, GROUND_Y, 20, 170);
  b.add('gustband', 3000, GROUND_Y, 1500, 1); b.add('gustband', 6600, GROUND_Y, 1900, -1);
  b.door(60, 'BACK'); b.door(W - 230, 'THRONE');

  return {
    id: 'aether_city', name: 'Aether Citadel', width: W, height: 1080, groundY: GROUND_Y, theme: 'aether', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    spawns: [
      sp('ac1', 'gale_sprite', 900, undefined, 230), sp('ac2', 'storm_archer', 1500, 700, 80), sp('ac3', 'cloud_knight', 1800, undefined, 100),
      sp('ac4', 'storm_archer', 2150, 650, 60), sp('ac5', 'gale_sprite', 2500, 590, 100), sp('ac6', 'thunder_golem', 2800, undefined, 80),
      sp('ac7', 'storm_archer', 3250, 770, 60), sp('ac8', 'cloud_knight', 3500, undefined, 100), sp('ac9', 'gale_sprite', 3800, 630, 90),
      sp('ac10', 'storm_archer', 4100, 560, 60), sp('ac11', 'thunder_golem', 4400, 520, 80), sp('ac12', 'cloud_knight', 5300, undefined, 100),
      sp('ac13', 'storm_archer', 5400, 530, 60), sp('ac14', 'gale_sprite', 5800, undefined, 250), sp('ac15', 'storm_archer', 6300, 760, 80),
      sp('ac16', 'thunder_golem', 6500, undefined, 80), sp('ac17', 'cloud_knight', 6900, undefined, 100), sp('ac18', 'storm_archer', 7100, 640, 60),
      sp('ac19', 'gale_sprite', 7700, 640, 100), sp('ac20', 'thunder_golem', 8000, undefined, 70), sp('ac21', 'cloud_knight', 8300, 690, 80),
      sp('ac22', 'storm_archer', 9000, 760, 80), sp('ac23', 'gale_sprite', 9300, undefined, 250), sp('ac24', 'cloud_knight', 9700, 700, 90),
      sp('ac25', 'storm_archer', 10200, 580, 100), sp('ac26', 'thunder_golem', 10500, undefined, 70), sp('ac27', 'gale_sprite', 10800, undefined, 220),
    ],
    checkpoints: [
      { id: 'ac_gate', name: 'Cloud Gate Lamp', x: 640 }, { id: 'ac_mill', name: 'Windmill Lamp', x: 2900 },
      { id: 'ac_tower', name: 'Sky Tower Lamp', x: 4750 }, { id: 'ac_bridge', name: 'Bridge Lamp', x: 6100 },
      { id: 'ac_citadel', name: 'Citadel Lamp', x: 8600 },
    ],
    pickups: [
      { id: 'chest_isleA', item: 'health_tonic', qty: 1, x: 1700, y: 668, chest: true },
      { id: 'chest_mill', item: 'energy_cell', qty: 1, x: 4400, y: 488, chest: true },
      { id: 'aether_prism', item: 'aether_prism', qty: 1, x: 5440, y: 398 },
      { id: 'chest_bridge', item: 'health_tonic', qty: 2, x: 6400, y: 728, chest: true },
      { id: 'chest_span', item: 'energy_cell', qty: 2, x: 7800, y: 608, chest: true },
      { id: 'chest_throne', item: 'health_tonic', qty: 3, x: 10500, y: 548, chest: true },
    ],
    zones: [],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    drift: [{ x: 3000, w: 1500, vx: 135 }, { x: 6600, w: 1900, vx: -125 }],
    enemyScale: { hp: 4.0, atk: 2.75 },
  };
}
