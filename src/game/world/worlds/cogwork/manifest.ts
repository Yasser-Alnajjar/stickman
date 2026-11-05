import type { WorldPackMeta } from '../../types';
import { atk, enemy } from '../enemy-kit';

/** Cogwork Depths (world 9): manifest (data only). */
export const cogworkManifest: WorldPackMeta = {
  id: 'cogwork_depths',
  name: 'Cogwork Depths',
  description: 'A city of brass and steam built inside a cavern. Ride the belts, climb the boiler spire and reach the great escapement.',
  tagline: 'Every gear has a place. Yours is in the way.',
  doorLabel: 'COGWORK',
  cityRegion: 'cogwork_city',
  arenaRegion: 'horol_arena',
  cityTheme: 'cogwork',
  arenaTheme: 'arena_horol',

  enemies: {
    clockwork_soldier: enemy('clockwork_soldier', 'Clockwork Soldier', 'guard', {
      maxHealth: 360, attack: 21, xp: 190, gold: 28, guard: 0.88, chaseSpeed: 120,
      attacks: [{ id: 'cw_soldier_strike', weight: 3 }, { id: 'cw_soldier_spin', weight: 2 }],
      style: { color: 0xc8923a, lineWidth: 7, scale: 1.2, accessory: 'clockwork_plate', accent: 0xffb347, headRadius: 10 },
    }),
    steam_gunner: enemy('steam_gunner', 'Steam Gunner', 'shooter', {
      maxHealth: 120, attack: 20, xp: 160, gold: 24, attackCooldown: 1700,
      attacks: [{ id: 'cw_gunner_blast', weight: 1 }],
      ranged: { attackId: 'cw_gunner_blast', keepAway: 340, range: 720, speed: 520, color: 0xe9e4d6 },
      style: { color: 0x9a6a3a, lineWidth: 4.8, scale: 1.06, accessory: 'steam_pack', accent: 0xe9e4d6, headRadius: 9 },
    }),
    cog_brute: enemy('cog_brute', 'Cog Brute', 'brute', {
      maxHealth: 560, attack: 24, xp: 210, gold: 32,
      attacks: [{ id: 'cw_brute_crush', weight: 2 }, { id: 'cw_brute_hammer', weight: 2 }],
      style: { color: 0x7a5a3a, lineWidth: 13, scale: 1.52, accessory: 'piston_arm', accent: 0xffb347, headRadius: 10 },
    }),
    spring_runner: enemy('spring_runner', 'Spring Assassin', 'assassin', {
      maxHealth: 150, attack: 21, xp: 172, gold: 25, chaseSpeed: 350, dodgeChance: 0.55,
      attacks: [{ id: 'cw_spring_slice', weight: 3 }, { id: 'cw_spring_bound', weight: 2, minRange: 170 }],
      style: { color: 0xd9b46a, lineWidth: 3.6, scale: 1.02, accessory: 'spring_legs', accent: 0xff6a2a, headRadius: 9 },
    }),
  },
  enemyAttacks: {
    cw_soldier_strike: atk('cw_soldier_strike', 'Hammer Strike', { damage: 28, hitbox: { w: 108, h: 100, ox: 62, oy: -14 }, startup: 580, active: 120, recovery: 640, knockback: { x: 580, y: -260 }, hitStun: 520, hitStop: 100, shake: 0.007, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
    cw_soldier_spin: atk('cw_soldier_spin', 'Gear Spin', { damage: 20, hitbox: { w: 130, h: 70, ox: 74, oy: -8 }, startup: 440, active: 110, recovery: 520, knockback: { x: 440, y: -120 }, anim: 'punch2', sfx: 'heavy', telegraph: true, lunge: 220 }),
    cw_gunner_blast: atk('cw_gunner_blast', 'Steam Blast', { damage: 20, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 }, startup: 440, active: 60, recovery: 240, knockback: { x: 260, y: -80 }, telegraph: true }),
    cw_brute_crush: atk('cw_brute_crush', 'Piston Crush', { damage: 40, hitbox: { w: 170, h: 112, ox: 84, oy: -18 }, startup: 800, active: 150, recovery: 840, knockback: { x: 680, y: -400 }, hitStun: 580, hitStop: 120, shake: 0.013, anim: 'slam', sfx: 'slam', telegraph: true, superArmor: true }),
    cw_brute_hammer: atk('cw_brute_hammer', 'Steam Hammer', { damage: 28, hitbox: { w: 146, h: 76, ox: 78, oy: -10 }, startup: 500, active: 110, recovery: 600, knockback: { x: 500, y: -160 }, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
    cw_spring_slice: atk('cw_spring_slice', 'Spring Slice', { damage: 13, hitbox: { w: 88, h: 52, ox: 56, oy: -6 }, startup: 160, active: 80, recovery: 90, knockback: { x: 160, y: -40 }, hitStun: 220, chain: 'cw_spring_slice2' }),
    cw_spring_slice2: atk('cw_spring_slice2', 'Coil Cut', { damage: 20, hitbox: { w: 98, h: 58, ox: 60, oy: -4 }, startup: 180, active: 100, recovery: 500, knockback: { x: 380, y: -150 }, hitStun: 360, anim: 'kick', sfx: 'kick', telegraph: true }),
    cw_spring_bound: atk('cw_spring_bound', 'Spring Bound', { damage: 24, hitbox: { w: 118, h: 60, ox: 68, oy: -8 }, startup: 330, active: 150, recovery: 660, knockback: { x: 440, y: -160 }, hitStun: 400, anim: 'dash_attack', sfx: 'heavy', lunge: 900, telegraph: true }),
  },

  boss: {
    id: 'horol', name: 'Clockmaster Horol', subtitle: 'Regent of the Great Escapement', prefix: 'horol',
    maxHealth: 3050, attack: 23, defense: 11, width: 60, height: 174, walkSpeed: 120, xp: 4800, gold: 1450,
    drop: 'horol_mainspring', phaseThresholds: [0.68, 0.34],
    patterns: [
      { id: 'combo', weight: 2 }, { id: 'piston_crush', weight: 3 }, { id: 'gear_saw', weight: 3 }, { id: 'steam_vents', weight: 3 },
      { id: 'time_bomb', weight: 2, from: 2 }, { id: 'charge', weight: 1, from: 2 }, { id: 'wind_up', weight: 2, from: 3 },
    ],
    summon: { phase: 3, kinds: ['clockwork_soldier', 'spring_runner'] },
    tempo: [1.02, 0.86, 0.7],
    style: { color: 0xd9a24a, lineWidth: 11, scale: 1.94, accessory: 'horol_regent', accent: 0xff6a2a, headRadius: 11 },
    eye: 0xffb347,
    aura: { color: 0xffb347, r: 150 },
  },
  bossAttacks: {
    scale: 2.5,
    extras: {
      piston: { damage: 26, knockback: { x: 300, y: -540 }, hitStun: 640 },
      saw: { damage: 24, knockback: { x: 560, y: -300 }, hitStun: 560 },
      steam: { damage: 18, knockback: { x: 300, y: -420 }, hitStun: 440 },
      bomb: { damage: 10, knockback: { x: 220, y: -220 }, hitStun: 300 },
      blast: { damage: 38, knockback: { x: 600, y: -480 }, hitStun: 660 },
    },
  },

  items: [
    { id: 'master_cog', name: 'Master Cog', description: 'The cog that all the others in the district answer to. It is heavy, warm, and oddly alive.', icon: '⚙️', usable: false },
    { id: 'horol_mainspring', name: "Horol's Mainspring", description: 'The wound heart of the Clockmaster. The city holds its breath as the ticking slows.', icon: '🕰️', usable: false },
  ],
  quests: [
    {
      id: 'cogwork_purge', title: 'Stop the Line', world: 'cogwork_depths',
      summary: 'Shut down the clockwork guards and steam gunners on the factory floors.',
      objectives: [{ type: 'kill', target: 'steam_gunner', count: 5, label: 'Destroy Steam Gunners' }, { type: 'kill', target: 'clockwork_soldier', count: 3, label: 'Wreck Clockwork Soldiers' }],
      reward: { xp: 3400, gold: 380, items: { health_tonic: 4, energy_cell: 3 } },
      hint: 'Gunners fire slow clouds from range: sidestep or block. Soldiers keep their guard until a heavy blow breaks it.',
    },
    {
      id: 'master_cog', title: 'The Master Cog', world: 'cogwork_depths',
      summary: 'Climb the boiler spire and take the cog from its crown.',
      objectives: [{ type: 'collect', target: 'master_cog', count: 1, label: 'Take the Master Cog' }],
      reward: { xp: 2800, items: { energy_cell: 4 } },
      hint: 'The spire rises past the gear hall. The belts push you forward: use them to build speed, and jump on the beat.',
    },
    {
      id: 'defeat_horol', title: 'Stop the Clock', world: 'cogwork_depths',
      summary: 'Defeat Clockmaster Horol in the Great Escapement.',
      objectives: [{ type: 'boss', target: 'horol', count: 1, label: 'Defeat Clockmaster Horol' }],
      reward: { xp: 4800, gold: 1450 },
      hint: 'Pistons fall in rhythm: stand in the gaps. Jump the saws, and never stand still near a ticking bomb. Rest at a lamp first.',
    },
  ],
  accessories: {
    clockwork_plate: {
      parts: [
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -11, 22, 12] },
        { t: 'circle', at: 'head', c: 'accent', p: [0, -17, 5] },
        { t: 'circle', at: 'sho', c: 'light', p: [-9, 2, 9] },
        { t: 'circle', at: 'sho', c: 'accent', a: 0.9, p: [0, 12, 6] },
        { t: 'rect', at: 'sho', c: 'dark', p: [11, -8, 9, 44] },
        { t: 'circle', at: 'sho', c: 'accent', p: [15, 14, 4] },
      ],
    },
    steam_pack: {
      parts: [
        { t: 'rect', at: 'sho', c: 'dark', layer: 'back', p: [-16, -6, 12, 28] },
        { t: 'tri', at: 'sho', c: 'accent', a: 0.7, layer: 'back', p: [-14, -6, -6, -6, -12, -26], sway: 4 },
        { t: 'rect', at: 'head', c: 'dark', p: [-10, -9, 20, 8] },
        { t: 'circle', at: 'head', c: 'accent', p: [4, -4, 3] },
        { t: 'rect', at: 'handA', c: 'dark', p: [0, -3, 24, 7] },
      ],
    },
    piston_arm: {
      torsoMul: 1.55,
      parts: [
        { t: 'rect', at: 'sho', c: 'dark', p: [-22, -4, 44, 18] },
        { t: 'circle', at: 'sho', c: 'light', p: [-20, 2, 10] },
        { t: 'circle', at: 'sho', c: 'accent', p: [22, 2, 10] },
        { t: 'rect', at: 'handA', c: 'accent', p: [-6, -12, 18, 24] },
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -11, 22, 7] },
        { t: 'rect', at: 'hip', c: 'accent', p: [-14, -3, 28, 5] },
      ],
    },
    spring_legs: {
      parts: [
        { t: 'line', at: 'footF', c: 'accent', p: [0, -22, -5, -12], w: 3 },
        { t: 'line', at: 'footF', c: 'accent', p: [-5, -12, 4, -4], w: 3 },
        { t: 'line', at: 'footG', c: 'accent', p: [0, -22, -5, -12], w: 3 },
        { t: 'rect', at: 'head', c: 'accent', p: [-10, -9, 20, 4] },
        { t: 'tri', at: 'head', c: 'dark', layer: 'back', p: [-4, -6, -4, 0, -24, 8], sway: 6 },
      ],
    },
    horol_regent: {
      eye: 0xffb347,
      parts: [
        { t: 'circle', at: 'sho', c: 0xffb347, a: 0.2, layer: 'back', p: [0, 0, 34] },
        { t: 'circle', at: 'sho', c: 0x8a5e22, layer: 'back', p: [-18, -8, 20] },
        { t: 'circle', at: 'sho', c: 0xc8923a, layer: 'back', p: [-18, -8, 14] },
        { t: 'circle', at: 'sho', c: 0x8a5e22, layer: 'back', p: [-34, 18, 14] },
        { t: 'rect', at: 'head', c: 0x3a2a1e, p: [-12, -16, 24, 9] },
        { t: 'rect', at: 'head', c: 0xc8923a, p: [-14, -9, 28, 4] },
        { t: 'circle', at: 'head', c: 0xf0e6c8, p: [0, -22, 8] },
        { t: 'rect', at: 'head', c: 0x120a08, p: [-1, -26, 2, 5] },
        { t: 'circle', at: 'sho', c: 0xc8923a, p: [-12, 4, 10] },
        { t: 'circle', at: 'sho', c: 0xc8923a, p: [12, 4, 10] },
        { t: 'circle', at: 'sho', c: 0xff6a2a, a: 0.95, p: [0, 14, 6] },
        { t: 'line', at: 'handB', c: 0xc8923a, p: [0, -56, 0, 30], w: 4 },
        { t: 'circle', at: 'handB', c: 0xffb347, p: [0, -58, 9] },
      ],
    },
  },

  text: {
    'Cogwork Depths': 'أعماق التروس',
    'The Great Escapement': 'المنظّم العظيم',
    'A city of brass and steam built inside a cavern. Ride the belts, climb the boiler spire and reach the great escapement.': 'مدينة من النحاس والبخار بُنيت داخل كهف. اركب السيور واصعد برج المرجل وبلغ المنظّم العظيم.',
    'Every gear has a place. Yours is in the way.': 'لكل ترس مكانه. ومكانك في الطريق.',
    'COGWORK': 'التروس', 'FOUNDRY': 'المسبك', 'GEAR HALL': 'قاعة التروس', 'BOILER': 'المرجل', 'BELT WORKS': 'ورش السيور', 'CLOCKTOWER': 'برج الساعة', 'ESCAPEMENT': 'المنظّم', 'THE HOUR STRIKES': 'الساعة تدق', 'WINDING UP': 'يشدّ الزنبرك',
    'Depths Gate Lamp': 'مصباح بوابة الأعماق', 'Gear Hall Lamp': 'مصباح قاعة التروس', 'Boiler Lamp': 'مصباح المرجل', 'Belt Works Lamp': 'مصباح ورش السيور', 'Clocktower Lamp': 'مصباح برج الساعة', 'Escapement Lamp': 'مصباح المنظّم',
    'Clockwork Soldier': 'جندي ساعاتي', 'Steam Gunner': 'رامي البخار', 'Cog Brute': 'وحش التروس', 'Spring Assassin': 'قاتل الزنبرك',
    'Clockmaster Horol': 'سيّد الساعات هورول', 'Regent of the Great Escapement': 'وصيّ المنظّم العظيم',
    'Master Cog': 'الترس الأعظم', 'The cog that all the others in the district answer to. It is heavy, warm, and oddly alive.': 'الترس الذي تستجيب له كل تروس الحي. ثقيل ودافئ وحيّ على نحو غريب.',
    "Horol's Mainspring": 'زنبرك هورول الرئيسي', 'The wound heart of the Clockmaster. The city holds its breath as the ticking slows.': 'القلب الملتف لسيّد الساعات. المدينة تحبس أنفاسها بينما يتباطأ الدقّ.',
    'Stop the Line': 'أوقف خط الإنتاج', 'Shut down the clockwork guards and steam gunners on the factory floors.': 'أوقف الحرّاس الساعاتيين ورماة البخار في أرضيات المصنع.',
    'Destroy Steam Gunners': 'دمّر رماة البخار', 'Wreck Clockwork Soldiers': 'حطّم الجنود الساعاتيين',
    'Gunners fire slow clouds from range: sidestep or block. Soldiers keep their guard until a heavy blow breaks it.': 'الرماة يطلقون سحبًا بطيئة من بعيد: تفادَ أو صُدّ. الجنود يحافظون على حراستهم حتى تكسرها ضربة قوية.',
    'The Master Cog': 'الترس الأعظم', 'Climb the boiler spire and take the cog from its crown.': 'اصعد برج المرجل وخذ الترس من قمته.',
    'Take the Master Cog': 'خذ الترس الأعظم', 'The spire rises past the gear hall. The belts push you forward: use them to build speed, and jump on the beat.': 'البرج يعلو بعد قاعة التروس. السيور تدفعك للأمام: استفد منها لتكتسب سرعة، واقفز مع الإيقاع.',
    'Stop the Clock': 'أوقف الساعة', 'Defeat Clockmaster Horol in the Great Escapement.': 'اهزم سيّد الساعات هورول في المنظّم العظيم.',
    'Defeat Clockmaster Horol': 'اهزم سيّد الساعات هورول', 'Pistons fall in rhythm: stand in the gaps. Jump the saws, and never stand still near a ticking bomb. Rest at a lamp first.': 'المكابس تهوي بإيقاع: قف في الفجوات. اقفز فوق المناشير ولا تقف ساكنًا قرب قنبلة تدق. استرح عند مصباح أولًا.',
  },
  load: () => import('./content').then((m) => m.content),
};
