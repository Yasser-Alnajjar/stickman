import type { WorldPackMeta } from '../../types';
import { WORLD_WEAPONS } from '@/game/weapons/catalog/worlds';
import { atk, enemy } from '../enemy-kit';

/** Helios Ring (world 7): manifest (data only). */
export const heliosManifest: WorldPackMeta = {
  id: 'helios_ring',
  name: 'Helios Ring',
  description: 'A derelict orbital station circling a gas giant. Ride its travelators, climb the reactor spire and break into the dome.',
  tagline: 'Gravity is a suggestion. Security is not.',
  doorLabel: 'HELIOS',
  cityRegion: 'helios_city',
  arenaRegion: 'aegis_arena',
  cityTheme: 'helios',
  arenaTheme: 'arena_aegis',

  enemies: {
    security_droid: enemy('security_droid', 'Security Droid', 'shooter', {
      maxHealth: 96, attack: 15, xp: 120, gold: 18, attackCooldown: 1100, chaseSpeed: 170,
      attacks: [{ id: 'hr_droid_laser', weight: 1 }],
      ranged: { attackId: 'hr_droid_laser', keepAway: 340, range: 720, speed: 820, color: 0xff4fd8 },
      style: { color: 0xa7b6cf, lineWidth: 4.2, scale: 1, accessory: 'droid_head', accent: 0xff4fd8, headRadius: 9 },
    }),
    riot_mech: enemy('riot_mech', 'Riot Mech', 'guard', {
      maxHealth: 280, attack: 17, xp: 138, gold: 21, guard: 0.9,
      attacks: [{ id: 'hr_mech_shock', weight: 3 }, { id: 'hr_mech_ram', weight: 2 }],
      style: { color: 0x7d8cab, lineWidth: 7.5, scale: 1.22, accessory: 'riot_plate', accent: 0x56e0ff, headRadius: 10 },
    }),
    jet_hunter: enemy('jet_hunter', 'Jet Hunter', 'assassin', {
      maxHealth: 118, attack: 16, xp: 126, gold: 19, chaseSpeed: 330, dodgeChance: 0.6,
      attacks: [{ id: 'hr_hunter_blade', weight: 3 }, { id: 'hr_hunter_boost', weight: 2, minRange: 160 }],
      style: { color: 0x56e0ff, lineWidth: 3.8, scale: 1.02, accessory: 'jet_pack', accent: 0xffb347, headRadius: 9 },
    }),
    siege_walker: enemy('siege_walker', 'Siege Walker', 'brute', {
      maxHealth: 470, attack: 20, xp: 166, gold: 26,
      attacks: [{ id: 'hr_walker_stomp', weight: 2 }, { id: 'hr_walker_cannon', weight: 2 }],
      style: { color: 0x5a6a8c, lineWidth: 12.5, scale: 1.5, accessory: 'siege_frame', accent: 0xffb347, headRadius: 10 },
    }),
  },
  enemyAttacks: {
    hr_droid_laser: atk('hr_droid_laser', 'Laser Bolt', { damage: 14, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 }, startup: 380, active: 60, recovery: 200, knockback: { x: 230, y: -60 }, telegraph: true }),
    hr_mech_shock: atk('hr_mech_shock', 'Shock Baton', { damage: 22, hitbox: { w: 98, h: 98, ox: 58, oy: -14 }, startup: 560, active: 120, recovery: 640, knockback: { x: 560, y: -250 }, hitStun: 500, hitStop: 90, shake: 0.006, anim: 'heavy', sfx: 'zap', telegraph: true, superArmor: true }),
    hr_mech_ram: atk('hr_mech_ram', 'Shield Ram', { damage: 16, hitbox: { w: 118, h: 70, ox: 70, oy: -8 }, startup: 440, active: 110, recovery: 540, knockback: { x: 420, y: -110 }, anim: 'punch2', sfx: 'heavy', telegraph: true, lunge: 360 }),
    hr_hunter_blade: atk('hr_hunter_blade', 'Plasma Blade', { damage: 11, hitbox: { w: 86, h: 52, ox: 56, oy: -6 }, startup: 170, active: 80, recovery: 100, knockback: { x: 160, y: -40 }, hitStun: 220, chain: 'hr_hunter_blade2' }),
    hr_hunter_blade2: atk('hr_hunter_blade2', 'Plasma Cross', { damage: 15, hitbox: { w: 96, h: 56, ox: 60, oy: -4 }, startup: 190, active: 100, recovery: 500, knockback: { x: 360, y: -140 }, hitStun: 340, anim: 'kick', sfx: 'kick', telegraph: true }),
    hr_hunter_boost: atk('hr_hunter_boost', 'Boost Strike', { damage: 18, hitbox: { w: 110, h: 56, ox: 62, oy: -8 }, startup: 340, active: 150, recovery: 640, knockback: { x: 400, y: -150 }, hitStun: 380, anim: 'dash_attack', sfx: 'heavy', lunge: 820, telegraph: true }),
    hr_walker_stomp: atk('hr_walker_stomp', 'Piston Stomp', { damage: 36, hitbox: { w: 160, h: 108, ox: 80, oy: -18 }, startup: 780, active: 150, recovery: 820, knockback: { x: 660, y: -380 }, hitStun: 560, hitStop: 120, shake: 0.012, anim: 'slam', sfx: 'slam', telegraph: true, superArmor: true }),
    hr_walker_cannon: atk('hr_walker_cannon', 'Arm Cannon', { damage: 24, hitbox: { w: 150, h: 70, ox: 82, oy: -10 }, startup: 500, active: 120, recovery: 600, knockback: { x: 480, y: -150 }, anim: 'heavy', sfx: 'zap', telegraph: true, superArmor: true }),
  },

  boss: {
    id: 'aegis', name: 'Overseer AEGIS-9', subtitle: 'Warden of the Orbital Reactor', prefix: 'aegis',
    maxHealth: 2250, attack: 19, defense: 9, width: 54, height: 178, walkSpeed: 126, xp: 3000, gold: 940,
    drop: 'aegis_core', phaseThresholds: [0.68, 0.34],
    patterns: [
      { id: 'combo', weight: 2 }, { id: 'laser_grid', weight: 3 }, { id: 'drone_swarm', weight: 2 }, { id: 'blink_strike', weight: 3 },
      { id: 'orbital_strike', weight: 2, from: 2 }, { id: 'gravity_well', weight: 2, from: 2 }, { id: 'volley', weight: 2, from: 3 },
    ],
    summon: { phase: 3, kinds: ['security_droid', 'jet_hunter'] },
    tempo: [1.02, 0.86, 0.7],
    style: { color: 0xc4d0e6, lineWidth: 9.5, scale: 1.9, accessory: 'aegis_frame', accent: 0xff4fd8, headRadius: 11 },
    eye: 0xff4fd8,
    aura: { color: 0x56e0ff, r: 150 },
    volley: { speed: 560, w: 34, h: 12, color: 0xff4fd8, heights: [30, 120], aim: false, rounds: [2, 3, 4], fan: [1, 1, 3] },
  },
  bossAttacks: {
    scale: 2.1,
    extras: {
      laser: { damage: 22, knockback: { x: 420, y: -240 }, hitStun: 480 },
      singularity: { damage: 14, knockback: { x: 300, y: -200 }, hitStun: 360 },
      blast: { damage: 34, knockback: { x: 700, y: -420 }, hitStun: 640 },
      drone: { damage: 14, knockback: { x: 260, y: -200 }, hitStun: 360 },
      strike_orbital: { damage: 28, knockback: { x: 300, y: -440 }, hitStun: 600 },
      volley: { damage: 18, knockback: { x: 380, y: -200 } },
      strike_slash: { damage: 22, hitbox: { w: 180, h: 80, ox: 110, oy: -6 }, startup: 300, active: 110, recovery: 160, knockback: { x: 500, y: -240 }, hitStun: 500, telegraph: true, chain: 'aegis_strike_slash2' },
      strike_slash2: { damage: 26, hitbox: { w: 190, h: 90, ox: 116, oy: -6 }, startup: 260, active: 120, recovery: 620, knockback: { x: 640, y: -320 }, hitStun: 580, telegraph: true },
    },
  },

  items: [
    { id: 'reactor_cell', name: 'Reactor Cell', description: 'A fuel cell from the station reactor spire. It hums softly, and your hair stands on end.', icon: '🔋', usable: false },
    { id: 'aegis_core', name: 'AEGIS Core', description: 'The command core of Overseer AEGIS-9. The station finally answers to no one.', icon: '💽', usable: false },
  ],
  quests: [
    {
      id: 'helios_purge', title: 'Disable the Patrols', world: 'helios_ring',
      summary: 'Shut down the security patrols that still sweep the station decks.',
      objectives: [{ type: 'kill', target: 'security_droid', count: 5, label: 'Destroy Security Droids' }, { type: 'kill', target: 'riot_mech', count: 3, label: 'Wreck Riot Mechs' }],
      reward: { xp: 2100, gold: 250, items: { health_tonic: 3, energy_cell: 3 } },
      hint: 'Droids fire fast bolts from range: weave or block. Riot Mechs only drop their shield to a heavy blow.',
    },
    {
      id: 'reactor_cell', title: 'The Reactor Cell', world: 'helios_ring',
      summary: 'Climb the reactor spire and recover the fuel cell from its crown.',
      objectives: [{ type: 'collect', target: 'reactor_cell', count: 1, label: 'Take the Reactor Cell' }],
      reward: { xp: 1700, items: { energy_cell: 3 } },
      hint: 'The spire stands past the travelator deck. The conveyors carry you: jump when they push the wrong way.',
    },
    {
      id: 'defeat_aegis', title: 'Shut Down AEGIS', world: 'helios_ring',
      summary: 'Defeat Overseer AEGIS-9 inside the Reactor Dome.',
      objectives: [{ type: 'boss', target: 'aegis', count: 1, label: 'Defeat Overseer AEGIS-9' }],
      reward: { xp: 3000, gold: 950 },
      hint: 'Jump the low lasers, stay low for the high ones, and break free of the gravity well. Rest at a lamp first.',
    },
  ],
  accessories: {
    droid_head: {
      parts: [
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -10, 22, 14] },
        { t: 'rect', at: 'head', c: 'accent', p: [0, -5, 12, 4] },
        { t: 'line', at: 'head', c: 'accent', p: [-5, -10, -5, -24], w: 2 },
        { t: 'circle', at: 'head', c: 'accent', p: [-5, -25, 3] },
        { t: 'rect', at: 'sho', c: 'dark', p: [-8, 0, 16, 16] },
      ],
    },
    riot_plate: {
      parts: [
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -11, 22, 14] },
        { t: 'rect', at: 'head', c: 'accent', p: [1, -6, 10, 3] },
        { t: 'circle', at: 'sho', c: 'light', p: [-9, 2, 9] },
        { t: 'rect', at: 'sho', c: 'dark', p: [8, -10, 12, 44] },
        { t: 'rect', at: 'sho', c: 'accent', a: 0.6, p: [10, -6, 8, 36] },
      ],
    },
    jet_pack: {
      parts: [
        { t: 'rect', at: 'sho', c: 'dark', layer: 'back', p: [-14, -4, 10, 24] },
        { t: 'tri', at: 'sho', c: 0xffb347, layer: 'back', p: [-14, 20, -4, 20, -9, 34], sway: 4 },
        { t: 'rect', at: 'head', c: 'dark', p: [-9, -10, 18, 7] },
        { t: 'rect', at: 'head', c: 'accent', p: [0, -8, 9, 3] },
      ],
    },
    siege_frame: {
      torsoMul: 1.55,
      parts: [
        { t: 'rect', at: 'sho', c: 'dark', p: [-24, -6, 48, 20] },
        { t: 'circle', at: 'sho', c: 'light', p: [-22, 2, 11] },
        { t: 'circle', at: 'sho', c: 'light', p: [22, 2, 11] },
        { t: 'rect', at: 'sho', c: 'accent', p: [14, -4, 28, 8] },
        { t: 'rect', at: 'head', c: 'dark', p: [-12, -11, 24, 8] },
        { t: 'rect', at: 'hip', c: 'accent', p: [-16, -3, 32, 5] },
      ],
    },
    aegis_frame: {
      eye: 0xff4fd8,
      parts: [
        { t: 'circle', at: 'head', c: 0x56e0ff, a: 0.18, layer: 'back', p: [0, -2, 24] },
        { t: 'tri', at: 'sho', c: 0x56e0ff, a: 0.5, layer: 'back', p: [-4, -2, -4, 14, -40, 4], sway: 6 },
        { t: 'tri', at: 'sho', c: 0xff4fd8, a: 0.5, layer: 'back', p: [-4, 4, -4, 18, -34, 28], sway: 6 },
        { t: 'rect', at: 'head', c: 'dark', p: [-12, -11, 24, 15] },
        { t: 'rect', at: 'head', c: 0xff4fd8, p: [-1, -6, 13, 4] },
        { t: 'line', at: 'head', c: 0x56e0ff, p: [-8, -11, -14, -30], w: 3 },
        { t: 'line', at: 'head', c: 0x56e0ff, p: [8, -11, 14, -30], w: 3 },
        { t: 'circle', at: 'sho', c: 'dark', p: [-13, 4, 11] },
        { t: 'circle', at: 'sho', c: 'dark', p: [13, 4, 11] },
        { t: 'circle', at: 'sho', c: 0xff4fd8, a: 0.95, p: [0, 14, 6] },
        { t: 'rect', at: 'hip', c: 0x56e0ff, p: [-11, -3, 22, 4] },
      ],
    },
  },

  text: {
    'Helios Ring': 'حلقة هيليوس',
    'Reactor Dome': 'قبة المفاعل',
    'A derelict orbital station circling a gas giant. Ride its travelators, climb the reactor spire and break into the dome.': 'محطة مدارية مهجورة تدور حول عملاق غازي. اركب سيورها المتحركة واصعد برج المفاعل واقتحم القبة.',
    'Gravity is a suggestion. Security is not.': 'الجاذبية مجرد اقتراح. أما الأمن فلا.',
    'HELIOS': 'هيليوس', 'CARGO': 'الشحن', 'DECK B': 'السطح ب', 'REACTOR': 'المفاعل', 'HANGAR': 'الحظيرة', 'COMMAND': 'القيادة', 'SECURITY LOCKDOWN': 'إغلاق أمني', 'GRAVITY WELL': 'بئر جاذبية',
    'Docking Lamp': 'مصباح الإرساء', 'Deck B Lamp': 'مصباح السطح ب', 'Reactor Lamp': 'مصباح المفاعل', 'Hangar Lamp': 'مصباح الحظيرة', 'Command Lamp': 'مصباح القيادة', 'Reactor Dome Lamp': 'مصباح قبة المفاعل',
    'Security Droid': 'روبوت الأمن', 'Riot Mech': 'آلي مكافحة الشغب', 'Jet Hunter': 'صيّاد نفّاث', 'Siege Walker': 'ماشي الحصار',
    'Overseer AEGIS-9': 'المشرف إيجيس-٩', 'Warden of the Orbital Reactor': 'حارس المفاعل المداري',
    'Reactor Cell': 'خلية المفاعل', 'A fuel cell from the station reactor spire. It hums softly, and your hair stands on end.': 'خلية وقود من برج مفاعل المحطة. تطنّ بهدوء فيقفّ شعرك.',
    'AEGIS Core': 'نواة إيجيس', 'The command core of Overseer AEGIS-9. The station finally answers to no one.': 'نواة القيادة للمشرف إيجيس-٩. المحطة لا تخضع لأحد أخيرًا.',
    'Disable the Patrols': 'عطّل الدوريات', 'Shut down the security patrols that still sweep the station decks.': 'أوقف دوريات الأمن التي ما زالت تجوب أسطح المحطة.',
    'Destroy Security Droids': 'دمّر روبوتات الأمن', 'Wreck Riot Mechs': 'حطّم آليات مكافحة الشغب',
    'Droids fire fast bolts from range: weave or block. Riot Mechs only drop their shield to a heavy blow.': 'الروبوتات تطلق شحنات سريعة من بعيد: راوغ أو صُدّ. آليات الشغب لا تُنزل درعها إلا بضربة قوية.',
    'The Reactor Cell': 'خلية المفاعل', 'Climb the reactor spire and recover the fuel cell from its crown.': 'اصعد برج المفاعل واسترجع خلية الوقود من قمته.',
    'Take the Reactor Cell': 'خذ خلية المفاعل', 'The spire stands past the travelator deck. The conveyors carry you: jump when they push the wrong way.': 'البرج بعد سطح السيور. السيور تحملك: اقفز حين تدفعك في الاتجاه الخطأ.',
    'Shut Down AEGIS': 'أطفئ إيجيس', 'Defeat Overseer AEGIS-9 inside the Reactor Dome.': 'اهزم المشرف إيجيس-٩ داخل قبة المفاعل.',
    'Defeat Overseer AEGIS-9': 'اهزم المشرف إيجيس-٩', 'Jump the low lasers, stay low for the high ones, and break free of the gravity well. Rest at a lamp first.': 'اقفز فوق الليزر المنخفض، وابقَ منخفضًا للعالي، وتحرّر من بئر الجاذبية. استرح عند مصباح أولًا.',
  },
  weapons: WORLD_WEAPONS.helios_ring,
  load: () => import('./content').then((m) => m.content),
};
