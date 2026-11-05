import type { AttackDef } from '@/shared/types';
import type { BossDef, EnemyDef } from '@/game/config/enemies';
import type { ItemDef } from '@/game/config/items';
import type { QuestDef } from '@/shared/types';
import type { RegionDef } from '@/game/config/regions';
import type { BossMove } from '@/game/config/boss-moves';
import type { WorldPackMeta, WorldTheme } from './types';

/**
 * Leaf module holding every runtime registry. It imports nothing but types, so any module can read these records
 * without import cycles. They are filled by `registry.ts` (pack manifests, at start-up) and `loader.ts` (regions and
 * themes, on demand).
 */
export const WORLD_PACKS: WorldPackMeta[] = [];

export const ENEMIES: Record<string, EnemyDef> = {};
export const BOSSES: Record<string, BossDef> = {};
export const ITEMS: Record<string, ItemDef> = {};
/** Registration order: core items first, then each pack's, in campaign order. */
export const ITEM_ORDER: string[] = [];
export const QUESTS: Record<string, QuestDef> = {};
/** Story order: every pack's quests in campaign order. */
export const QUEST_ORDER: string[] = [];
export const ENEMY_ATTACK_IDS = new Set<string>();

/** Only the packs currently loaded contribute here (see loader.ts). */
export const REGIONS: Record<string, RegionDef> = {};
export const THEMES: Record<string, WorldTheme> = {};
/** Custom boss move scripts by boss id, supplied by a pack's lazy content module. */
export const BOSS_MOVES: Record<string, Record<string, BossMove>> = {};

export type { AttackDef };
