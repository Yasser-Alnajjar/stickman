import type { WorldPackMeta } from '../../types';
import { WORLD_WEAPONS } from '@/game/weapons/catalog/worlds';
import { atk, enemy } from '../enemy-kit';

/** Frostpeak Station (world 5): manifest (data only). */
export const frostManifest: WorldPackMeta = {
  id: 'frostpeak_station',
  name: 'Frostpeak Station',
  description: 'An abandoned arctic research complex clinging to a blizzard-swept peak. Climb the ice shelves and cross the gale pass to the frozen reactor.',
  tagline: 'The storm never stops. Reach the summit and thaw the reactor.',
  doorLabel: 'FROST',
  cityRegion: 'frostpeak',
  arenaRegion: 'cryo_arena',
  cityTheme: 'frost',
  arenaTheme: 'arena_glacia',

  enemies: {
    snow_stalker: enemy('snow_stalker', 'Snow Stalker', 'assassin', {
      maxHealth: 84, attack: 13, xp: 88, gold: 15,
      attacks: [{ id: 'fp_stalker_claw', weight: 3 }, { id: 'fp_stalker_leap', weight: 2, minRange: 140 }],
      style: { color: 0xe3eff7, lineWidth: 4, scale: 1.02, accessory: 'frost_hood', accent: 0x8fe8ff, headRadius: 9 },
    }),
    cryo_trooper: enemy('cryo_trooper', 'Cryo Trooper', 'shooter', {
      maxHealth: 62, attack: 12, xp: 72, gold: 13, attackCooldown: 1500,
      attacks: [{ id: 'fp_trooper_shard', weight: 1 }],
      ranged: { attackId: 'fp_trooper_shard', keepAway: 340, range: 680, speed: 600, color: 0xbfefff },
      style: { color: 0x7d93a8, lineWidth: 4.5, scale: 1.02, accessory: 'visor_trooper', accent: 0x8fe8ff, headRadius: 9 },
    }),
    rime_knight: enemy('rime_knight', 'Rime Knight', 'guard', {
      maxHealth: 200, attack: 14, xp: 96, gold: 17, guard: 0.88,
      attacks: [{ id: 'fp_knight_bash', weight: 3 }, { id: 'fp_knight_cleave', weight: 2 }],
      style: { color: 0x9fc4de, lineWidth: 7, scale: 1.2, accessory: 'rime_armor', accent: 0xe8fbff, headRadius: 10 },
    }),
    yeti_brute: enemy('yeti_brute', 'Yeti Brute', 'brute', {
      maxHealth: 300, attack: 16, xp: 118, gold: 20,
      attacks: [{ id: 'fp_yeti_pound', weight: 2 }, { id: 'fp_yeti_swipe', weight: 2 }],
      style: { color: 0xdfe8ef, lineWidth: 11, scale: 1.4, accessory: 'yeti_fur', accent: 0x8fb6d0, headRadius: 10 },
    }),
  },
  enemyAttacks: {
    fp_stalker_claw: atk('fp_stalker_claw', 'Claw Flurry', { damage: 7, startup: 170, recovery: 90, knockback: { x: 130, y: -30 }, hitStun: 200, chain: 'fp_stalker_claw2' }),
    fp_stalker_claw2: atk('fp_stalker_claw2', 'Claw Rake', { damage: 11, hitbox: { w: 84, h: 52, ox: 54, oy: -4 }, startup: 200, recovery: 480, knockback: { x: 320, y: -120 }, hitStun: 320, anim: 'kick', sfx: 'kick', telegraph: true }),
    fp_stalker_leap: atk('fp_stalker_leap', 'Ice Leap', { damage: 14, hitbox: { w: 100, h: 54, ox: 58, oy: -8 }, startup: 360, active: 130, recovery: 620, knockback: { x: 360, y: -140 }, hitStun: 340, anim: 'dash_attack', sfx: 'heavy', lunge: 700, telegraph: true }),
    fp_trooper_shard: atk('fp_trooper_shard', 'Ice Shard', { damage: 11, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 }, startup: 440, active: 60, recovery: 240, knockback: { x: 220, y: -60 }, telegraph: true }),
    fp_knight_bash: atk('fp_knight_bash', 'Rime Bash', { damage: 17, hitbox: { w: 90, h: 92, ox: 56, oy: -14 }, startup: 540, active: 120, recovery: 660, knockback: { x: 540, y: -240 }, hitStun: 480, hitStop: 90, shake: 0.006, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
    fp_knight_cleave: atk('fp_knight_cleave', 'Frost Cleave', { damage: 13, hitbox: { w: 118, h: 60, ox: 70, oy: -10 }, startup: 420, active: 100, recovery: 520, knockback: { x: 380, y: -110 }, anim: 'punch2', sfx: 'heavy', telegraph: true, lunge: 140 }),
    fp_yeti_pound: atk('fp_yeti_pound', 'Yeti Pound', { damage: 28, hitbox: { w: 140, h: 100, ox: 74, oy: -18 }, startup: 720, active: 150, recovery: 780, knockback: { x: 620, y: -340 }, hitStun: 540, hitStop: 110, shake: 0.01, anim: 'slam', sfx: 'slam', telegraph: true, superArmor: true }),
    fp_yeti_swipe: atk('fp_yeti_swipe', 'Yeti Swipe', { damage: 18, hitbox: { w: 124, h: 68, ox: 68, oy: -10 }, startup: 460, active: 110, recovery: 560, knockback: { x: 440, y: -130 }, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
  },

  boss: {
    id: 'glacia', name: 'Cryo-Matron Glacia', subtitle: 'Warden of the Frozen Reactor', prefix: 'glacia',
    maxHealth: 1560, attack: 16, defense: 7, width: 54, height: 176, walkSpeed: 118, xp: 1900, gold: 640,
    drop: 'glacia_crown', phaseThresholds: [0.68, 0.34],
    patterns: [
      { id: 'combo', weight: 2 }, { id: 'slam', weight: 2 }, { id: 'frost_nova', weight: 3 }, { id: 'icicle_storm', weight: 3 },
      { id: 'cryo_lance', weight: 2, from: 2 }, { id: 'blizzard', weight: 2, from: 2 }, { id: 'leap', weight: 1, from: 3 },
    ],
    summon: { phase: 3, kinds: ['snow_stalker', 'snow_stalker'] },
    tempo: [1.05, 0.9, 0.76],
    style: { color: 0xbfe9ff, lineWidth: 10, scale: 1.92, accessory: 'glacia_queen', accent: 0xe8fbff, headRadius: 11 },
    eye: 0x8fe8ff,
    aura: { color: 0x8fe8ff, r: 140 },
  },
  bossAttacks: {
    scale: 1.7,
    extras: {
      spike: { damage: 22, knockback: { x: 240, y: -540 }, hitStun: 600 },
      icicle: { damage: 26, knockback: { x: 200, y: -460 }, hitStun: 620 },
      orb: { damage: 16, knockback: { x: 300, y: -200 }, hitStun: 420 },
      lance: { damage: 18, knockback: { x: 420, y: -220 }, hitStun: 480 },
    },
  },

  items: [
    { id: 'frozen_core', name: 'Frozen Reactor Core', description: 'A coolant core still humming with cold light. The station engineers swore it could not freeze.', icon: '❄️', usable: false },
    { id: 'glacia_crown', name: "Glacia's Frost Crown", description: 'A circlet of living ice torn from the Cryo-Matron. The reactor can finally thaw.', icon: '👑', usable: false },
  ],
  quests: [
    {
      id: 'frost_purge', title: 'Break the Garrison', world: 'frostpeak_station',
      summary: 'Cut down the station garrison that still patrols the ice.',
      objectives: [{ type: 'kill', target: 'cryo_trooper', count: 4, label: 'Defeat Cryo Troopers' }, { type: 'kill', target: 'rime_knight', count: 3, label: 'Shatter Rime Knights' }],
      reward: { xp: 1300, gold: 170, items: { health_tonic: 3, energy_cell: 2 } },
      hint: 'Troopers keep their distance: close in or block the shards. Rime Knights guard until a heavy blow breaks them.',
    },
    {
      id: 'frozen_core', title: 'The Frozen Core', world: 'frostpeak_station',
      summary: 'Recover the coolant core from the radar spire above the labs.',
      objectives: [{ type: 'collect', target: 'frozen_core', count: 1, label: 'Take the Frozen Reactor Core' }],
      reward: { xp: 1100, items: { energy_cell: 3 } },
      hint: 'The spire stands past the gale pass. The wind pushes against you: jump from shelf to shelf.',
    },
    {
      id: 'defeat_glacia', title: 'Thaw the Reactor', world: 'frostpeak_station',
      summary: 'Defeat Cryo-Matron Glacia in the Cryo Core.',
      objectives: [{ type: 'boss', target: 'glacia', count: 1, label: 'Defeat Cryo-Matron Glacia' }],
      reward: { xp: 1900, gold: 700 },
      hint: 'Dodge the ice rows by jumping between them. Do not stand still in the blizzard. Rest at a lamp first.',
    },
  ],
  accessories: {
    frost_hood: {
      parts: [
        { t: 'tri', at: 'head', c: 0xf2f8fb, p: [-12, 4, 12, 4, -2, -17] },
        { t: 'tri', at: 'head', c: 'accent', layer: 'back', p: [-5, 2, -5, 8, -26, 12], sway: 5 },
        { t: 'rect', at: 'head', c: 'dark', p: [-1, -4, 8, 4] },
      ],
    },
    visor_trooper: {
      parts: [
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -10, 22, 10] },
        { t: 'rect', at: 'head', c: 'accent', p: [0, -6, 11, 4] },
        { t: 'line', at: 'head', c: 0xff5a5a, p: [-6, -10, -10, -24], w: 2 },
        { t: 'rect', at: 'sho', c: 'dark', p: [-8, 0, 16, 18] },
        { t: 'rect', at: 'sho', c: 0xf2b630, p: [-8, 8, 16, 3] },
      ],
    },
    rime_armor: {
      parts: [
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -11, 22, 14] },
        { t: 'tri', at: 'head', c: 'accent', p: [-4, -10, 4, -10, 0, -26] },
        { t: 'circle', at: 'sho', c: 'light', p: [-8, 2, 9] },
        { t: 'rect', at: 'sho', c: 'accent', p: [10, -8, 8, 40] },
        { t: 'rect', at: 'sho', c: 0x8fe8ff, a: 0.7, p: [11, -4, 5, 32] },
      ],
    },
    yeti_fur: {
      torsoMul: 1.4,
      parts: [
        { t: 'ellipse', at: 'sho', c: 0xf2f8fb, p: [0, 6, 46, 34] },
        { t: 'circle', at: 'sho', c: 0xcfdce6, p: [-12, 2, 10] },
        { t: 'circle', at: 'sho', c: 0xcfdce6, p: [12, 2, 10] },
        { t: 'tri', at: 'head', c: 0xe8f3fb, p: [-11, -6, -7, -6, -13, -22] },
        { t: 'tri', at: 'head', c: 0xe8f3fb, p: [11, -6, 7, -6, 13, -22] },
        { t: 'ellipse', at: 'hip', c: 0xf2f8fb, p: [0, 0, 34, 14] },
      ],
    },
    glacia_queen: {
      eye: 0x8fe8ff,
      parts: [
        { t: 'tri', at: 'sho', c: 0x6fb0d4, layer: 'back', p: [0, -2, -2, 10, -34, 54], sway: 7 },
        { t: 'tri', at: 'sho', c: 0xcdeaf7, a: 0.8, layer: 'back', p: [0, 2, -2, 8, -20, 44], sway: 5 },
        { t: 'tri', at: 'head', c: 0xe8fbff, p: [-11, -8, -5, -8, -12, -34] },
        { t: 'tri', at: 'head', c: 0x8fe8ff, p: [-6, -9, 0, -9, -4, -42] },
        { t: 'tri', at: 'head', c: 0xe8fbff, p: [0, -9, 6, -9, 4, -46] },
        { t: 'tri', at: 'head', c: 0x8fe8ff, p: [6, -9, 12, -9, 9, -40] },
        { t: 'tri', at: 'head', c: 0xe8fbff, p: [10, -8, 16, -8, 18, -30] },
        { t: 'tri', at: 'sho', c: 0xe8fbff, p: [-18, 2, -6, -2, -20, -18] },
        { t: 'tri', at: 'sho', c: 0xe8fbff, p: [18, 2, 6, -2, 20, -18] },
        { t: 'circle', at: 'sho', c: 0x8fe8ff, a: 0.9, p: [0, 14, 5] },
        { t: 'circle', at: 'handA', c: 0xe8fbff, a: 0.8, p: [0, 0, 7] },
      ],
    },
  },

  text: {
    'Frostpeak Station': 'محطة قمة الصقيع',
    'Cryo Core': 'قلب التجميد',
    'An abandoned arctic research complex clinging to a blizzard-swept peak. Climb the ice shelves and cross the gale pass to the frozen reactor.': 'مجمّع أبحاث قطبي مهجور يتشبّث بقمة تجتاحها العواصف الثلجية. اصعد الرفوف الجليدية وعبر ممر الريح إلى المفاعل المتجمّد.',
    'The storm never stops. Reach the summit and thaw the reactor.': 'العاصفة لا تتوقف. اصعد إلى القمة وأذب المفاعل.',
    'FROST': 'الصقيع', 'STATION': 'المحطة', 'LAB 3': 'المختبر ٣', 'SUMMIT': 'القمة', 'GALE PASS': 'ممر الريح', 'CRYO': 'التجميد', 'DEEP FREEZE': 'تجمّد عميق', 'BLIZZARD!': 'عاصفة ثلجية!',
    'Station Gate Lamp': 'مصباح بوابة المحطة', 'Supply Depot Lamp': 'مصباح مستودع المؤن', 'Summit Lamp': 'مصباح القمة', 'Lab Roof Lamp': 'مصباح سطح المختبر', 'Cryo Gate Lamp': 'مصباح بوابة التجميد', 'Cryo Core Lamp': 'مصباح قلب التجميد',
    'Snow Stalker': 'مطارد الثلج', 'Cryo Trooper': 'جندي التجميد', 'Rime Knight': 'فارس الصقيع', 'Yeti Brute': 'وحش اليتي',
    'Cryo-Matron Glacia': 'سيدة التجميد غلاسيا', 'Warden of the Frozen Reactor': 'حارسة المفاعل المتجمّد',
    'Frozen Reactor Core': 'نواة المفاعل المتجمّدة', 'A coolant core still humming with cold light. The station engineers swore it could not freeze.': 'نواة تبريد ما زالت تطنّ بضوء بارد. أقسم مهندسو المحطة أنها لا تتجمّد.',
    "Glacia's Frost Crown": 'تاج غلاسيا الجليدي', 'A circlet of living ice torn from the Cryo-Matron. The reactor can finally thaw.': 'إكليل من جليد حيّ انتُزع من سيدة التجميد. يمكن للمفاعل أن يذوب أخيرًا.',
    'Break the Garrison': 'حطّم الحامية', 'Cut down the station garrison that still patrols the ice.': 'اقضِ على حامية المحطة التي ما زالت تجوب الجليد.',
    'Defeat Cryo Troopers': 'اهزم جنود التجميد', 'Shatter Rime Knights': 'حطّم فرسان الصقيع',
    'Troopers keep their distance: close in or block the shards. Rime Knights guard until a heavy blow breaks them.': 'الجنود يحافظون على المسافة: اقترب أو صُدّ الشظايا. فرسان الصقيع يحتمون حتى تكسرهم ضربة قوية.',
    'The Frozen Core': 'النواة المتجمّدة', 'Recover the coolant core from the radar spire above the labs.': 'استرجع نواة التبريد من برج الرادار فوق المختبرات.',
    'Take the Frozen Reactor Core': 'خذ نواة المفاعل المتجمّدة', 'The spire stands past the gale pass. The wind pushes against you: jump from shelf to shelf.': 'البرج يقع بعد ممر الريح. الريح تدفعك للخلف: اقفز من رف إلى رف.',
    'Thaw the Reactor': 'أذب المفاعل', 'Defeat Cryo-Matron Glacia in the Cryo Core.': 'اهزم سيدة التجميد غلاسيا في قلب التجميد.',
    'Defeat Cryo-Matron Glacia': 'اهزم سيدة التجميد غلاسيا', 'Dodge the ice rows by jumping between them. Do not stand still in the blizzard. Rest at a lamp first.': 'تفادَ صفوف الجليد بالقفز بينها. لا تقف ساكنًا في العاصفة. استرح عند مصباح أولًا.',
  },
  weapons: WORLD_WEAPONS.frostpeak_station,
  load: () => import('./content').then((m) => m.content),
};
