import type { WorldPackMeta } from '../../types';
import { atk, enemy } from '../enemy-kit';

/** Dune Kingdom (world 6): manifest (data only). */
export const duneManifest: WorldPackMeta = {
  id: 'dune_kingdom',
  name: 'Dune Kingdom',
  description: 'A sun-scorched desert capital with a kingdom of tombs beneath it. Cross the bazaar roofs or brave the low burial road to the buried throne.',
  tagline: 'Two roads cross the sands: the rooftops, and the dark below.',
  doorLabel: 'DUNES',
  cityRegion: 'dune_city',
  arenaRegion: 'khamsin_arena',
  cityTheme: 'dune',
  arenaTheme: 'arena_khamsin',

  enemies: {
    sand_raider: enemy('sand_raider', 'Sand Raider', 'assassin', {
      maxHealth: 96, attack: 15, xp: 104, gold: 17, dodgeChance: 0.55,
      attacks: [{ id: 'dk_raider_slash', weight: 3 }, { id: 'dk_raider_dive', weight: 2, minRange: 150 }],
      style: { color: 0xd9a35a, lineWidth: 4, scale: 1.02, accessory: 'raider_wrap', accent: 0xb8452a, headRadius: 9 },
    }),
    mummy_warden: enemy('mummy_warden', 'Mummy Warden', 'guard', {
      maxHealth: 230, attack: 16, xp: 118, gold: 19, guard: 0.86,
      attacks: [{ id: 'dk_mummy_smite', weight: 3 }, { id: 'dk_mummy_sweep', weight: 2 }],
      style: { color: 0xe6d9b4, lineWidth: 6.5, scale: 1.18, accessory: 'mummy_bands', accent: 0xf2c84a, headRadius: 10 },
    }),
    bone_archer: enemy('bone_archer', 'Bone Archer', 'shooter', {
      maxHealth: 72, attack: 14, xp: 90, gold: 15, attackCooldown: 1300,
      attacks: [{ id: 'dk_archer_arrow', weight: 1 }],
      ranged: { attackId: 'dk_archer_arrow', keepAway: 320, range: 700, speed: 700, color: 0xf2d27a },
      style: { color: 0xece4cc, lineWidth: 3.6, scale: 1, accessory: 'bone_bow', accent: 0xb8452a, headRadius: 9 },
    }),
    colossus: enemy('colossus', 'Sandstone Colossus', 'brute', {
      maxHealth: 380, attack: 18, xp: 140, gold: 23,
      attacks: [{ id: 'dk_colossus_slam', weight: 2 }, { id: 'dk_colossus_sweep', weight: 2 }],
      style: { color: 0xb98b52, lineWidth: 12, scale: 1.46, accessory: 'colossus_crown', accent: 0x2fb8a6, headRadius: 10 },
    }),
  },
  enemyAttacks: {
    dk_raider_slash: atk('dk_raider_slash', 'Scimitar', { damage: 10, hitbox: { w: 78, h: 46, ox: 52, oy: -8 }, startup: 190, active: 80, recovery: 120, knockback: { x: 150, y: -40 }, hitStun: 210, chain: 'dk_raider_slash2' }),
    dk_raider_slash2: atk('dk_raider_slash2', 'Crescent Cut', { damage: 15, hitbox: { w: 92, h: 56, ox: 58, oy: -4 }, startup: 230, active: 100, recovery: 520, knockback: { x: 340, y: -140 }, hitStun: 330, anim: 'kick', sfx: 'kick', telegraph: true }),
    dk_raider_dive: atk('dk_raider_dive', 'Sand Dive', { damage: 16, hitbox: { w: 104, h: 54, ox: 60, oy: -8 }, startup: 380, active: 140, recovery: 640, knockback: { x: 380, y: -140 }, hitStun: 360, anim: 'dash_attack', sfx: 'heavy', lunge: 720, telegraph: true }),
    dk_mummy_smite: atk('dk_mummy_smite', 'Cursed Smite', { damage: 20, hitbox: { w: 94, h: 96, ox: 58, oy: -14 }, startup: 600, active: 120, recovery: 660, knockback: { x: 540, y: -250 }, hitStun: 500, hitStop: 90, shake: 0.006, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
    dk_mummy_sweep: atk('dk_mummy_sweep', 'Linen Sweep', { damage: 14, hitbox: { w: 124, h: 52, ox: 72, oy: -6 }, startup: 420, active: 100, recovery: 540, knockback: { x: 400, y: -110 }, anim: 'punch2', sfx: 'heavy', telegraph: true, lunge: 150 }),
    dk_archer_arrow: atk('dk_archer_arrow', 'Bone Arrow', { damage: 13, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 }, startup: 420, active: 60, recovery: 220, knockback: { x: 230, y: -60 }, telegraph: true }),
    dk_colossus_slam: atk('dk_colossus_slam', 'Colossus Slam', { damage: 32, hitbox: { w: 150, h: 104, ox: 78, oy: -18 }, startup: 760, active: 150, recovery: 800, knockback: { x: 640, y: -360 }, hitStun: 560, hitStop: 120, shake: 0.011, anim: 'slam', sfx: 'slam', telegraph: true, superArmor: true }),
    dk_colossus_sweep: atk('dk_colossus_sweep', 'Stone Sweep', { damage: 21, hitbox: { w: 134, h: 70, ox: 72, oy: -10 }, startup: 480, active: 110, recovery: 580, knockback: { x: 460, y: -140 }, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
  },

  boss: {
    id: 'khamsin', name: 'Sand Sovereign Khamsin', subtitle: 'Pharaoh of the Buried Throne', prefix: 'khamsin',
    maxHealth: 1900, attack: 17, defense: 8, width: 56, height: 170, walkSpeed: 124, xp: 2400, gold: 780,
    drop: 'sovereign_scarab', phaseThresholds: [0.68, 0.34],
    patterns: [
      { id: 'combo', weight: 2 }, { id: 'sand_tornado', weight: 3 }, { id: 'scarab_swarm', weight: 3 }, { id: 'solar_lance', weight: 2 },
      { id: 'quicksand', weight: 2, from: 2 }, { id: 'sun_rays', weight: 3, from: 2 }, { id: 'leap', weight: 1, from: 3 },
    ],
    summon: { phase: 3, kinds: ['sand_raider', 'bone_archer'] },
    tempo: [1.05, 0.88, 0.72],
    style: { color: 0xf0c868, lineWidth: 10, scale: 1.9, accessory: 'sovereign_nemes', accent: 0x2fb8a6, headRadius: 11 },
    eye: 0x2fb8a6,
    aura: { color: 0xf2c84a, r: 150 },
  },
  bossAttacks: {
    scale: 1.9,
    extras: {
      tornado: { damage: 22, knockback: { x: 520, y: -320 }, hitStun: 560 },
      maw: { damage: 30, knockback: { x: 300, y: -560 }, hitStun: 640 },
      scarab: { damage: 12, knockback: { x: 220, y: -180 }, hitStun: 340 },
      ray: { damage: 24, knockback: { x: 260, y: -380 }, hitStun: 560 },
      strike_lance: { damage: 30, hitbox: { w: 190, h: 70, ox: 120, oy: -6 }, startup: 420, active: 130, recovery: 640, knockback: { x: 700, y: -340 }, hitStun: 560, telegraph: true },
    },
  },

  items: [
    { id: 'golden_scarab', name: 'Golden Scarab', description: 'A palm-sized scarab of solid gold, set with turquoise. Tomb-keepers say it opens the royal road.', icon: '🪲', usable: false },
    { id: 'sovereign_scarab', name: "Sovereign's Scarab", description: 'The beating heart-scarab of Khamsin. The sand is still at last.', icon: '👁️', usable: false },
  ],
  quests: [
    {
      id: 'dune_purge', title: 'Break the Raiders', world: 'dune_kingdom',
      summary: 'Drive the raiders and tomb wardens out of the bazaar and the burial road.',
      objectives: [{ type: 'kill', target: 'sand_raider', count: 5, label: 'Defeat Sand Raiders' }, { type: 'kill', target: 'mummy_warden', count: 3, label: 'Break Mummy Wardens' }],
      reward: { xp: 1700, gold: 210, items: { health_tonic: 3, energy_cell: 2 } },
      hint: 'Raiders dodge your first swing: bait it, then strike. Wardens only fall to heavy blows once their guard is broken.',
    },
    {
      id: 'golden_scarab', title: 'The Golden Scarab', world: 'dune_kingdom',
      summary: 'Climb the obelisk tower and take the scarab from its crown.',
      objectives: [{ type: 'collect', target: 'golden_scarab', count: 1, label: 'Take the Golden Scarab' }],
      reward: { xp: 1400, items: { energy_cell: 3 } },
      hint: 'The tower stands beyond the arches, before the tombs. Hold Space for full-height jumps.',
    },
    {
      id: 'defeat_khamsin', title: 'Calm the Sands', world: 'dune_kingdom',
      summary: 'Defeat Sand Sovereign Khamsin in the Buried Throne.',
      objectives: [{ type: 'boss', target: 'khamsin', count: 1, label: 'Defeat Sand Sovereign Khamsin' }],
      reward: { xp: 2400, gold: 800 },
      hint: 'Jump the sand-devils. When the floor drags you in, run or jump away before the maw closes. Rest at a lamp first.',
    },
  ],
  accessories: {
    raider_wrap: {
      parts: [
        { t: 'rect', at: 'head', c: 'accent', p: [-10, -9, 20, 6] },
        { t: 'tri', at: 'head', c: 'accent', layer: 'back', p: [-6, -8, -6, -2, -26, 6], sway: 6 },
        { t: 'rect', at: 'handA', c: 0xe6ecff, p: [0, -3, 30, 3] },
        { t: 'line', at: 'handA', c: 0xe6ecff, p: [26, -3, 40, -14], w: 3 },
      ],
    },
    mummy_bands: {
      parts: [
        { t: 'rect', at: 'head', c: 'light', p: [-9, -10, 18, 5] },
        { t: 'rect', at: 'head', c: 'light', p: [-9, -3, 18, 3] },
        { t: 'rect', at: 'sho', c: 'light', p: [-8, 2, 16, 4] },
        { t: 'rect', at: 'sho', c: 'light', p: [-8, 12, 16, 4] },
        { t: 'tri', at: 'hip', c: 'light', layer: 'back', p: [-2, -2, 4, -2, -20, 16], sway: 5 },
        { t: 'rect', at: 'sho', c: 'accent', p: [10, -6, 7, 36] },
      ],
    },
    bone_bow: {
      parts: [
        { t: 'line', at: 'handA', c: 0xece4cc, p: [8, -26, 14, 0], w: 3 },
        { t: 'line', at: 'handA', c: 0xece4cc, p: [14, 0, 8, 26], w: 3 },
        { t: 'line', at: 'handA', c: 0xb8452a, p: [8, -26, 8, 26], w: 1 },
        { t: 'rect', at: 'head', c: 'dark', p: [-9, -2, 18, 5] },
        { t: 'tri', at: 'head', c: 'accent', p: [-3, -10, 3, -10, 0, -20] },
      ],
    },
    colossus_crown: {
      torsoMul: 1.5,
      parts: [
        { t: 'rect', at: 'sho', c: 'dark', p: [-22, -4, 44, 16] },
        { t: 'circle', at: 'sho', c: 'light', p: [-20, 2, 10] },
        { t: 'circle', at: 'sho', c: 'light', p: [20, 2, 10] },
        { t: 'tri', at: 'head', c: 'accent', p: [-12, -9, -4, -9, -9, -26] },
        { t: 'tri', at: 'head', c: 'accent', p: [-4, -9, 4, -9, 0, -32] },
        { t: 'tri', at: 'head', c: 'accent', p: [4, -9, 12, -9, 9, -26] },
        { t: 'rect', at: 'hip', c: 'accent', p: [-14, -4, 28, 5] },
      ],
    },
    sovereign_nemes: {
      eye: 0x2fb8a6,
      parts: [
        { t: 'circle', at: 'head', c: 0xf2c84a, a: 0.28, layer: 'back', p: [0, -2, 20] },
        { t: 'poly', at: 'head', c: 0x2fb8a6, layer: 'back', p: [-12, -6, -26, 10, -22, 38, -8, 12], sway: 4 },
        { t: 'poly', at: 'head', c: 0xf2c84a, layer: 'back', p: [12, -6, 26, 10, 22, 38, 8, 12], sway: 4 },
        { t: 'rect', at: 'head', c: 0xf2c84a, p: [-12, -10, 24, 6] },
        { t: 'tri', at: 'head', c: 0x2fb8a6, p: [-4, -10, 4, -10, 0, -28] },
        { t: 'rect', at: 'sho', c: 0xf2c84a, p: [-14, 0, 28, 6] },
        { t: 'circle', at: 'sho', c: 0x2fb8a6, p: [0, 12, 5] },
        { t: 'tri', at: 'hip', c: 0x2fb8a6, layer: 'back', p: [-8, 0, 8, 0, 0, 30], sway: 6 },
        { t: 'line', at: 'handB', c: 0xf2c84a, p: [0, -50, 0, 30], w: 4 },
        { t: 'circle', at: 'handB', c: 0x2fb8a6, p: [0, -52, 6] },
      ],
    },
  },

  text: {
    'Dune Kingdom': 'مملكة الكثبان',
    'Buried Throne': 'العرش المدفون',
    'A sun-scorched desert capital with a kingdom of tombs beneath it. Cross the bazaar roofs or brave the low burial road to the buried throne.': 'عاصمة صحراوية تلفحها الشمس وتحتها مملكة من المقابر. اعبر أسطح البازار أو اجتز طريق الدفن المنخفض إلى العرش المدفون.',
    'Two roads cross the sands: the rooftops, and the dark below.': 'طريقان يعبران الرمال: الأسطح، والظلام تحتها.',
    'DUNES': 'الكثبان', 'BAZAAR': 'البازار', 'ARCHES': 'الأقواس', 'TOMBS': 'المقابر', 'PALACE': 'القصر', 'THRONE': 'العرش', 'THE SANDS RISE': 'الرمال تنهض', 'QUICKSAND!': 'رمال متحركة!',
    'Caravan Gate Lamp': 'مصباح بوابة القوافل', 'Bazaar Lamp': 'مصباح البازار', 'Obelisk Lamp': 'مصباح المسلّة', 'Tomb Lamp': 'مصباح المقبرة', 'Palace Lamp': 'مصباح القصر', 'Buried Throne Lamp': 'مصباح العرش المدفون',
    'Sand Raider': 'غازي الرمال', 'Mummy Warden': 'حارس المومياء', 'Bone Archer': 'رامي العظام', 'Sandstone Colossus': 'عملاق الحجر الرملي',
    'Sand Sovereign Khamsin': 'سلطان الرمال خماسين', 'Pharaoh of the Buried Throne': 'فرعون العرش المدفون',
    'Golden Scarab': 'الجعران الذهبي', 'A palm-sized scarab of solid gold, set with turquoise. Tomb-keepers say it opens the royal road.': 'جعران من الذهب الخالص بحجم الكف ومرصّع بالفيروز. يقول حرّاس المقابر إنه يفتح الطريق الملكي.',
    "Sovereign's Scarab": 'جعران السلطان', 'The beating heart-scarab of Khamsin. The sand is still at last.': 'جعران القلب النابض لخماسين. سكنت الرمال أخيرًا.',
    'Break the Raiders': 'حطّم الغزاة', 'Drive the raiders and tomb wardens out of the bazaar and the burial road.': 'اطرد الغزاة وحرّاس المقابر من البازار وطريق الدفن.',
    'Defeat Sand Raiders': 'اهزم غزاة الرمال', 'Break Mummy Wardens': 'حطّم حرّاس المومياء',
    'Raiders dodge your first swing: bait it, then strike. Wardens only fall to heavy blows once their guard is broken.': 'الغزاة يراوغون ضربتك الأولى: استدرجهم ثم اضرب. الحرّاس لا يسقطون إلا بالضربات القوية بعد كسر حراستهم.',
    'The Golden Scarab': 'الجعران الذهبي', 'Climb the obelisk tower and take the scarab from its crown.': 'اصعد برج المسلّة وخذ الجعران من قمته.',
    'Take the Golden Scarab': 'خذ الجعران الذهبي', 'The tower stands beyond the arches, before the tombs. Hold Space for full-height jumps.': 'البرج خلف الأقواس وقبل المقابر. اضغط Space مطولًا لقفزات كاملة.',
    'Calm the Sands': 'اهدئ الرمال', 'Defeat Sand Sovereign Khamsin in the Buried Throne.': 'اهزم سلطان الرمال خماسين في العرش المدفون.',
    'Defeat Sand Sovereign Khamsin': 'اهزم سلطان الرمال خماسين', 'Jump the sand-devils. When the floor drags you in, run or jump away before the maw closes. Rest at a lamp first.': 'اقفز فوق أعاصير الرمل. حين تسحبك الأرض، اركض أو اقفز بعيدًا قبل أن ينطبق الفك. استرح عند مصباح أولًا.',
  },
  load: () => import('./content').then((m) => m.content),
};
