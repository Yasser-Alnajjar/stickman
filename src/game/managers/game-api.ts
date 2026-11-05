import type { AbilityId, AttributeId, ItemId, RegionId } from "@/shared/types";
import { bus } from "@/game/events/bus";
import { session } from "@/game/managers/session";
import { runtime } from "@/game/managers/runtime";
import { audio, type AudioSettings } from "@/game/managers/AudioManager";
import { saveManager } from "@/persistence/save-manager";
import { t } from "@/i18n";
import { WORLD_PACKS } from "@/game/world/stores";
import { ensureRegion } from "@/game/world/loader";
import { regionAccess } from "@/game/systems/campaign/progress";
import { devFlags } from "@/devtools/flags";

/** The only surface the React UI uses to command the game. */
export const gameApi = {
  /* ------------------------------------------------ lifecycle */

  async refreshSaveInfo(): Promise<boolean> {
    const latest = await saveManager.latest().catch(() => null);
    bus.emit("saved", {
      slot: latest?.slot ?? "none",
      at: latest?.save.savedAt ?? 0,
      auto: latest?.slot === "auto",
    });
    return !!latest;
  },

  newGame(): void {
    const game = runtime.game;
    if (!game) return;
    audio.unlock();
    audio.play("ui");
    session.reset();
    void this.startWorld({ region: WORLD_PACKS[0].cityRegion });
  },

  async continueGame(): Promise<boolean> {
    audio.unlock();
    const latest = await saveManager.latest();
    if (!latest) {
      bus.emit("error", t("No valid save was found. Start a new game."));
      return false;
    }
    audio.play("ui");
    session.load(latest.save.profile);
    const cp = latest.save.profile.checkpoint;
    // A checkpoint in a world that is not unlocked (hand-edited save) is not honoured: start from the first world.
    const access = regionAccess(session.profile, cp.region);
    if (access?.unlocked) await this.startWorld({ region: cp.region, spawn: { x: cp.x, y: cp.y } });
    else await this.startWorld({ region: WORLD_PACKS[0].cityRegion });
    return true;
  },

  /** Starts a world picked from the campaign map. Loads the latest save first so no progress is lost or reset. */
  async playWorld(region: RegionId, spawn?: string): Promise<boolean> {
    audio.unlock();
    const latest = await saveManager.latest();
    if (latest) session.load(latest.save.profile);
    else session.reset();
    // Re-entering a world resumes at that world's own last lamp, whatever the active checkpoint is.
    const own = session.profile.checkpoints[region];
    const ok = await this.startWorld({ region, spawn: own ? { x: own.x, y: own.y, id: own.id } : spawn });
    if (ok) audio.play("ui");
    return ok;
  },

  /**
   * The single gate into any world. Refuses unknown regions and worlds the profile has not unlocked (a locked world
   * cannot be entered by any caller: the map, Continue, or a hand-built call), then loads the world's level data
   * before starting the scene. Resolves to whether the world started.
   */
  async startWorld(init: {
    region: RegionId;
    spawn?: string | { x: number; y: number; id?: string };
  }): Promise<boolean> {
    const game = runtime.game;
    if (!game) return false;
    const access = regionAccess(session.profile, init.region);
    if (!access) { bus.emit("error", t("That world does not exist.")); return false; }
    if (!access.unlocked && !(__DEV_TOOLS__ && (devFlags.unlockAll || devFlags.sandbox))) {
      bus.emit("error", t("That world is still locked. Defeat the previous boss first."));
      return false;
    }
    try {
      await ensureRegion(init.region);
    } catch (e) {
      console.error("[world] load failed", e);
      bus.emit("error", t("Could not load that world."));
      return false;
    }
    if (game.scene.isActive("World") || game.scene.isPaused("World"))
      game.scene.stop("World");
    game.scene.stop("MainMenu");
    game.scene.start("World", init);
    return true;
  },

  pause(): void {
    const game = runtime.game;
    if (!game || !runtime.world || !game.scene.isActive("World")) return;
    game.scene.pause("World");
    audio.play("ui");
    bus.emit("state", "paused");
  },

  resume(): void {
    const game = runtime.game;
    if (!game || !game.scene.isPaused("World")) return;
    game.scene.resume("World");
    runtime.world?.resumeInput();
    bus.emit("state", "playing");
    audio.play("uiBack");
    (document.activeElement as HTMLElement | null)?.blur();
  },

  async saveGame(): Promise<boolean> {
    const ok = await session.save(false);
    if (ok) session.toast(t("Game saved"), "good");
    audio.play(ok ? "pickup" : "uiBack");
    return ok;
  },

  async returnToMenu(): Promise<void> {
    const game = runtime.game;
    if (!game) return;
    await session.autoSave(true);
    game.scene.stop("World");
    game.scene.start("MainMenu");
    await this.refreshSaveInfo();
    bus.emit("state", "menu");
  },

  /** Shows the localized campaign-complete screen. The save already happened in session.recordCampaignCompletion. */
  showCompletion(): void {
    const game = runtime.game;
    if (!game || !session.completionPending) return;
    session.completionPending = false;
    if (game.scene.isActive("World")) game.scene.pause("World");
    runtime.world?.player.input.reset();
    bus.emit("state", "complete");
    audio.play("quest");
  },

  async respawn(): Promise<void> {
    const world = runtime.world;
    if (!world) return;
    const cp = session.profile.checkpoint;
    session.profile.stats.deaths += 1;
    session.profile.health = session.stats.maxHealth;
    audio.play("ui");
    await ensureRegion(cp.region);
    world.scene.restart({
      region: cp.region,
      spawn: { x: cp.x, y: cp.y },
      respawn: true,
    });
  },

  /* ------------------------------------------------ progression */

  upgradeAbility(id: AbilityId): boolean {
    return session.upgradeAbility(id);
  },
  upgradeAttribute(id: AttributeId): boolean {
    return session.upgradeAttribute(id);
  },
  useItem(id: ItemId): boolean {
    return session.useItem(id);
  },

  /* ------------------------------------------------ settings */

  setAudio(s: Partial<AudioSettings>): void {
    audio.set(s);
  },
  setScreenShake(on: boolean): void {
    try {
      localStorage.setItem("stickman.shake", on ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
    runtime.world?.fx.setShake(on);
  },
};
