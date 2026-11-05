import type { WorldPackMeta } from '../../types';
import { atk, enemy } from '../enemy-kit';

/** Hollow Wood (world 8): manifest (data only). */
export const hollowManifest: WorldPackMeta = {
  id: 'hollow_wood',
  name: 'Hollow Wood',
  description: 'A haunted forest of fog and gravestones that ends at the gates of a cursed castle. Cross the branch walk, then the walls, to the Moonlit Keep.',
  tagline: 'The fog has teeth. The castle has a countess.',
  doorLabel: 'HOLLOW',
  cityRegion: 'hollow_city',
  arenaRegion: 'mordaine_arena',
  cityTheme: 'hollow',
  arenaTheme: 'arena_mordaine',

  enemies: {
    grave_ghoul: enemy('grave_ghoul', 'Grave Ghoul', 'runner', {
      maxHealth: 120, attack: 17, xp: 150, gold: 22, chaseSpeed: 240, dodgeChance: 0.25, knockbackResist: 0.2,
      attacks: [{ id: 'hw_ghoul_claw', weight: 3 }, { id: 'hw_ghoul_lunge', weight: 2, minRange: 130 }],
      style: { color: 0x8aa88a, lineWidth: 4.4, scale: 1.04, accessory: 'ghoul_rags', accent: 0xe8e2d0, headRadius: 9 },
    }),
    wailing_wraith: enemy('wailing_wraith', 'Wailing Wraith', 'shooter', {
      maxHealth: 98, attack: 17, xp: 138, gold: 20, attackCooldown: 1500, chaseSpeed: 150,
      attacks: [{ id: 'hw_wraith_bolt', weight: 1 }],
      ranged: { attackId: 'hw_wraith_bolt', keepAway: 330, range: 700, speed: 470, color: 0x7dffb0 },
      style: { color: 0xbfe8d0, lineWidth: 3.6, scale: 1.04, accessory: 'wraith_shroud', accent: 0x7dffb0, headRadius: 9 },
    }),
    bone_knight: enemy('bone_knight', 'Bone Knight', 'guard', {
      maxHealth: 330, attack: 19, xp: 168, gold: 25, guard: 0.9,
      attacks: [{ id: 'hw_knight_cleave', weight: 3 }, { id: 'hw_knight_thrust', weight: 2 }],
      style: { color: 0xd8d2c0, lineWidth: 7, scale: 1.22, accessory: 'bone_armor', accent: 0xb0173a, headRadius: 10 },
    }),
    hollow_wolf: enemy('hollow_wolf', 'Hollow Wolf', 'assassin', {
      maxHealth: 190, attack: 19, xp: 176, gold: 26, chaseSpeed: 340, dodgeChance: 0.45, width: 34, height: 92,
      attacks: [{ id: 'hw_wolf_maul', weight: 3 }, { id: 'hw_wolf_pounce', weight: 2, minRange: 170 }],
      style: { color: 0x4a3a5a, lineWidth: 6, scale: 1.2, accessory: 'wolf_mane', accent: 0xffd27a, headRadius: 10 },
    }),
  },
  enemyAttacks: {
    hw_ghoul_claw: atk('hw_ghoul_claw', 'Ghoul Claw', { damage: 11, hitbox: { w: 80, h: 50, ox: 52, oy: -8 }, startup: 170, active: 80, recovery: 100, knockback: { x: 150, y: -40 }, hitStun: 220, chain: 'hw_ghoul_claw2' }),
    hw_ghoul_claw2: atk('hw_ghoul_claw2', 'Ghoul Rake', { damage: 15, hitbox: { w: 90, h: 56, ox: 56, oy: -6 }, startup: 190, active: 90, recovery: 460, knockback: { x: 340, y: -130 }, hitStun: 330, anim: 'kick', sfx: 'kick', telegraph: true }),
    hw_ghoul_lunge: atk('hw_ghoul_lunge', 'Ghoul Lunge', { damage: 18, hitbox: { w: 100, h: 56, ox: 60, oy: -8 }, startup: 340, active: 140, recovery: 620, knockback: { x: 380, y: -140 }, hitStun: 360, anim: 'dash_attack', sfx: 'heavy', lunge: 700, telegraph: true }),
    hw_wraith_bolt: atk('hw_wraith_bolt', 'Soul Bolt', { damage: 15, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 }, startup: 460, active: 60, recovery: 240, knockback: { x: 240, y: -60 }, telegraph: true }),
    hw_knight_cleave: atk('hw_knight_cleave', 'Grave Cleave', { damage: 25, hitbox: { w: 118, h: 100, ox: 66, oy: -14 }, startup: 600, active: 120, recovery: 660, knockback: { x: 560, y: -260 }, hitStun: 520, hitStop: 100, shake: 0.007, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
    hw_knight_thrust: atk('hw_knight_thrust', 'Rusted Thrust', { damage: 17, hitbox: { w: 130, h: 44, ox: 78, oy: -10 }, startup: 440, active: 100, recovery: 520, knockback: { x: 420, y: -100 }, anim: 'punch2', sfx: 'heavy', telegraph: true, lunge: 260 }),
    hw_wolf_maul: atk('hw_wolf_maul', 'Maul', { damage: 13, hitbox: { w: 92, h: 56, ox: 58, oy: -6 }, startup: 170, active: 80, recovery: 100, knockback: { x: 170, y: -40 }, hitStun: 230, chain: 'hw_wolf_maul2' }),
    hw_wolf_maul2: atk('hw_wolf_maul2', 'Rending Bite', { damage: 20, hitbox: { w: 100, h: 60, ox: 62, oy: -4 }, startup: 200, active: 100, recovery: 520, knockback: { x: 400, y: -160 }, hitStun: 380, anim: 'kick', sfx: 'kick', telegraph: true }),
    hw_wolf_pounce: atk('hw_wolf_pounce', 'Full Moon Pounce', { damage: 22, hitbox: { w: 118, h: 60, ox: 68, oy: -8 }, startup: 360, active: 150, recovery: 680, knockback: { x: 440, y: -160 }, hitStun: 400, anim: 'dash_attack', sfx: 'heavy', lunge: 880, telegraph: true }),
  },

  boss: {
    id: 'mordaine', name: 'Countess Mordaine', subtitle: 'Mistress of the Cursed Keep', prefix: 'mordaine',
    maxHealth: 2650, attack: 21, defense: 10, width: 50, height: 172, walkSpeed: 134, xp: 3800, gold: 1150,
    drop: 'mordaine_signet', phaseThresholds: [0.7, 0.35],
    patterns: [
      { id: 'combo', weight: 2 }, { id: 'bat_swarm', weight: 3 }, { id: 'crimson_orbs', weight: 3 }, { id: 'mist_step', weight: 3 },
      { id: 'blood_bind', weight: 3, from: 2 }, { id: 'whirl', weight: 1, from: 2 }, { id: 'moonfall', weight: 3, from: 3 },
    ],
    summon: { phase: 3, kinds: ['hollow_wolf', 'wailing_wraith'] },
    tempo: [1, 0.84, 0.68],
    style: { color: 0xd7c4e8, lineWidth: 8.5, scale: 1.88, accessory: 'mordaine_gown', accent: 0xb0173a, headRadius: 10 },
    eye: 0xff3b5c,
    aura: { color: 0xb0173a, r: 145 },
  },
  bossAttacks: {
    scale: 2.3,
    extras: {
      bat: { damage: 14, knockback: { x: 240, y: -200 }, hitStun: 340 },
      tendril: { damage: 22, knockback: { x: 340, y: -480 }, hitStun: 600 },
      orb: { damage: 20, knockback: { x: 320, y: -220 }, hitStun: 440 },
      whirl: { damage: 22, knockback: { x: 560, y: -280 }, hitStun: 520 },
      moonfall: { damage: 44, knockback: { x: 500, y: -640 }, hitStun: 800 },
      strike_claw: { damage: 26, hitbox: { w: 180, h: 80, ox: 108, oy: -6 }, startup: 320, active: 110, recovery: 140, knockback: { x: 480, y: -240 }, hitStun: 480, telegraph: true, chain: 'mordaine_strike_claw2' },
      strike_claw2: { damage: 30, hitbox: { w: 190, h: 90, ox: 114, oy: -6 }, startup: 260, active: 120, recovery: 640, knockback: { x: 640, y: -320 }, hitStun: 580, telegraph: true },
    },
  },

  items: [
    { id: 'moon_chalice', name: 'Moon Chalice', description: 'A silver chalice that still holds a measure of moonlight. It is cold, and it listens.', icon: '🏆', usable: false },
    { id: 'mordaine_signet', name: "Mordaine's Signet", description: 'The blood-red seal ring of the Countess. The keep is silent, and the fog is lifting.', icon: '💍', usable: false },
  ],
  quests: [
    {
      id: 'hollow_purge', title: 'Lay Them to Rest', world: 'hollow_wood',
      summary: 'Put down the ghouls and bone knights that wander the wood and the castle wall.',
      objectives: [{ type: 'kill', target: 'grave_ghoul', count: 5, label: 'Defeat Grave Ghouls' }, { type: 'kill', target: 'bone_knight', count: 3, label: 'Shatter Bone Knights' }],
      reward: { xp: 2600, gold: 300, items: { health_tonic: 4, energy_cell: 3 } },
      hint: 'Ghouls come in pairs: do not stand still. Bone Knights keep their guard up until a heavy blow breaks it.',
    },
    {
      id: 'moon_chalice', title: 'The Moon Chalice', world: 'hollow_wood',
      summary: 'Climb the ruined chapel tower and bring down the chalice.',
      objectives: [{ type: 'collect', target: 'moon_chalice', count: 1, label: 'Take the Moon Chalice' }],
      reward: { xp: 2100, items: { energy_cell: 3 } },
      hint: 'The chapel stands at the end of the fog walk. Keep to the branches and hold Space for full jumps.',
    },
    {
      id: 'defeat_mordaine', title: 'End the Curse', world: 'hollow_wood',
      summary: 'Defeat Countess Mordaine in the Moonlit Keep.',
      objectives: [{ type: 'boss', target: 'mordaine', count: 1, label: 'Defeat Countess Mordaine' }],
      reward: { xp: 3800, gold: 1100 },
      hint: 'When the moon warns, leave its column. Stay on the move against the tendrils. Rest at a lamp first.',
    },
  ],
  accessories: {
    ghoul_rags: {
      parts: [
        { t: 'tri', at: 'sho', c: 'dark', layer: 'back', p: [0, 0, -3, 12, -18, 26], sway: 5 },
        { t: 'tri', at: 'hip', c: 'dark', p: [-8, 0, 8, 0, 2, 20] },
        { t: 'rect', at: 'head', c: 'dark', p: [-9, -3, 18, 3] },
      ],
    },
    wraith_shroud: {
      parts: [
        { t: 'tri', at: 'sho', c: 'light', a: 0.55, layer: 'back', p: [-8, -2, 8, -2, 0, 56], sway: 6 },
        { t: 'tri', at: 'head', c: 'light', a: 0.7, p: [-11, 5, 11, 5, 0, -17] },
        { t: 'rect', at: 'head', c: 0x07030f, p: [-2, -4, 11, 5] },
        { t: 'circle', at: 'handA', c: 'accent', a: 0.7, p: [0, 0, 6] },
      ],
    },
    bone_armor: {
      parts: [
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -11, 22, 12] },
        { t: 'tri', at: 'head', c: 'accent', p: [-4, -10, 4, -10, 0, -28] },
        { t: 'circle', at: 'sho', c: 'light', p: [-9, 2, 10] },
        { t: 'circle', at: 'sho', c: 'light', p: [9, 2, 10] },
        { t: 'rect', at: 'sho', c: 'dark', p: [11, -6, 9, 44] },
        { t: 'line', at: 'handA', c: 0xe6ecff, p: [0, -4, 36, -22], w: 3 },
      ],
    },
    wolf_mane: {
      parts: [
        { t: 'tri', at: 'head', c: 'dark', p: [-8, -6, -3, -6, -9, -26] },
        { t: 'tri', at: 'head', c: 'dark', p: [4, -6, 9, -6, 10, -24] },
        { t: 'ellipse', at: 'sho', c: 'dark', p: [-4, 2, 26, 24] },
        { t: 'tri', at: 'hip', c: 'dark', layer: 'back', p: [-4, -2, -2, 8, -26, 26], sway: 6 },
        { t: 'circle', at: 'head', c: 'accent', p: [5, -1, 2] },
      ],
    },
    mordaine_gown: {
      eye: 0xff3b5c,
      parts: [
        { t: 'tri', at: 'sho', c: 0x6a0f2a, layer: 'back', p: [-6, -2, 8, -2, -40, 70], sway: 7 },
        { t: 'tri', at: 'sho', c: 0xb0173a, a: 0.85, layer: 'back', p: [-4, 2, 6, 2, -26, 62], sway: 5 },
        { t: 'tri', at: 'hip', c: 0x1b0710, p: [-14, 0, 14, 0, 0, 34] },
        { t: 'poly', at: 'sho', c: 0x1b0710, p: [-14, -2, 14, -2, 20, -26, 10, -12, 0, -30, -10, -12, -20, -26] },
        { t: 'circle', at: 'sho', c: 0xb0173a, p: [0, 10, 4] },
        { t: 'tri', at: 'head', c: 0xb0173a, p: [-10, -7, -4, -7, -8, -26] },
        { t: 'tri', at: 'head', c: 0xb0173a, p: [4, -7, 10, -7, 8, -26] },
        { t: 'rect', at: 'head', c: 0x07030f, p: [-1, -4, 11, 3] },
      ],
    },
  },

  text: {
    'Hollow Wood': 'غابة الجوف',
    'Moonlit Keep': 'الحصن القمري',
    'A haunted forest of fog and gravestones that ends at the gates of a cursed castle. Cross the branch walk, then the walls, to the Moonlit Keep.': 'غابة مسكونة من الضباب وشواهد القبور تنتهي عند بوابات قلعة ملعونة. اعبر ممر الأغصان ثم الأسوار إلى الحصن القمري.',
    'The fog has teeth. The castle has a countess.': 'للضباب أنياب، وللقلعة كونتيسة.',
    'HOLLOW': 'الجوف', 'GRAVEYARD': 'المقبرة', 'FOG WALK': 'ممر الضباب', 'CHAPEL': 'الكنيسة', 'GATEHOUSE': 'برج البوابة', 'KEEP': 'الحصن', 'BLOOD MOON': 'قمر الدم', 'MOONFALL': 'سقوط القمر',
    'Wood Gate Lamp': 'مصباح بوابة الغابة', 'Graveyard Lamp': 'مصباح المقبرة', 'Chapel Lamp': 'مصباح الكنيسة', 'Castle Wall Lamp': 'مصباح سور القلعة', 'Courtyard Lamp': 'مصباح الفناء', 'Moonlit Keep Lamp': 'مصباح الحصن القمري',
    'Grave Ghoul': 'غول القبور', 'Wailing Wraith': 'شبح النحيب', 'Bone Knight': 'فارس العظام', 'Hollow Wolf': 'ذئب الجوف',
    'Countess Mordaine': 'الكونتيسة موردين', 'Mistress of the Cursed Keep': 'سيدة الحصن الملعون',
    'Moon Chalice': 'كأس القمر', 'A silver chalice that still holds a measure of moonlight. It is cold, and it listens.': 'كأس فضية ما زالت تحتفظ بقدر من ضوء القمر. باردة، وتصغي.',
    "Mordaine's Signet": 'خاتم موردين', 'The blood-red seal ring of the Countess. The keep is silent, and the fog is lifting.': 'خاتم الختم القرمزي للكونتيسة. الحصن صامت والضباب ينقشع.',
    'Lay Them to Rest': 'أرِحهم في قبورهم', 'Put down the ghouls and bone knights that wander the wood and the castle wall.': 'أسقط الغيلان وفرسان العظام الذين يجوبون الغابة وسور القلعة.',
    'Defeat Grave Ghouls': 'اهزم غيلان القبور', 'Shatter Bone Knights': 'حطّم فرسان العظام',
    'Ghouls come in pairs: do not stand still. Bone Knights keep their guard up until a heavy blow breaks it.': 'الغيلان تأتي أزواجًا: لا تقف ساكنًا. فرسان العظام يرفعون حراستهم حتى تكسرها ضربة قوية.',
    'The Moon Chalice': 'كأس القمر', 'Climb the ruined chapel tower and bring down the chalice.': 'اصعد برج الكنيسة المتهدّمة وأنزل الكأس.',
    'Take the Moon Chalice': 'خذ كأس القمر', 'The chapel stands at the end of the fog walk. Keep to the branches and hold Space for full jumps.': 'الكنيسة في نهاية ممر الضباب. الزم الأغصان واضغط Space مطولًا لقفزات كاملة.',
    'End the Curse': 'أنهِ اللعنة', 'Defeat Countess Mordaine in the Moonlit Keep.': 'اهزم الكونتيسة موردين في الحصن القمري.',
    'Defeat Countess Mordaine': 'اهزم الكونتيسة موردين', 'When the moon warns, leave its column. Stay on the move against the tendrils. Rest at a lamp first.': 'حين ينذر القمر، اترك عموده. ابقَ متحركًا أمام المخالب. استرح عند مصباح أولًا.',
  },
  load: () => import('./content').then((m) => m.content),
};
