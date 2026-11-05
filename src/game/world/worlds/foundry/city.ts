import type { RegionDef, SpawnDef } from '@/game/config/regions';
import { GROUND_Y, RegionBuilder, mulberry32 } from '../../kit';

/** Ember Foundry layout. Solid/ledge/spawn/pickup/checkpoint ids are the save-compatible originals. */
export function buildEmberFoundry(): RegionDef {
  const W = 11200;
  const b = new RegionBuilder(W, 'forge_wall');
  const rnd = mulberry32(777);

  // --- Layer 0: the fortress itself, a ragged wall of bastions and smokestacks with volcanic gaps between
  for (let x = -60; x < W; ) {
    const r = rnd();
    if (r < 0.4) { const w = 150 + Math.floor(rnd() * 120), h = 300 + Math.floor(rnd() * 320); b.add('bastion', x, GROUND_Y - h, w, h); x += w + 10 + rnd() * 60; }
    else if (r < 0.62) { const w = 54 + Math.floor(rnd() * 20), h = 330 + Math.floor(rnd() * 240); b.add('smokestack', x + w / 2, GROUND_Y, w, h); x += w + 30 + rnd() * 80; }
    else x += 180 + rnd() * 300;
  }
  // --- Layer 1: machinery in the gaps: gears, pistons, lava spouts, furnaces, ladle rails
  for (let x = 700; x < W - 600; x += 900 + Math.floor(rnd() * 400)) b.add('gear', x, GROUND_Y - 330 - rnd() * 80, 150 + Math.floor(rnd() * 60), 60);
  for (let x = 1500; x < W - 600; x += 1200 + Math.floor(rnd() * 500)) b.add('piston', x, GROUND_Y - 240, 44, 220);
  for (const x of [1900, 4600, 7700, 10200]) b.add('lavafall', x, 120, 52, 0);
  for (const x of [3400, 6900, 9400]) b.add('rail', x, 470, 1000, 10);
  for (let x = 560; x < W - 400; x += 950 + Math.floor(rnd() * 400)) b.add('furnace', x, GROUND_Y - 190, 150, 190);

  // --- Layer 2: gameplay platforms and their bodies
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
  b.wallEnd(W - 40);

  // --- Layer 3: ground-level dressing
  for (const x of [900, 2600, 4400, 6300, 8300, 10300]) b.add('brazier', x, GROUND_Y, 16, 150);
  [['FORGE', 700], ['SMELT', 3000], ['KILN', 5600], ['SLAG', 7700], ['ANVIL', 9400]].forEach(([t, x]) =>
    b.add('plate', x as number, GROUND_Y - 300, 150, 36, t as string));
  b.add('pipes', 2000, 700, 900, 80); b.add('pipes', 7500, 700, 900, 80);
  b.add('banner', 10500, 700, 60, 200);
  for (const x of [2100, 5000, 7900, 9800]) b.add('crucible', x, GROUND_Y - 42, 90, 42);
  b.door(60, 'BACK'); b.door(W - 230, 'EMPRESS');
  // --- Layer 4: foreground chains
  for (const x of [1700, 4300, 7200, 9000]) b.add('chain', x, 0, 0, 260, undefined, 'front');

  const sp = (id: string, kind: SpawnDef['kind'], x: number, y?: number, patrol = 150): SpawnDef => ({ id, kind, x, y, patrol });
  return {
    id: 'foundry', name: 'Ember Foundry', width: W, height: 1080, groundY: GROUND_Y, theme: 'foundry', music: 'city',
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
    ],
    spawnPoints: { from_west: { x: 300, y: GROUND_Y }, from_arena: { x: W - 340, y: GROUND_Y } },
    enemyScale: { hp: 1.7, atk: 1.45 },
  };
}
