import type { RegionDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';
import { sp } from '../enemy-kit';

/**
 * Helios Ring: an orbital station. Traversal is hover pads and gantries, with travelators (conveyor bands) that carry
 * you with or against your direction of travel, and a reactor spire that holds the relic.
 */
export function buildHeliosRing(): RegionDef {
  const W = 11000;
  const b = new RegionBuilder(W, 'module');
  const rnd = mulberry32(7007);

  for (const [x, w, h] of [[400, 640, 400], [3100, 700, 460], [6300, 640, 420], [9200, 700, 440]]) b.add('module', x, GROUND_Y - h, w, h);
  for (const x of [1500, 4300, 7500, 9900]) b.add('viewport', x, GROUND_Y - 420, 360, 170);
  for (const x of [2200, 5400, 8400]) b.add('solar', x, GROUND_Y - 520, 240, 520);
  for (let x = 200; x < W; x += 560 + Math.floor(rnd() * 240)) b.add('pylon', x, GROUND_Y - 300 - Math.floor(rnd() * 120), 40, 300 + Math.floor(rnd() * 120));
  for (const x of [900, 3700, 6900]) b.add('pod', x, GROUND_Y - 100, 150, 100);

  // A: the cargo bay
  b.crate('cargoA1', 1000, 890, 110); b.crate('cargoA2', 1110, 820, 110); b.crate('cargoA3', 1220, 750, 110);
  b.roof('bayA', 1370, 700, 600); b.ledge(2090, 760, 200); b.ledge(2370, 700, 200);
  // B: the travelator deck (conveyors run beneath these pads)
  b.roof('deckB', 2650, 760, 460, 'module'); b.ledge(3250, 700, 180); b.ledge(3500, 640, 180); b.ledge(3750, 700, 180); b.roof('deckB2', 4020, 760, 460, 'module');
  // C: reactor spire (relic at the top)
  b.crate('stepC', 4750, 880, 110); b.tower(4900, [860, 750, 640, 530], 340);
  // D: hangar gantries against the current
  b.crate('hangarD1', 5900, 890, 110); b.crate('hangarD2', 6010, 820, 110);
  b.roof('hangarD', 6160, 760, 520, 'module'); b.ledge(6840, 700, 200); b.ledge(7140, 640, 200); b.roof('gantryD', 7440, 700, 520, 'module');
  // E: command deck
  b.crate('cmdE1', 8300, 890, 110); b.crate('cmdE2', 8410, 830, 110); b.roof('cmdE', 8560, 760, 560, 'module');
  b.ledge(9250, 700, 180); b.roof('bridgeE', 9500, 640, 600, 'module');
  b.wallEnd(W - 40);

  [['CARGO', 800], ['DECK B', 2500], ['REACTOR', 4600], ['HANGAR', 5800], ['COMMAND', 8200]].forEach(([t, x]) => b.add('sign', x as number, GROUND_Y - 330, 150, 40, t as string));
  for (let x = 300; x < W - 200; x += 640 + Math.floor(rnd() * 300)) b.add('console', x, GROUND_Y - 60, 80, 60);
  for (const x of [1200, 3300, 5200, 6500, 9000]) b.add('holo', x, GROUND_Y - 50, 40, 0);
  for (const x of [500, 2600, 4700, 6000, 8100, 10200]) b.add('beacon', x, GROUND_Y, 20, 150);
  for (const x of [1800, 5000, 8000, 10000]) b.add('cable', x, 0, 70, 260 + Math.floor(rnd() * 120), undefined, 'front');
  b.add('conveyor', 2650, GROUND_Y, 1830, 1); b.add('conveyor', 6160, GROUND_Y, 1820, -1);
  b.door(60, 'BACK'); b.door(W - 230, 'COMMAND');

  return {
    id: 'helios_city', name: 'Helios Ring', width: W, height: 1080, groundY: GROUND_Y, theme: 'helios', music: 'city',
    solids: b.solids, oneWays: b.oneWays, decor: b.decor, secrets: [],
    spawns: [
      sp('hr1', 'jet_hunter', 900, undefined, 200), sp('hr2', 'security_droid', 1500, 700, 80), sp('hr3', 'riot_mech', 1750, undefined, 100),
      sp('hr4', 'security_droid', 2150, 760, 60), sp('hr5', 'jet_hunter', 2500, undefined, 220), sp('hr6', 'siege_walker', 2800, undefined, 80),
      sp('hr7', 'security_droid', 3300, 700, 60), sp('hr8', 'riot_mech', 3600, undefined, 100), sp('hr9', 'jet_hunter', 3900, undefined, 230),
      sp('hr10', 'security_droid', 4200, 760, 70), sp('hr11', 'siege_walker', 4500, undefined, 80), sp('hr12', 'riot_mech', 5200, undefined, 100),
      sp('hr13', 'security_droid', 5300, 530, 60), sp('hr14', 'jet_hunter', 5700, undefined, 240), sp('hr15', 'security_droid', 6300, 760, 80),
      sp('hr16', 'siege_walker', 6500, undefined, 80), sp('hr17', 'riot_mech', 6900, undefined, 100), sp('hr18', 'security_droid', 7200, 640, 60),
      sp('hr19', 'jet_hunter', 7600, 700, 100), sp('hr20', 'siege_walker', 7900, undefined, 70), sp('hr21', 'riot_mech', 8400, undefined, 100),
      sp('hr22', 'security_droid', 8800, 760, 80), sp('hr23', 'jet_hunter', 9100, undefined, 240), sp('hr24', 'security_droid', 9700, 640, 80),
      sp('hr25', 'siege_walker', 9900, undefined, 70), sp('hr26', 'riot_mech', 10150, undefined, 90), sp('hr27', 'jet_hunter', 10400, undefined, 200),
    ],
    checkpoints: [
      { id: 'hr_dock', name: 'Docking Lamp', x: 640 }, { id: 'hr_deck', name: 'Deck B Lamp', x: 2550 },
      { id: 'hr_reactor', name: 'Reactor Lamp', x: 4650 }, { id: 'hr_hangar', name: 'Hangar Lamp', x: 6100 },
      { id: 'hr_command', name: 'Command Lamp', x: 8250 },
    ],
    pickups: [
      { id: 'chest_bay', item: 'health_tonic', qty: 1, x: 1700, y: 668, chest: true },
      { id: 'chest_deck', item: 'energy_cell', qty: 1, x: 3580, y: 608, chest: true },
      { id: 'reactor_cell', item: 'reactor_cell', qty: 1, x: 5340, y: 398 },
      { id: 'chest_hangar', item: 'health_tonic', qty: 2, x: 6500, y: 728, chest: true },
      { id: 'chest_gantry', item: 'energy_cell', qty: 2, x: 7800, y: 668, chest: true },
      { id: 'chest_bridge', item: 'health_tonic', qty: 2, x: 9900, y: 608, chest: true },
    ],
    zones: [],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    drift: [{ x: 2650, w: 1830, vx: 120 }, { x: 6160, w: 1820, vx: -110 }],
    enemyScale: { hp: 2.9, atk: 2.1 },
  };
}
