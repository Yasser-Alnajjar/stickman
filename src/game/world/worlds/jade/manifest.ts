import type { WorldPackMeta } from '../../types';
import { WORLD_WEAPONS } from '@/game/weapons/catalog/worlds';
import { atk, enemy } from '../enemy-kit';

/** Jade Ruins (world 4): manifest (data only). Level geometry, painters and boss scripts load on demand from ./content. */
export const jadeManifest: WorldPackMeta = {
  id: 'jade_ruins',
  name: 'Jade Ruins',
  description: 'A temple city swallowed by the jungle and guarded by living stone. Climb its stairways and rope bridges to the sanctum.',
  tagline: 'The jungle remembers. Climb to the Sun Gate and wake the sanctum.',
  doorLabel: 'JADE',
  cityRegion: 'jade_ruins',
  arenaRegion: 'azcal_arena',
  cityTheme: 'jade',
  arenaTheme: 'arena_azcal',

  enemies: {
    vine_stalker: enemy('vine_stalker', 'Vine Stalker', 'assassin', {
      maxHealth: 70, attack: 12, xp: 70, gold: 13, dodgeChance: 0.5, attackRange: 96,
      attacks: [{ id: 'jr_stalker_thrust', weight: 3 }, { id: 'jr_stalker_pounce', weight: 2, minRange: 130 }],
      style: { color: 0x5fae4a, lineWidth: 3.8, scale: 1, accessory: 'vine_mask', accent: 0xd9ff7a, headRadius: 9 },
    }),
    temple_guardian: enemy('temple_guardian', 'Temple Guardian', 'guard', {
      maxHealth: 160, attack: 13, xp: 78, gold: 14, guard: 0.85,
      attacks: [{ id: 'jr_guardian_smash', weight: 3 }, { id: 'jr_guardian_sweep', weight: 2 }],
      style: { color: 0x8da58c, lineWidth: 6.5, scale: 1.16, accessory: 'stone_helm', accent: 0xe6b94f, headRadius: 10 },
    }),
    dart_priest: enemy('dart_priest', 'Dart Priest', 'shooter', {
      maxHealth: 50, attack: 11, xp: 56, gold: 11, chaseSpeed: 150,
      attacks: [{ id: 'jr_priest_dart', weight: 1 }],
      ranged: { attackId: 'jr_priest_dart', keepAway: 300, range: 620, speed: 640, color: 0x9bff7a },
      style: { color: 0xc9a25a, lineWidth: 4, scale: 0.98, accessory: 'priest_mask', accent: 0x7dffd0, headRadius: 9 },
    }),
    moss_golem: enemy('moss_golem', 'Moss Golem', 'brute', {
      maxHealth: 240, attack: 14, xp: 96, gold: 18,
      attacks: [{ id: 'jr_golem_slam', weight: 2 }, { id: 'jr_golem_swipe', weight: 2 }],
      style: { color: 0x6f8f5a, lineWidth: 10, scale: 1.34, accessory: 'golem_moss', accent: 0xb6e07a, headRadius: 10 },
    }),
  },
  enemyAttacks: {
    jr_stalker_thrust: atk('jr_stalker_thrust', 'Spear Thrust', { damage: 9, hitbox: { w: 110, h: 30, ox: 74, oy: -10 }, startup: 230, active: 80, recovery: 300, knockback: { x: 220, y: -50 }, anim: 'punch2', sfx: 'heavy', lunge: 220, telegraph: true }),
    jr_stalker_pounce: atk('jr_stalker_pounce', 'Pounce', { damage: 13, hitbox: { w: 96, h: 50, ox: 58, oy: -8 }, startup: 340, active: 130, recovery: 560, knockback: { x: 340, y: -120 }, hitStun: 340, anim: 'dash_attack', sfx: 'heavy', lunge: 660, telegraph: true }),
    jr_guardian_smash: atk('jr_guardian_smash', 'Stone Smash', { damage: 17, hitbox: { w: 90, h: 100, ox: 56, oy: -14 }, startup: 600, active: 120, recovery: 640, knockback: { x: 520, y: -240 }, hitStun: 480, hitStop: 90, shake: 0.006, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
    jr_guardian_sweep: atk('jr_guardian_sweep', 'Shield Sweep', { damage: 12, hitbox: { w: 120, h: 50, ox: 70, oy: -6 }, startup: 420, active: 100, recovery: 520, knockback: { x: 380, y: -100 }, anim: 'punch2', sfx: 'heavy', telegraph: true }),
    jr_priest_dart: atk('jr_priest_dart', 'Poison Dart', { damage: 10, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 }, startup: 480, active: 60, recovery: 240, knockback: { x: 200, y: -60 }, telegraph: true }),
    jr_golem_slam: atk('jr_golem_slam', 'Golem Slam', { damage: 25, hitbox: { w: 130, h: 100, ox: 74, oy: -18 }, startup: 700, active: 150, recovery: 760, knockback: { x: 600, y: -320 }, hitStun: 520, hitStop: 110, shake: 0.009, anim: 'slam', sfx: 'slam', telegraph: true, superArmor: true }),
    jr_golem_swipe: atk('jr_golem_swipe', 'Golem Swipe', { damage: 16, hitbox: { w: 120, h: 64, ox: 66, oy: -10 }, startup: 460, active: 110, recovery: 580, knockback: { x: 420, y: -130 }, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
  },

  boss: {
    id: 'azcal', name: 'Idol-King Azcal', subtitle: 'Sovereign of the Sunken Sanctum', prefix: 'azcal',
    maxHealth: 1280, attack: 14, defense: 6, width: 62, height: 172, walkSpeed: 112, xp: 1500, gold: 520,
    drop: 'jade_heart', phaseThresholds: [0.68, 0.34],
    patterns: [
      { id: 'combo', weight: 2 }, { id: 'slam', weight: 2 }, { id: 'glyph_wave', weight: 3 }, { id: 'boulder', weight: 3 },
      { id: 'idol_gaze', weight: 2, from: 2 }, { id: 'jade_burst', weight: 2, from: 2 }, { id: 'charge', weight: 1, from: 3 },
    ],
    summon: { phase: 3, kinds: ['dart_priest', 'temple_guardian'] },
    tempo: [1.1, 0.92, 0.78],
    style: { color: 0x5fae8a, lineWidth: 13, scale: 2.0, accessory: 'azcal_idol', accent: 0xe6b94f, headRadius: 12 },
    eye: 0x7dffd0,
    aura: { color: 0x7dffd0, r: 150 },
  },
  bossAttacks: {
    scale: 1.5,
    extras: {
      glyph: { damage: 20, knockback: { x: 260, y: -520 }, hitStun: 600 },
      gaze: { damage: 16, knockback: { x: 420, y: -200 }, hitStun: 450 },
      boulder: { damage: 24, knockback: { x: 640, y: -300 }, hitStun: 600 },
      shard: { damage: 12, knockback: { x: 300, y: -200 }, hitStun: 380 },
    },
  },

  items: [
    { id: 'jade_sun_disc', name: 'Jade Sun Disc', description: 'A carved disc that fits the lock of the Sun Gate. It is warm to the touch.', icon: '🌞', usable: false },
    { id: 'jade_heart', name: 'Heart of Azcal', description: 'The green core of the Idol-King. The temple is quiet at last.', icon: '💚', usable: false },
  ],
  quests: [
    {
      id: 'jade_purge', title: 'Clear the Ruins', world: 'jade_ruins',
      summary: 'Drive the temple guards and stalkers from the jungle stairways.',
      objectives: [{ type: 'kill', target: 'vine_stalker', count: 4, label: 'Defeat Vine Stalkers' }, { type: 'kill', target: 'temple_guardian', count: 3, label: 'Break Temple Guardians' }],
      reward: { xp: 1000, gold: 140, items: { health_tonic: 3, energy_cell: 2 } },
      hint: 'Guardians raise stone shields: heavy blows and abilities break them. Stalkers pounce from range, so keep moving.',
    },
    {
      id: 'sun_disc', title: 'The Sun Disc', world: 'jade_ruins',
      summary: 'Retrieve the jade disc from the crown of the pyramid tower.',
      objectives: [{ type: 'collect', target: 'jade_sun_disc', count: 1, label: 'Take the Jade Sun Disc' }],
      reward: { xp: 900, items: { energy_cell: 2 } },
      hint: 'The tower zig-zags up behind the rope bridges. Hold Space for full-height jumps.',
    },
    {
      id: 'defeat_azcal', title: 'Wake the Sanctum', world: 'jade_ruins',
      summary: 'Defeat Idol-King Azcal in the Sunken Sanctum.',
      objectives: [{ type: 'boss', target: 'azcal', count: 1, label: 'Defeat Idol-King Azcal' }],
      reward: { xp: 1500, gold: 600 },
      hint: 'Jump the boulders and the low beam, stay low under the high one. Rest at a lamp first.',
    },
  ],
  accessories: {
    vine_mask: {
      parts: [
        { t: 'tri', at: 'head', c: 'accent', layer: 'back', p: [-4, -2, -4, 6, -24, 8], sway: 5 },
        { t: 'tri', at: 'head', c: 'dark', layer: 'back', p: [-4, -6, -3, 2, -18, -4], sway: 4 },
        { t: 'rect', at: 'head', c: 'dark', p: [-9, -5, 18, 5] },
      ],
    },
    stone_helm: {
      parts: [
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -11, 22, 8] },
        { t: 'tri', at: 'head', c: 'accent', p: [-5, -10, 5, -10, 0, -24] },
        { t: 'rect', at: 'sho', c: 'accent', p: [9, -4, 7, 28] },
        { t: 'rect', at: 'sho', c: 'light', p: [10, -2, 5, 24] },
      ],
    },
    priest_mask: {
      parts: [
        { t: 'tri', at: 'head', c: 'dark', p: [-11, 4, 11, 4, 0, -16] },
        { t: 'tri', at: 'head', c: 'accent', layer: 'back', p: [-2, -12, 2, -12, -2, -26], sway: 3 },
        { t: 'rect', at: 'head', c: 'accent', p: [-5, -3, 12, 3] },
      ],
    },
    golem_moss: {
      parts: [
        { t: 'circle', at: 'sho', c: 'dark', p: [-9, 2, 9] },
        { t: 'circle', at: 'sho', c: 'dark', p: [9, 2, 9] },
        { t: 'ellipse', at: 'sho', c: 'accent', a: 0.85, p: [-8, -4, 14, 7] },
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -11, 22, 6] },
        { t: 'ellipse', at: 'hip', c: 'accent', a: 0.8, p: [0, -2, 24, 8] },
      ],
    },
    azcal_idol: {
      eye: 0x7dffd0,
      parts: [
        { t: 'circle', at: 'head', c: 'accent', a: 0.3, layer: 'back', p: [-2, -2, 22] },
        { t: 'tri', at: 'head', c: 0x3fe0b0, layer: 'back', p: [-14, -8, -8, -8, -22, -34] },
        { t: 'tri', at: 'head', c: 'accent', layer: 'back', p: [-8, -9, -2, -9, -10, -40] },
        { t: 'tri', at: 'head', c: 0x3fe0b0, layer: 'back', p: [-2, -9, 4, -9, 0, -44] },
        { t: 'tri', at: 'head', c: 'accent', layer: 'back', p: [2, -9, 8, -9, 10, -40] },
        { t: 'tri', at: 'head', c: 0x3fe0b0, layer: 'back', p: [8, -8, 14, -8, 22, -34] },
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -9, 22, 11] },
        { t: 'rect', at: 'head', c: 0x7dffd0, p: [1, -5, 8, 3] },
        { t: 'circle', at: 'sho', c: 'dark', p: [-10, 4, 11] },
        { t: 'circle', at: 'sho', c: 'dark', p: [10, 4, 9] },
        { t: 'circle', at: 'sho', c: 0x7dffd0, a: 0.9, p: [0, 18, 4] },
        { t: 'rect', at: 'hip', c: 'accent', p: [-9, -3, 18, 4] },
        { t: 'tri', at: 'hip', c: 'dark', p: [-9, 0, 9, 0, 0, 26] },
      ],
    },
  },

  text: {
    'Jade Ruins': 'أطلال اليشم',
    'Sunken Sanctum': 'المحراب الغارق',
    'A temple city swallowed by the jungle and guarded by living stone. Climb its stairways and rope bridges to the sanctum.': 'مدينة معابد ابتلعتها الأدغال وتحرسها صخور حيّة. اصعد درجاتها وجسورها المعلّقة إلى المحراب.',
    'The jungle remembers. Climb to the Sun Gate and wake the sanctum.': 'الأدغال تتذكر. اصعد إلى بوابة الشمس وأيقظ المحراب.',
    'JADE': 'اليشم', 'RUINS': 'الأطلال', 'TEMPLE': 'المعبد', 'SUN GATE': 'بوابة الشمس', 'HALL': 'القاعة', 'SANCTUM': 'المحراب', 'AWAKE': 'استيقظ', 'SHATTER!': 'تحطّم!',
    'Ruin Gate Lamp': 'مصباح بوابة الأطلال', 'Idol Stair Lamp': 'مصباح درج التمثال', 'Rope Bridge Lamp': 'مصباح الجسر المعلّق', 'Pillar Hall Lamp': 'مصباح قاعة الأعمدة', 'Sanctum Lamp': 'مصباح المحراب',
    'Vine Stalker': 'مطارد الكروم', 'Temple Guardian': 'حارس المعبد', 'Dart Priest': 'كاهن السهام', 'Moss Golem': 'عملاق الطحلب',
    'Idol-King Azcal': 'ملك التماثيل أزكال', 'Sovereign of the Sunken Sanctum': 'سيّد المحراب الغارق',
    'Jade Sun Disc': 'قرص الشمس اليشمي', 'A carved disc that fits the lock of the Sun Gate. It is warm to the touch.': 'قرص منحوت يناسب قفل بوابة الشمس. دافئ عند اللمس.',
    'Heart of Azcal': 'قلب أزكال', 'The green core of the Idol-King. The temple is quiet at last.': 'النواة الخضراء لملك التماثيل. هدأ المعبد أخيرًا.',
    'Clear the Ruins': 'طهّر الأطلال', 'Drive the temple guards and stalkers from the jungle stairways.': 'اطرد حرّاس المعبد والمطارِدين من درج الأدغال.',
    'Defeat Vine Stalkers': 'اهزم مطاردي الكروم', 'Break Temple Guardians': 'حطّم حرّاس المعبد',
    'Guardians raise stone shields: heavy blows and abilities break them. Stalkers pounce from range, so keep moving.': 'الحرّاس يرفعون دروعًا حجرية: الضربات القوية والقدرات تكسرها. المطاردون يقفزون من بعيد، فتحرّك دائمًا.',
    'The Sun Disc': 'قرص الشمس', 'Retrieve the jade disc from the crown of the pyramid tower.': 'استرجع القرص اليشمي من قمة برج الهرم.',
    'Take the Jade Sun Disc': 'خذ قرص الشمس اليشمي', 'The tower zig-zags up behind the rope bridges. Hold Space for full-height jumps.': 'البرج يتعرّج صعودًا خلف الجسور المعلّقة. اضغط Space مطولًا لقفزات كاملة.',
    'Wake the Sanctum': 'أيقظ المحراب', 'Defeat Idol-King Azcal in the Sunken Sanctum.': 'اهزم ملك التماثيل أزكال في المحراب الغارق.',
    'Defeat Idol-King Azcal': 'اهزم ملك التماثيل أزكال', 'Jump the boulders and the low beam, stay low under the high one. Rest at a lamp first.': 'اقفز فوق الصخور والشعاع المنخفض، وابقَ منخفضًا تحت العالي. استرح عند مصباح أولًا.',
  },
  weapons: WORLD_WEAPONS.jade_ruins,
  load: () => import('./content').then((m) => m.content),
};
