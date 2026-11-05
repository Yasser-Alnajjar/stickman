import { defineWeapon } from '../define';
import type { WeaponDef } from '../types';

/**
 * Weapons that belong to each world pack, keyed by pack id. A pack's manifest passes its list as `weapons`, so adding a
 * world with its own gear never touches the combat engine. Tiers climb with the campaign (see docs/WEAPONS.md):
 * boss reward = the world's headline weapon; chest / quest rewards = one step below; shop weapons unlock as the
 * world they belong to becomes reachable.
 */
export const WORLD_WEAPONS: Record<string, WeaponDef[]> = {
  neon_street: [
    defineWeapon({
      id: 'warden_cleaver', name: "Warden's Cleaver", category: 'axe', world: 'neon_street', rarity: 'uncommon',
      description: 'Torn from the Iron Warden. Its heavy edge breaks any guard.',
      ar: { name: 'ساطور الحارس', description: 'انتُزع من الحارس الحديدي. حدّه الثقيل يكسر أي حراسة.' },
      sources: [{ type: 'boss', boss: 'warden' }], art: { primary: 0xb8c0cc, accent: 0xffd24a, variant: 1 },
    }),
    defineWeapon({
      id: 'gate_stilettos', name: 'Gate Stilettos', category: 'daggers', world: 'neon_street', rarity: 'uncommon',
      description: 'Slim blades left with the keycard. Fast and unforgiving.',
      ar: { name: 'خناجر البوابة', description: 'نصال رفيعة تُركت مع بطاقة المفتاح. سريعة بلا رحمة.' },
      sources: [{ type: 'quest', quest: 'lost_keycard' }], art: { primary: 0xe3e8f2, accent: 0xff5ce1, glow: 0xff5ce1, variant: 1 },
    }),
  ],
  rust_docks: [
    defineWeapon({
      id: 'rust_cutlass', name: 'Rusty Cutlass', category: 'sword', world: 'rust_docks', rarity: 'uncommon', reach: 1.08,
      description: 'A pirate blade, worn but wicked. Slightly longer reach.',
      ar: { name: 'سيف الصدأ', description: 'نصل قرصان متآكل لكنه شرس. مدى أطول قليلًا.' },
      sources: [{ type: 'shop', price: 320 }], art: { primary: 0xb0a090, accent: 0x6b4a2b, variant: 1 },
    }),
    defineWeapon({
      id: 'viper_fangs', name: 'Viper Fangs', category: 'daggers', world: 'rust_docks', rarity: 'uncommon', speed: 1.08,
      description: 'Curved twin daggers that strike like a snake.',
      ar: { name: 'أنياب الأفعى', description: 'خنجران مقوّسان يضربان كالأفعى.' },
      sources: [{ type: 'shop', price: 380 }], art: { primary: 0x7dd68a, accent: 0x2e5b3a, variant: 2 },
    }),
    defineWeapon({
      id: 'anchor_breaker', name: 'Anchor Breaker', category: 'hammer', world: 'rust_docks', rarity: 'uncommon',
      description: "Tyrant Marrow's anchor, reforged into a crushing hammer.",
      ar: { name: 'كاسر المرساة', description: 'مرساة الطاغية مارو أُعيد صهرها مطرقة ساحقة.' },
      sources: [{ type: 'boss', boss: 'marrow' }], art: { primary: 0x7b8798, accent: 0x9a6a3a, variant: 1 },
    }),
    defineWeapon({
      id: 'salvage_blade', name: 'Salvage Blade', category: 'sword', world: 'rust_docks', rarity: 'uncommon', speed: 1.1,
      description: 'A quick blade hidden atop the crane. Fast recovery between cuts.',
      ar: { name: 'نصل الإنقاذ', description: 'نصل سريع مخبّأ فوق الرافعة. استعادة سريعة بين الضربات.' },
      sources: [{ type: 'chest', region: 'docks', pickup: 'dk_chest_crane' }], art: { primary: 0xc7ced9, accent: 0x4aa3a0, variant: 2 },
    }),
  ],
  ember_foundry: [
    defineWeapon({
      id: 'cinder_staff', name: 'Cinder Staff', category: 'staff', world: 'ember_foundry', rarity: 'uncommon', element: 'fire',
      description: 'Hurls fireballs that set enemies alight.',
      ar: { name: 'عصا الجمر', description: 'تقذف كرات نارية تُشعل الأعداء.' },
      sources: [{ type: 'shop', price: 540 }], art: { primary: 0x6b3a2a, accent: 0xff8a3a, glow: 0xff8a3a, variant: 1 },
    }),
    defineWeapon({
      id: 'emberbrand', name: 'Emberbrand', category: 'sword', world: 'ember_foundry', rarity: 'rare', element: 'fire',
      description: "Empress Ignis's blade. Every cut leaves a burn.",
      ar: { name: 'جمر السيف', description: 'نصل الإمبراطورة إغنيس. كل ضربة تترك حرقًا.' },
      sources: [{ type: 'boss', boss: 'ignis' }], art: { primary: 0xffb36b, accent: 0xff4d2a, glow: 0xff7a1a, variant: 2 },
    }),
    defineWeapon({
      id: 'forge_hammer', name: "Forgemaster's Hammer", category: 'hammer', world: 'ember_foundry', rarity: 'rare', reach: 1.1,
      description: 'The tool that built the foundry. Wider, harder blows.',
      ar: { name: 'مطرقة سيّد الأتون', description: 'الأداة التي بنت المسبك. ضربات أوسع وأقوى.' },
      sources: [{ type: 'quest', quest: 'foundry_purge' }], art: { primary: 0x9aa4b4, accent: 0xff7a1a, glow: 0xff7a1a, variant: 2 },
    }),
  ],
  jade_ruins: [
    defineWeapon({
      id: 'jade_saber', name: 'Jade Saber', category: 'sword', world: 'jade_ruins', rarity: 'rare', speed: 1.1,
      description: 'A curved jade blade, light and keen.',
      ar: { name: 'سيف اليشم', description: 'نصل يشمي مقوّس، خفيف وحاد.' },
      sources: [{ type: 'shop', price: 780 }], art: { primary: 0x6fd3a0, accent: 0xe6b94f, variant: 1 },
    }),
    defineWeapon({
      id: 'jade_glaive', name: 'Jade Glaive', category: 'spear', world: 'jade_ruins', rarity: 'rare', reach: 1.12,
      description: "Idol-King Azcal's glaive. Reaches farther than any spear before it.",
      ar: { name: 'رمح اليشم', description: 'رمح ملك التماثيل أزكال. مداه أبعد من أي رمح قبله.' },
      sources: [{ type: 'boss', boss: 'azcal' }], art: { primary: 0x5fae8a, accent: 0xe6b94f, glow: 0x7dffd0, variant: 1 },
    }),
    defineWeapon({
      id: 'shrine_wand', name: 'Shrine Wand', category: 'staff', world: 'jade_ruins', rarity: 'rare', element: 'lightning',
      description: 'A wand from the hidden shrine. Its bolts shock and stagger.',
      ar: { name: 'عصا المزار', description: 'عصا من المزار الخفي. صواعقها تصعق وتُربك.' },
      sources: [{ type: 'chest', region: 'jade_ruins', pickup: 'chest_shrine' }], art: { primary: 0x5fae8a, accent: 0x7dffd0, glow: 0x7dffd0, variant: 2 },
    }),
  ],
  frostpeak_station: [
    defineWeapon({
      id: 'glacier_axe', name: 'Glacier Axe', category: 'axe', world: 'frostpeak_station', rarity: 'rare', element: 'ice',
      description: 'Frozen steel that chills and staggers.',
      ar: { name: 'فأس الجليد', description: 'فولاذ متجمّد يُبرّد الأعداء ويُربكهم.' },
      sources: [{ type: 'shop', price: 1050 }], art: { primary: 0xbfe9ff, accent: 0x5c9dff, glow: 0x9fe4ff, variant: 2 },
    }),
    defineWeapon({
      id: 'frostbite_fangs', name: 'Frostbite Fangs', category: 'daggers', world: 'frostpeak_station', rarity: 'rare', element: 'ice',
      description: "Cryo-Matron Glacia's twin fangs. Each flurry chills.",
      ar: { name: 'أنياب الصقيع', description: 'نابا الأم المتجمدة غلاسيا. كل وابل يُبرّد.' },
      sources: [{ type: 'boss', boss: 'glacia' }], art: { primary: 0xcdf1ff, accent: 0x5c9dff, glow: 0x9fe4ff, variant: 2 },
    }),
    defineWeapon({
      id: 'frost_staff', name: 'Frostglass Staff', category: 'staff', world: 'frostpeak_station', rarity: 'rare', element: 'ice',
      description: 'A staff cut from reactor ice. Its bolts freeze enemies in place.',
      ar: { name: 'عصا زجاج الصقيع', description: 'عصا منحوتة من جليد المفاعل. صواعقها تجمّد الأعداء.' },
      sources: [{ type: 'quest', quest: 'frozen_core' }], art: { primary: 0xa4dcf5, accent: 0xffffff, glow: 0x9fe4ff, variant: 0 },
    }),
  ],
  dune_kingdom: [
    defineWeapon({
      id: 'khopesh_of_ra', name: 'Khopesh of Ra', category: 'sword', world: 'dune_kingdom', rarity: 'epic', element: 'fire',
      description: 'A sickle-sword that burns like the noon sun.',
      ar: { name: 'خوبيش رع', description: 'سيف منجلي يلتهب كشمس الظهيرة.' },
      sources: [{ type: 'shop', price: 1800 }], art: { primary: 0xf0c25a, accent: 0xff7a1a, glow: 0xffd24a, variant: 2 },
    }),
    defineWeapon({
      id: 'scarab_scepter', name: 'Scarab Scepter', category: 'staff', world: 'dune_kingdom', rarity: 'epic', element: 'fire',
      description: "Sand Sovereign Khamsin's scepter. Its nova scorches the whole battlefield.",
      ar: { name: 'صولجان الجعران', description: 'صولجان سيّد الرمال خمسين. نوفاه تحرق ساحة المعركة كلها.' },
      sources: [{ type: 'boss', boss: 'khamsin' }], art: { primary: 0xe6b94f, accent: 0x3fe0b0, glow: 0xffb347, variant: 1 },
    }),
    defineWeapon({
      id: 'tomb_axe', name: 'Tomb Axe', category: 'axe', world: 'dune_kingdom', rarity: 'rare',
      description: 'A heavy bronze axe sealed in the lower tomb.',
      ar: { name: 'فأس المقبرة', description: 'فأس برونزي ثقيل مختوم في المقبرة السفلى.' },
      sources: [{ type: 'chest', region: 'dune_kingdom', pickup: 'chest_tomb2' }], art: { primary: 0xd6a35a, accent: 0x3fe0b0, variant: 1 },
    }),
  ],
  helios_ring: [
    defineWeapon({
      id: 'aegis_halberd', name: 'Aegis Halberd', category: 'spear', world: 'helios_ring', rarity: 'epic', element: 'lightning',
      description: "Overseer AEGIS-9's halberd. Thrusts crackle with charge.",
      ar: { name: 'حربة إيجيس', description: 'حربة المشرف إيجيس-9. طعناتها تتوهج بالشحنة.' },
      sources: [{ type: 'boss', boss: 'aegis' }], art: { primary: 0xd9e4ff, accent: 0x7ff3ff, glow: 0x7ff3ff, variant: 2 },
    }),
    defineWeapon({
      id: 'plasma_edge', name: 'Plasma Edge', category: 'sword', world: 'helios_ring', rarity: 'epic', element: 'lightning', speed: 1.1,
      description: 'A reactor cell turned into a humming blade of plasma.',
      ar: { name: 'حافة البلازما', description: 'خلية مفاعل تحوّلت إلى نصل بلازما طنّان.' },
      sources: [{ type: 'quest', quest: 'reactor_cell' }], art: { primary: 0x9bf3ff, accent: 0xffffff, glow: 0x7ff3ff, variant: 0 },
    }),
  ],
  hollow_wood: [
    defineWeapon({
      id: 'gravebreaker', name: 'Gravebreaker', category: 'hammer', world: 'hollow_wood', rarity: 'epic',
      description: 'A cursed hammer that cracks open the earth.',
      ar: { name: 'كاسر القبور', description: 'مطرقة ملعونة تشقّ الأرض.' },
      sources: [{ type: 'shop', price: 2300 }], art: { primary: 0x6c6a8a, accent: 0xb06bff, glow: 0xb06bff, variant: 0 },
    }),
    defineWeapon({
      id: 'nightshade_blades', name: 'Nightshade Blades', category: 'daggers', world: 'hollow_wood', rarity: 'epic', speed: 1.15, comboGain: 0.14,
      description: "Countess Mordaine's blades. The longer the flurry, the deadlier it gets.",
      ar: { name: 'نصال البلادونا', description: 'نصال الكونتيسة موردين. كلما طال الوابل زاد فتكه.' },
      sources: [{ type: 'boss', boss: 'mordaine' }], art: { primary: 0xb06bff, accent: 0x2a1b3d, glow: 0xb06bff, variant: 2 },
    }),
    defineWeapon({
      id: 'bone_pike', name: 'Bone Pike', category: 'spear', world: 'hollow_wood', rarity: 'epic', reach: 1.1,
      description: 'A pike of ancient bone from the wall. Long and cruel.',
      ar: { name: 'رمح العظم', description: 'رمح من عظم قديم من السور. طويل وقاسٍ.' },
      sources: [{ type: 'chest', region: 'hollow_wood', pickup: 'chest_wall' }], art: { primary: 0xe8e2cf, accent: 0x6a6552, variant: 0 },
    }),
  ],
  cogwork_depths: [
    defineWeapon({
      id: 'starfall_staff', name: 'Starfall Staff', category: 'staff', world: 'cogwork_depths', rarity: 'legendary', element: 'lightning',
      description: 'A staff of captured starlight. Its nova is legendary.',
      ar: { name: 'عصا النجم الساقط', description: 'عصا من ضوء نجم أسير. نوفاها أسطورية.' },
      sources: [{ type: 'shop', price: 3800 }], art: { primary: 0xfff1b0, accent: 0x7ff3ff, glow: 0xfff1b0, variant: 2 },
    }),
    defineWeapon({
      id: 'escapement_maul', name: 'Escapement Maul', category: 'hammer', world: 'cogwork_depths', rarity: 'epic', speed: 1.1,
      description: "Clockmaster Horol's mainspring maul. Strikes with perfect timing.",
      ar: { name: 'مطرقة المحرّك', description: 'مطرقة زنبرك هورول. تضرب بتوقيت مثالي.' },
      sources: [{ type: 'boss', boss: 'horol' }], art: { primary: 0xc9a25a, accent: 0x6b4a2b, glow: 0xffd24a, variant: 2 },
    }),
    defineWeapon({
      id: 'cog_cleaver', name: 'Cog Cleaver', category: 'axe', world: 'cogwork_depths', rarity: 'epic',
      description: 'A toothed axe forged from the master cog.',
      ar: { name: 'ساطور الترس', description: 'فأس مسنّن مصنوع من الترس الرئيسي.' },
      sources: [{ type: 'quest', quest: 'master_cog' }], art: { primary: 0xb98a55, accent: 0xffd24a, variant: 2 },
    }),
  ],
  aether_citadel: [
    defineWeapon({
      id: 'worldsplitter', name: 'Worldsplitter', category: 'axe', world: 'aether_citadel', rarity: 'legendary',
      description: 'An axe said to have cleaved a sky in two.',
      ar: { name: 'شاقّ العالم', description: 'فأس يُقال إنه شقّ السماء نصفين.' },
      sources: [{ type: 'shop', price: 5000 }], art: { primary: 0xcfe0ff, accent: 0xb06bff, glow: 0xb06bff, variant: 2 },
    }),
    defineWeapon({
      id: 'stormbreaker', name: 'Stormbreaker', category: 'sword', world: 'aether_citadel', rarity: 'legendary', element: 'lightning',
      description: "Storm Sovereign Zephyros's blade. It carries the storm in every cut.",
      ar: { name: 'كاسر العواصف', description: 'نصل سيّد العواصف زفيروس. يحمل العاصفة في كل ضربة.' },
      sources: [{ type: 'boss', boss: 'zephyros' }], art: { primary: 0xe6f4ff, accent: 0x7ff3ff, glow: 0x7ff3ff, variant: 2 },
    }),
    defineWeapon({
      id: 'gale_hammer', name: 'Gale Hammer', category: 'hammer', world: 'aether_citadel', rarity: 'epic', element: 'ice',
      description: 'A hammer wrapped in cold wind from the mill island.',
      ar: { name: 'مطرقة العاصفة', description: 'مطرقة تلفّها رياح باردة من جزيرة الطاحونة.' },
      sources: [{ type: 'chest', region: 'aether_citadel', pickup: 'chest_mill' }], art: { primary: 0xbfe9ff, accent: 0x5c9dff, glow: 0x9fe4ff, variant: 1 },
    }),
  ],
};
