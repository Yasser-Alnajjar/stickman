import type { WorldPackMeta } from '../../types';
import { atk, enemy } from '../enemy-kit';

/** Aether Citadel (world 10, the finale): manifest (data only). */
export const aetherManifest: WorldPackMeta = {
  id: 'aether_citadel',
  name: 'Aether Citadel',
  description: 'A kingdom of floating isles and marble spires above a sea of cloud, where the wind itself is a weapon. The last stronghold of the Storm Sovereign.',
  tagline: 'The last climb. The wind is not on your side.',
  doorLabel: 'AETHER',
  cityRegion: 'aether_city',
  arenaRegion: 'zephyros_arena',
  cityTheme: 'aether',
  arenaTheme: 'arena_zephyros',

  enemies: {
    gale_sprite: enemy('gale_sprite', 'Gale Sprite', 'assassin', {
      maxHealth: 180, attack: 24, xp: 230, gold: 34, chaseSpeed: 380, dodgeChance: 0.6,
      attacks: [{ id: 'ac_sprite_slash', weight: 3 }, { id: 'ac_sprite_gust', weight: 2, minRange: 170 }],
      style: { color: 0xcfe6ff, lineWidth: 3.6, scale: 1.02, accessory: 'sprite_wings', accent: 0xff9ec0, headRadius: 9 },
    }),
    cloud_knight: enemy('cloud_knight', 'Cloud Knight', 'guard', {
      maxHealth: 470, attack: 25, xp: 250, gold: 36, guard: 0.9,
      attacks: [{ id: 'ac_knight_lance', weight: 3 }, { id: 'ac_knight_slam', weight: 2 }],
      style: { color: 0xf1ead8, lineWidth: 7.5, scale: 1.24, accessory: 'cloud_armor', accent: 0xf0c05a, headRadius: 10 },
    }),
    storm_archer: enemy('storm_archer', 'Storm Archer', 'shooter', {
      maxHealth: 150, attack: 24, xp: 220, gold: 32, attackCooldown: 1200, chaseSpeed: 170,
      attacks: [{ id: 'ac_archer_bolt', weight: 1 }],
      ranged: { attackId: 'ac_archer_bolt', keepAway: 360, range: 760, speed: 860, color: 0xfff6a0 },
      style: { color: 0xb9a8ee, lineWidth: 4, scale: 1.04, accessory: 'storm_hood', accent: 0xfff6a0, headRadius: 9 },
    }),
    thunder_golem: enemy('thunder_golem', 'Thunder Golem', 'brute', {
      maxHealth: 720, attack: 28, xp: 280, gold: 42,
      attacks: [{ id: 'ac_golem_slam', weight: 2 }, { id: 'ac_golem_clap', weight: 2 }],
      style: { color: 0x8a7ad0, lineWidth: 13.5, scale: 1.56, accessory: 'thunder_core', accent: 0xfff6a0, headRadius: 10 },
    }),
  },
  enemyAttacks: {
    ac_sprite_slash: atk('ac_sprite_slash', 'Wind Slash', { damage: 14, hitbox: { w: 92, h: 54, ox: 58, oy: -6 }, startup: 150, active: 80, recovery: 80, knockback: { x: 170, y: -40 }, hitStun: 220, chain: 'ac_sprite_slash2' }),
    ac_sprite_slash2: atk('ac_sprite_slash2', 'Cyclone Cut', { damage: 22, hitbox: { w: 106, h: 62, ox: 64, oy: -4 }, startup: 170, active: 100, recovery: 480, knockback: { x: 420, y: -160 }, hitStun: 380, anim: 'kick', sfx: 'kick', telegraph: true }),
    ac_sprite_gust: atk('ac_sprite_gust', 'Gust Dive', { damage: 26, hitbox: { w: 122, h: 62, ox: 70, oy: -8 }, startup: 320, active: 150, recovery: 640, knockback: { x: 460, y: -160 }, hitStun: 420, anim: 'dash_attack', sfx: 'heavy', lunge: 960, telegraph: true }),
    ac_knight_lance: atk('ac_knight_lance', 'Sky Lance', { damage: 24, hitbox: { w: 150, h: 48, ox: 86, oy: -10 }, startup: 520, active: 110, recovery: 560, knockback: { x: 520, y: -140 }, anim: 'punch2', sfx: 'heavy', telegraph: true, lunge: 300 }),
    ac_knight_slam: atk('ac_knight_slam', 'Marble Slam', { damage: 34, hitbox: { w: 116, h: 104, ox: 66, oy: -14 }, startup: 640, active: 120, recovery: 700, knockback: { x: 620, y: -300 }, hitStun: 540, hitStop: 110, shake: 0.008, anim: 'heavy', sfx: 'heavy', telegraph: true, superArmor: true }),
    ac_archer_bolt: atk('ac_archer_bolt', 'Thunder Bolt', { damage: 24, hitbox: { w: 1, h: 1, ox: -5000, oy: 0 }, startup: 380, active: 60, recovery: 200, knockback: { x: 280, y: -80 }, telegraph: true }),
    ac_golem_slam: atk('ac_golem_slam', 'Thunder Slam', { damage: 46, hitbox: { w: 180, h: 116, ox: 90, oy: -18 }, startup: 820, active: 150, recovery: 860, knockback: { x: 720, y: -420 }, hitStun: 600, hitStop: 130, shake: 0.014, anim: 'slam', sfx: 'slam', telegraph: true, superArmor: true }),
    ac_golem_clap: atk('ac_golem_clap', 'Thunderclap', { damage: 32, hitbox: { w: 160, h: 86, ox: 82, oy: -10 }, startup: 520, active: 110, recovery: 620, knockback: { x: 560, y: -180 }, anim: 'heavy', sfx: 'zap', telegraph: true, superArmor: true }),
  },

  boss: {
    id: 'zephyros', name: 'Storm Sovereign Zephyros', subtitle: 'Sovereign of the Aether Citadel', prefix: 'zephyros',
    maxHealth: 3700, attack: 26, defense: 12, width: 56, height: 180, walkSpeed: 138, xp: 6500, gold: 2000,
    drop: 'storm_crown', phaseThresholds: [0.68, 0.34],
    patterns: [
      { id: 'combo', weight: 2 }, { id: 'lightning_strikes', weight: 3 }, { id: 'storm_orbs', weight: 3 }, { id: 'gale_blades', weight: 3 },
      { id: 'sky_dive', weight: 3, from: 2 }, { id: 'tempest', weight: 3, from: 3 }, { id: 'leap', weight: 1, from: 3 },
    ],
    summon: { phase: 3, kinds: ['storm_archer', 'gale_sprite'] },
    tempo: [1, 0.82, 0.66],
    style: { color: 0xfff0d0, lineWidth: 9.5, scale: 2.0, accessory: 'zephyros_wings', accent: 0xfff6a0, headRadius: 11 },
    eye: 0xfff6a0,
    aura: { color: 0xfff6a0, r: 165 },
  },
  bossAttacks: {
    scale: 2.8,
    extras: {
      bolt: { damage: 28, knockback: { x: 300, y: -520 }, hitStun: 620 },
      feather: { damage: 15, knockback: { x: 320, y: -180 }, hitStun: 380 },
      dive: { damage: 42, knockback: { x: 640, y: -560 }, hitStun: 760 },
      gust_wave: { damage: 20, knockback: { x: 500, y: -260 }, hitStun: 480 },
      orb: { damage: 26, knockback: { x: 520, y: -300 }, hitStun: 560 },
    },
  },

  items: [
    { id: 'aether_prism', name: 'Aether Prism', description: 'A shard of pure sky-glass that splits light into every colour. The wind bends around it.', icon: '🔷', usable: false },
    { id: 'storm_crown', name: 'Storm Crown', description: 'The crown of the Storm Sovereign. The sky is calm, and the whole world can see the sun.', icon: '⚡', usable: false },
  ],
  quests: [
    {
      id: 'aether_purge', title: 'Clear the Sky Road', world: 'aether_citadel',
      summary: "Cut down the Sovereign's skyguard on the terraces and bridges.",
      objectives: [{ type: 'kill', target: 'storm_archer', count: 5, label: 'Defeat Storm Archers' }, { type: 'kill', target: 'cloud_knight', count: 4, label: 'Break Cloud Knights' }],
      reward: { xp: 5200, gold: 520, items: { health_tonic: 5, energy_cell: 4 } },
      hint: 'Archers shoot fast bolts: weave or block. Cloud Knights guard until a heavy blow breaks them. Use the tailwind.',
    },
    {
      id: 'aether_prism', title: 'The Aether Prism', world: 'aether_citadel',
      summary: 'Climb the sky tower and take the prism from its crown.',
      objectives: [{ type: 'collect', target: 'aether_prism', count: 1, label: 'Take the Aether Prism' }],
      reward: { xp: 4400, items: { energy_cell: 4 } },
      hint: 'The tower stands past the windmills. Ride the tailwind up the cloud steps; fight the headwind with short jumps.',
    },
    {
      id: 'defeat_zephyros', title: 'Calm the Storm', world: 'aether_citadel',
      summary: 'Defeat Storm Sovereign Zephyros on the Tempest Throne and end the campaign.',
      objectives: [{ type: 'boss', target: 'zephyros', count: 1, label: 'Defeat Storm Sovereign Zephyros' }],
      reward: { xp: 6500, gold: 2000 },
      hint: 'Leave the marked columns, jump the orbs, and brace against the gale. In the last phase the storm never stops: keep moving. Rest at a lamp first.',
    },
  ],
  accessories: {
    sprite_wings: {
      parts: [
        { t: 'tri', at: 'sho', c: 0xcfe6ff, a: 0.75, layer: 'back', p: [-2, 0, -6, 4, -34, -14], sway: 5 },
        { t: 'tri', at: 'sho', c: 0xff9ec0, a: 0.6, layer: 'back', p: [-2, 4, -6, 8, -28, 14], sway: 5 },
        { t: 'tri', at: 'head', c: 'accent', p: [-9, -7, 9, -7, 0, -20] },
        { t: 'rect', at: 'head', c: 'dark', p: [-1, -5, 9, 3] },
      ],
    },
    cloud_armor: {
      parts: [
        { t: 'rect', at: 'head', c: 'dark', p: [-11, -11, 22, 12] },
        { t: 'tri', at: 'head', c: 'accent', p: [-5, -10, 5, -10, 0, -30] },
        { t: 'tri', at: 'head', c: 0xffffff, layer: 'back', p: [-8, -4, -8, 6, -32, 6], sway: 4 },
        { t: 'circle', at: 'sho', c: 'light', p: [-9, 2, 10] },
        { t: 'line', at: 'handA', c: 'accent', p: [0, -4, 58, -4], w: 4 },
        { t: 'rect', at: 'sho', c: 'accent', p: [10, -6, 8, 40] },
      ],
    },
    storm_hood: {
      parts: [
        { t: 'tri', at: 'head', c: 'dark', p: [-12, 4, 12, 4, -2, -18] },
        { t: 'rect', at: 'head', c: 'accent', p: [0, -4, 10, 3] },
        { t: 'line', at: 'handA', c: 'accent', p: [10, -28, 16, 0], w: 3 },
        { t: 'line', at: 'handA', c: 'accent', p: [16, 0, 10, 28], w: 3 },
        { t: 'tri', at: 'sho', c: 'dark', layer: 'back', p: [-2, 0, -2, 12, -22, 34], sway: 5 },
      ],
    },
    thunder_core: {
      torsoMul: 1.6,
      parts: [
        { t: 'circle', at: 'sho', c: 'dark', p: [-22, 2, 12] },
        { t: 'circle', at: 'sho', c: 'dark', p: [22, 2, 12] },
        { t: 'circle', at: 'sho', c: 'accent', a: 0.95, p: [0, 12, 8] },
        { t: 'tri', at: 'head', c: 'accent', p: [-10, -9, -4, -9, -9, -26] },
        { t: 'tri', at: 'head', c: 'accent', p: [4, -9, 10, -9, 9, -26] },
        { t: 'rect', at: 'hip', c: 'accent', p: [-16, -3, 32, 5] },
      ],
    },
    zephyros_wings: {
      eye: 0xfff6a0,
      parts: [
        { t: 'circle', at: 'head', c: 0xfff6a0, a: 0.28, layer: 'back', p: [0, -2, 24] },
        { t: 'tri', at: 'sho', c: 0xffffff, a: 0.95, layer: 'back', p: [-3, -4, -6, 6, -64, -44], sway: 8 },
        { t: 'tri', at: 'sho', c: 0xcfe6ff, a: 0.9, layer: 'back', p: [-3, 2, -6, 10, -74, -6], sway: 8 },
        { t: 'tri', at: 'sho', c: 0xffffff, a: 0.85, layer: 'back', p: [-3, 8, -6, 14, -58, 30], sway: 8 },
        { t: 'tri', at: 'sho', c: 0xffffff, a: 0.95, p: [3, -4, 6, 6, 64, -44], sway: 8 },
        { t: 'tri', at: 'sho', c: 0xcfe6ff, a: 0.9, p: [3, 2, 6, 10, 74, -6], sway: 8 },
        { t: 'rect', at: 'head', c: 0xf0c05a, p: [-12, -10, 24, 5] },
        { t: 'tri', at: 'head', c: 0xfff6a0, p: [-12, -10, -6, -10, -10, -34] },
        { t: 'tri', at: 'head', c: 0xf0c05a, p: [-5, -10, 1, -10, -2, -42] },
        { t: 'tri', at: 'head', c: 0xfff6a0, p: [2, -10, 8, -10, 6, -42] },
        { t: 'tri', at: 'head', c: 0xf0c05a, p: [8, -10, 14, -10, 14, -34] },
        { t: 'circle', at: 'sho', c: 0xf0c05a, p: [-12, 4, 10] },
        { t: 'circle', at: 'sho', c: 0xf0c05a, p: [12, 4, 10] },
        { t: 'circle', at: 'sho', c: 0xfff6a0, a: 0.95, p: [0, 14, 6] },
        { t: 'tri', at: 'hip', c: 0xcfe6ff, a: 0.85, layer: 'back', p: [-8, 0, 8, 0, 0, 36], sway: 6 },
      ],
    },
  },

  text: {
    'Aether Citadel': 'قلعة الأثير',
    'Tempest Throne': 'عرش العاصفة',
    'A kingdom of floating isles and marble spires above a sea of cloud, where the wind itself is a weapon. The last stronghold of the Storm Sovereign.': 'مملكة من الجزر العائمة وأبراج الرخام فوق بحر من الغيوم، حيث الريح نفسها سلاح. المعقل الأخير لسلطان العاصفة.',
    'The last climb. The wind is not on your side.': 'التسلق الأخير. الريح ليست في صفك.',
    'AETHER': 'الأثير', 'CLOUD STAIRS': 'درج الغيوم', 'WINDMILLS': 'طواحين الهواء', 'SKY TOWER': 'برج السماء', 'BRIDGES': 'الجسور', 'CITADEL': 'القلعة', 'THRONE': 'العرش', 'THE STORM BREAKS': 'العاصفة تنفجر', 'GALE FORCE': 'ريح عاتية', 'TEMPEST': 'الإعصار',
    'Cloud Gate Lamp': 'مصباح بوابة الغيوم', 'Windmill Lamp': 'مصباح الطاحونة', 'Sky Tower Lamp': 'مصباح برج السماء', 'Bridge Lamp': 'مصباح الجسر', 'Citadel Lamp': 'مصباح القلعة', 'Tempest Throne Lamp': 'مصباح عرش العاصفة',
    'Gale Sprite': 'جنّي الريح', 'Cloud Knight': 'فارس الغيوم', 'Storm Archer': 'رامي العاصفة', 'Thunder Golem': 'عملاق الرعد',
    'Storm Sovereign Zephyros': 'سلطان العاصفة زفيروس', 'Sovereign of the Aether Citadel': 'سيّد قلعة الأثير',
    'Aether Prism': 'منشور الأثير', 'A shard of pure sky-glass that splits light into every colour. The wind bends around it.': 'شظية من زجاج السماء الخالص تفلق الضوء إلى كل لون. الريح تنحني حولها.',
    'Storm Crown': 'تاج العاصفة', 'The crown of the Storm Sovereign. The sky is calm, and the whole world can see the sun.': 'تاج سلطان العاصفة. السماء هادئة، والعالم كله يرى الشمس.',
    'Clear the Sky Road': 'طهّر طريق السماء', "Cut down the Sovereign's skyguard on the terraces and bridges.": 'اقضِ على حرس السلطان في الشرفات والجسور.',
    'Defeat Storm Archers': 'اهزم رماة العاصفة', 'Break Cloud Knights': 'حطّم فرسان الغيوم',
    'Archers shoot fast bolts: weave or block. Cloud Knights guard until a heavy blow breaks them. Use the tailwind.': 'الرماة يطلقون صواعق سريعة: راوغ أو صُدّ. فرسان الغيوم يحتمون حتى تكسرهم ضربة قوية. استفد من الريح الخلفية.',
    'The Aether Prism': 'منشور الأثير', 'Climb the sky tower and take the prism from its crown.': 'اصعد برج السماء وخذ المنشور من قمته.',
    'Take the Aether Prism': 'خذ منشور الأثير', 'The tower stands past the windmills. Ride the tailwind up the cloud steps; fight the headwind with short jumps.': 'البرج بعد الطواحين. اركب الريح الخلفية على درج الغيوم، وقاوم الريح المعاكسة بقفزات قصيرة.',
    'Calm the Storm': 'اهدئ العاصفة', 'Defeat Storm Sovereign Zephyros on the Tempest Throne and end the campaign.': 'اهزم سلطان العاصفة زفيروس على عرش العاصفة وأنهِ الحملة.',
    'Defeat Storm Sovereign Zephyros': 'اهزم سلطان العاصفة زفيروس', 'Leave the marked columns, jump the orbs, and brace against the gale. In the last phase the storm never stops: keep moving. Rest at a lamp first.': 'اترك الأعمدة المعلَّمة، واقفز فوق الكرات، وقاوم الريح. في المرحلة الأخيرة لا تهدأ العاصفة: ابقَ متحركًا. استرح عند مصباح أولًا.',
  },
  load: () => import('./content').then((m) => m.content),
};
