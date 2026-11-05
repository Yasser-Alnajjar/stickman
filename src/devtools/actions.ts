import type { BossId, RegionId } from '@/shared/types';
import { REGIONS, stageOrder } from '@/game/config/regions';
import { BOSSES, WORLD_PACKS } from '@/game/world/stores';
import { collectedKey } from '@/persistence/legacy-v1';
import { gameApi } from '@/game/managers/game-api';
import { runtime } from '@/game/managers/runtime';
import { session } from '@/game/managers/session';
import { saveManager } from '@/persistence/save-manager';
import { devFlags } from './flags';
import { WEAPONS, WEAPON_ORDER } from '@/game/weapons/registry';

/** Stages in campaign order, derived from the world packs. */
export const STAGE_ORDER: RegionId[] = stageOrder();
export const CITIES: RegionId[] = WORLD_PACKS.map((p) => p.cityRegion);
export const BOSS_STAGE: Record<BossId, RegionId> = Object.fromEntries(WORLD_PACKS.map((p) => [p.boss.id, p.arenaRegion]));

/** x inside the arena's boss trigger zone; spawning here starts the fight immediately. */
const FIGHT_X = 640;
const GROUND = 960;

/**
 * Detaches the in-memory session from the stored save. Everything the developer does afterwards happens to a
 * disposable profile: `session.save` becomes a no-op, and "Exit sandbox" reloads the page so the untouched save wins.
 */
export function ensureSandbox(): void {
  if (devFlags.sandbox) return;
  devFlags.sandbox = true;
  if (!runtime.world) session.reset(); // nothing running yet: start from a clean disposable profile
}

export function stageName(id: RegionId | undefined): string {
  if (!id) return '-';
  return REGIONS[id]?.name ?? WORLD_PACKS.find((p) => p.cityRegion === id)?.name ?? id;
}

export function goTo(region: RegionId, spawn?: string | { x: number; y: number }): void {
  ensureSandbox();
  void gameApi.startWorld({ region, spawn: spawn ?? 'entry' });
}

export function stepStage(delta: 1 | -1): void {
  const cur = STAGE_ORDER.indexOf(runtime.world?.region.id ?? STAGE_ORDER[0]);
  goTo(STAGE_ORDER[Math.min(STAGE_ORDER.length - 1, Math.max(0, cur + delta))]);
}

/** Enters the arena at the trigger line with the boss alive, so the fight begins at once. */
export function fightBoss(id: BossId): void {
  ensureSandbox();
  const p = session.profile;
  p.defeatedBosses = p.defeatedBosses.filter((b) => b !== id);
  delete p.flags[`${id}_defeated`];
  goTo(BOSS_STAGE[id], { x: FIGHT_X, y: GROUND });
}

export function defeatBossNow(): boolean {
  const b = runtime.world?.boss;
  if (!b || !b.alive) return false;
  ensureSandbox();
  (b as unknown as { die(): void }).die();
  return true;
}

/** Forgets every kill (and uncollects chests) of one region so its encounters can be replayed. */
function clearRegionProgress(id: RegionId, includeBoss: boolean): void {
  const p = session.profile;
  p.killedEnemies = p.killedEnemies.filter((k) => !k.startsWith(`${id}:`));
  const keys = new Set(REGIONS[id].pickups.map((x) => collectedKey(id, x.id)));
  p.collected = p.collected.filter((c) => !keys.has(c));
  const boss = REGIONS[id].boss?.id;
  if (includeBoss && boss) {
    p.defeatedBosses = p.defeatedBosses.filter((b) => b !== boss);
    delete p.flags[`${boss}_defeated`];
  }
}

/** Restarts the current stage at the player's position with its enemies alive again (boss untouched). */
export function resetKills(): void {
  const w = runtime.world;
  if (!w) return;
  ensureSandbox();
  clearRegionProgress(w.region.id, false);
  void gameApi.startWorld({ region: w.region.id, spawn: { x: w.player.cx, y: w.player.feetY - 2 } });
}

/** Full stage reset: enemies, chests and the boss are restored and the stage restarts from its entrance. */
export function resetStage(): void {
  const w = runtime.world;
  if (!w) return;
  ensureSandbox();
  clearRegionProgress(w.region.id, true);
  goTo(w.region.id);
}

export function setUnlockAll(on: boolean): void {
  devFlags.unlockAll = on;
  if (on) { ensureSandbox(); session.profile.flags.gate_open = true; }
}

export function restoreNormal(): void {
  devFlags.god = false;
  devFlags.infiniteHealth = false;
  devFlags.unlockAll = false;
}

/** Sandbox progress back to a brand-new game. The real save is untouched. */
export function resetSandboxProgress(): void {
  ensureSandbox();
  session.reset();
  goTo(STAGE_ORDER[0], { x: 160, y: GROUND });
}

/** Seeds the sandbox with a copy of the most recent real save (the save itself stays read-only). */
export async function loadSaveCopy(): Promise<boolean> {
  ensureSandbox();
  const latest = await saveManager.latest();
  if (!latest) return false;
  session.load(structuredClone(latest.save.profile));
  const cp = latest.save.profile.checkpoint;
  goTo(cp.region, { x: cp.x, y: cp.y });
  return true;
}

/** Throws the sandbox away; the page reloads and the stored save is the only source of truth again. */
export function exitSandbox(): void { location.reload(); }

/** Irreversibly deletes the real save slots. Only reachable through an explicit confirmation in the panel. */
export async function wipeRealSave(): Promise<void> {
  await saveManager.clear('manual');
  await saveManager.clear('auto');
  location.reload();
}

/** Adds Gold Coins to the sandbox purse (the real save is never touched). */
export function giveCoins(n: number): void {
  ensureSandbox();
  session.earn(n);
}

/** Grants every registered weapon at max level so each one can be tried. Sandbox only. */
export function giveAllWeapons(): void {
  ensureSandbox();
  const w = session.profile.weapons;
  for (const id of WEAPON_ORDER) {
    if (!w.owned.includes(id)) w.owned.push(id);
    w.levels[id] = WEAPONS[id].maxLevel;
  }
  session.earn(100000);
}

export { BOSSES };
