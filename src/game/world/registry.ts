import { ENEMY_ATTACKS, bossSet } from '@/game/config/attacks';
import { ACCESSORIES, fromSpec } from '@/game/animations/accessories';
import { registerTranslations } from '@/i18n';
import { BOSSES, ENEMIES, ITEMS, ITEM_ORDER, QUESTS, QUEST_ORDER, WORLD_PACKS } from './stores';
import { registerWeapon } from '@/game/weapons/registry';
import '@/game/weapons/catalog/core';
import type { WorldPackMeta } from './types';

/**
 * Registers a pack's data-only manifest: boss, enemies, attacks, items, quests, accessories, translations.
 * Runs once per pack at start-up; it never touches regions or themes (those load on demand, see loader.ts).
 * Throws on any duplicate id so two worlds can never silently shadow each other.
 */
export function registerPack(pack: WorldPackMeta): void {
  const dupe = (what: string, id: string): never => { throw new Error(`World pack "${pack.id}": duplicate ${what} "${id}"`); };
  if (WORLD_PACKS.some((p) => p.id === pack.id)) dupe('pack', pack.id);

  for (const [kind, def] of Object.entries(pack.enemies ?? {})) {
    if (ENEMIES[kind] || kind === 'boss') dupe('enemy', kind);
    ENEMIES[kind] = def;
  }
  for (const [id, def] of Object.entries(pack.enemyAttacks ?? {})) {
    if (ENEMY_ATTACKS[id]) dupe('attack', id);
    ENEMY_ATTACKS[id] = def;
  }
  const boss = pack.boss;
  if (BOSSES[boss.id]) dupe('boss', boss.id);
  BOSSES[boss.id] = boss;
  if (pack.bossAttacks) bossSet(boss.prefix, pack.bossAttacks.scale, pack.bossAttacks.extras, pack.bossAttacks.tune);
  for (const item of pack.items ?? []) {
    if (ITEMS[item.id]) dupe('item', item.id);
    ITEMS[item.id] = item;
    ITEM_ORDER.push(item.id);
  }
  for (const w of pack.weapons ?? []) registerWeapon(w);
  for (const q of pack.quests ?? []) {
    if (QUESTS[q.id]) dupe('quest', q.id);
    QUESTS[q.id] = q;
    QUEST_ORDER.push(q.id);
  }
  for (const [id, spec] of Object.entries(pack.accessories ?? {})) {
    if (ACCESSORIES[id]) dupe('accessory', id);
    ACCESSORIES[id] = fromSpec(spec);
  }
  if (pack.text) registerTranslations('ar', pack.text);
  WORLD_PACKS.push(pack);
}

/** Region ids of every registered pack, in campaign order (city, arena, city, arena...). Needs no loading. */
export function allRegionIds(): string[] {
  return WORLD_PACKS.flatMap((p) => [p.cityRegion, p.arenaRegion]);
}

export function packOfRegion(regionId: string): WorldPackMeta | undefined {
  return WORLD_PACKS.find((p) => p.cityRegion === regionId || p.arenaRegion === regionId);
}

export function packIndex(packId: string): number {
  return WORLD_PACKS.findIndex((p) => p.id === packId);
}
