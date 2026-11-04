import type { AbilityId, AttributeId, ItemId } from '@/shared/types';
import { bus } from '@/game/events/bus';
import { session } from '@/game/managers/session';
import { runtime } from '@/game/managers/runtime';
import { audio, type AudioSettings } from '@/game/managers/AudioManager';
import { saveManager } from '@/persistence/save-manager';
import { t } from '@/i18n';

/** The only surface the React UI uses to command the game. */
export const gameApi = {
  /* ------------------------------------------------ lifecycle */

  async refreshSaveInfo(): Promise<boolean> {
    const latest = await saveManager.latest().catch(() => null);
    bus.emit('saved', { slot: latest?.slot ?? 'none', at: latest?.save.savedAt ?? 0, auto: latest?.slot === 'auto' });
    return !!latest;
  },

  newGame(): void {
    const game = runtime.game;
    if (!game) return;
    audio.unlock();
    audio.play('ui');
    session.reset();
    this.startWorld({ region: 'city' });
  },

  async continueGame(): Promise<boolean> {
    audio.unlock();
    const latest = await saveManager.latest();
    if (!latest) {
      bus.emit('error', t('No valid save was found. Start a new game.'));
      return false;
    }
    audio.play('ui');
    session.load(latest.save.profile);
    const cp = latest.save.profile.checkpoint;
    this.startWorld({ region: cp.region, spawn: { x: cp.x, y: cp.y } });
    return true;
  },

  startWorld(init: { region: 'city' | 'boss_arena'; spawn?: string | { x: number; y: number } }): void {
    const game = runtime.game;
    if (!game) return;
    if (game.scene.isActive('World') || game.scene.isPaused('World')) game.scene.stop('World');
    game.scene.stop('MainMenu');
    game.scene.start('World', init);
  },

  pause(): void {
    const game = runtime.game;
    if (!game || !runtime.world || !game.scene.isActive('World')) return;
    if (runtime.world.dialogue.active) return;
    game.scene.pause('World');
    audio.play('ui');
    bus.emit('state', 'paused');
  },

  resume(): void {
    const game = runtime.game;
    if (!game || !game.scene.isPaused('World')) return;
    game.scene.resume('World');
    runtime.world?.resumeInput();
    bus.emit('state', 'playing');
    audio.play('uiBack');
    (document.activeElement as HTMLElement | null)?.blur();
  },

  async saveGame(): Promise<boolean> {
    const ok = await session.save(false);
    if (ok) session.toast(t('Game saved'), 'good');
    audio.play(ok ? 'pickup' : 'uiBack');
    return ok;
  },

  async returnToMenu(): Promise<void> {
    const game = runtime.game;
    if (!game) return;
    await session.autoSave(true);
    game.scene.stop('World');
    game.scene.start('MainMenu');
    await this.refreshSaveInfo();
    bus.emit('state', 'menu');
  },

  respawn(): void {
    const world = runtime.world;
    if (!world) return;
    const cp = session.profile.checkpoint;
    session.profile.stats.deaths += 1;
    session.profile.health = session.stats.maxHealth;
    audio.play('ui');
    world.scene.restart({ region: cp.region, spawn: { x: cp.x, y: cp.y }, respawn: true });
  },

  /* ------------------------------------------------ dialogue */

  dialogueAdvance(): void { runtime.world?.dialogue.advance(); },
  dialogueChoose(i: number): void { runtime.world?.dialogue.choose(i); },

  /* ------------------------------------------------ progression */

  upgradeAbility(id: AbilityId): boolean { return session.upgradeAbility(id); },
  upgradeAttribute(id: AttributeId): boolean { return session.upgradeAttribute(id); },
  useItem(id: ItemId): boolean { return session.useItem(id); },

  /* ------------------------------------------------ settings */

  setAudio(s: Partial<AudioSettings>): void { audio.set(s); },
  setScreenShake(on: boolean): void {
    try { localStorage.setItem('stickman.shake', on ? '1' : '0'); } catch { /* storage unavailable */ }
    runtime.world?.fx.setShake(on);
  },
};
