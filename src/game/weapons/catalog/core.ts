import { defineWeapon, FISTS } from '../define';
import { registerWeapon } from '../registry';

/**
 * Core weapons: the unarmed starting kit plus the six basic family weapons every player can buy from the first world.
 * (World packs bring their own through `WorldPackMeta.weapons`.)
 */
export const CORE_WEAPONS = [
  FISTS,
  defineWeapon({
    id: 'iron_sword', name: 'Iron Sword', category: 'sword', world: 'core', rarity: 'common',
    description: 'A plain, dependable blade. Balanced in speed, damage and reach.',
    ar: { name: 'سيف حديدي', description: 'نصل بسيط يُعتمد عليه. متوازن في السرعة والضرر والمدى.' },
    sources: [{ type: 'shop', price: 120 }], art: { primary: 0xd8dde8, accent: 0x8a6238, variant: 0 },
  }),
  defineWeapon({
    id: 'twin_knives', name: 'Twin Knives', category: 'daggers', world: 'core', rarity: 'common',
    description: 'Two light knives for blistering close-range combos.',
    ar: { name: 'السكينتان', description: 'سكينتان خفيفتان لسلاسل ضربات خاطفة عن قرب.' },
    sources: [{ type: 'shop', price: 140 }], art: { primary: 0xcfd6e6, accent: 0x5a4636, variant: 0 },
  }),
  defineWeapon({
    id: 'hunting_spear', name: 'Hunting Spear', category: 'spear', world: 'core', rarity: 'common',
    description: 'A long ash spear that keeps enemies at the tip.',
    ar: { name: 'رمح الصيد', description: 'رمح طويل من خشب الدلب يُبقي الأعداء عند رأسه.' },
    sources: [{ type: 'shop', price: 170 }], art: { primary: 0xb98a55, accent: 0xdfe5ee, variant: 0 },
  }),
  defineWeapon({
    id: 'woodcutter_axe', name: "Woodcutter's Axe", category: 'axe', world: 'core', rarity: 'common',
    description: 'Slow and heavy. Splits shields as easily as logs.',
    ar: { name: 'فأس الحطّاب', description: 'ثقيل وبطيء. يشقّ الدروع كما يشقّ الأخشاب.' },
    sources: [{ type: 'shop', price: 190 }], art: { primary: 0xaab3c2, accent: 0x7a5530, variant: 0 },
  }),
  defineWeapon({
    id: 'spark_staff', name: 'Spark Staff', category: 'staff', world: 'core', rarity: 'common', element: 'lightning',
    description: 'A copper staff that hurls crackling bolts. Costs energy.',
    ar: { name: 'عصا الشرارة', description: 'عصا نحاسية تقذف صواعق مُتشظّية. تستهلك الطاقة.' },
    sources: [{ type: 'shop', price: 230 }], art: { primary: 0xc98b4a, accent: 0x7ff3ff, glow: 0x7ff3ff, variant: 0 },
  }),
  defineWeapon({
    id: 'iron_maul', name: 'Iron Maul', category: 'hammer', world: 'core', rarity: 'common',
    description: 'A brutal hammer. Slow, but it staggers anything it touches.',
    ar: { name: 'المطرقة الحديدية', description: 'مطرقة وحشية. بطيئة لكنها تُربك كل ما تلمسه.' },
    sources: [{ type: 'shop', price: 250 }], art: { primary: 0x8d96a6, accent: 0x6b4a2b, variant: 0 },
  }),
];

for (const w of CORE_WEAPONS) registerWeapon(w);
