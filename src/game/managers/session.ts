import type { AbilityId, AttributeId, EnemyKind, ItemId, PlayerStats, ProfileData, QuestEvent } from '@/shared/types';
import { bus } from '@/game/events/bus';
import {
  addItem, addXp, createProfile, deriveStats, removeItem, upgradeAbility, upgradeAttribute, itemCount,
} from '@/game/systems/progression/profile';
import { applyQuestEvent, settleQuests } from '@/game/systems/quests/quest-engine';
import { QUESTS } from '@/game/config/quests';
import { ITEMS } from '@/game/config/items';
import { ABILITIES } from '@/game/config/abilities';
import { saveManager } from '@/persistence/save-manager';
import { audio } from '@/game/managers/AudioManager';
import { t } from '@/i18n';
import { devFlags } from '@/devtools/flags';
import { recordCompletion, shouldRecordCompletion } from '@/game/systems/campaign/campaign';

export interface PlayerHooks {
  restoreHealth(amount: number): void;
  restoreEnergy(amount: number): void;
  /** Called when stats are re-derived (level up / attribute change). */
  statsChanged(stats: PlayerStats, fullHeal: boolean): void;
  isFull(kind: 'health' | 'energy'): boolean;
}

/**
 * Owns the persistent player profile and every mutation of it. Independent of Phaser scenes so
 * progression survives scene restarts and region transitions.
 */
class GameSession {
  profile: ProfileData = createProfile();
  hooks: PlayerHooks | null = null;
  private lastAutoSave = 0;
  /** Completion has been recorded and saved but the completion screen has not been shown yet. */
  completionPending = false;

  reset(): void {
    this.completionPending = false;
    this.profile = createProfile();
    this.settleQuests(true);
    this.emit();
  }

  load(profile: ProfileData): void {
    this.completionPending = false;
    this.profile = profile;
    this.settleQuests(true);
    this.emit();
  }

  get stats(): PlayerStats {
    return deriveStats(this.profile);
  }

  emit(): void {
    bus.emit('profile:changed', structuredClone(this.profile));
  }

  toast(text: string, kind: 'info' | 'good' | 'warn' | 'level' = 'info'): void {
    bus.emit('toast', { text, kind });
  }

  /* ---------- XP & levels ---------- */

  gainXp(amount: number, label?: string): void {
    const r = addXp(this.profile, amount);
    if (label) this.toast(t('+{n} XP  {label}', { n: amount, label: t(label) }), 'info');
    if (r.levelsGained > 0) {
      this.toast(t(r.levelsGained > 1 ? 'Level {n}!  +{p} skill points' : 'Level {n}!  +{p} skill point', { n: r.newLevel, p: r.levelsGained }), 'level');
      audio.play('levelUp');
      this.hooks?.statsChanged(this.stats, true);
      void this.autoSave(true);
    }
    this.emit();
  }

  /* ---------- skills ---------- */

  upgradeAbility(id: AbilityId): boolean {
    const was = this.profile.abilities[id];
    if (!upgradeAbility(this.profile, id)) return false;
    this.toast(was === 0 ? t('Unlocked {name}', { name: t(ABILITIES[id].name) }) : t('{name} upgraded to rank {n}', { name: t(ABILITIES[id].name), n: was + 1 }), 'good');
    audio.play('pickup');
    this.emit();
    return true;
  }

  upgradeAttribute(id: AttributeId): boolean {
    if (!upgradeAttribute(this.profile, id)) return false;
    audio.play('pickup');
    this.hooks?.statsChanged(this.stats, false);
    this.emit();
    return true;
  }

  /* ---------- inventory ---------- */

  giveItem(id: ItemId, qty = 1): void {
    addItem(this.profile, id, qty);
    this.toast(`${ITEMS[id].icon} ${t(ITEMS[id].name)}${qty > 1 ? ` x${qty}` : ''}`, 'good');
    this.questEvent({ type: 'collect', target: id, count: qty });
    this.emit();
  }

  useItem(id: ItemId): boolean {
    if (!ITEMS[id].usable || itemCount(this.profile, id) < 1 || !this.hooks) return false;
    const kind = id === 'health_tonic' ? 'health' : 'energy';
    if (this.hooks.isFull(kind)) {
      this.toast(t(kind === 'health' ? 'Health is already full' : 'Energy is already full'), 'warn');
      return false;
    }
    removeItem(this.profile, id, 1);
    if (id === 'health_tonic') this.hooks.restoreHealth(this.stats.maxHealth * 0.5);
    else this.hooks.restoreEnergy(60);
    audio.play('pickup');
    this.emit();
    return true;
  }

  /* ---------- quests ---------- */

  questEvent(ev: QuestEvent): void {
    const { objectives } = applyQuestEvent(this.profile, ev);
    for (const { id, index } of objectives) {
      const o = QUESTS[id].objectives[index];
      this.toast(t('Objective complete: {name}', { name: t(o.label) }), 'good');
    }
    this.settleQuests(false);
    this.emit();
  }

  /**
   * Quests need no NPC: finished quests pay out at once and the next one starts. Called after every quest event
   * and whenever a profile is loaded. `quiet` suppresses toasts (loading a save at the menu).
   */
  settleQuests(quiet: boolean): void {
    const res = settleQuests(this.profile);
    // Sounds are queued, so "quest complete", any level-up jingle and "new quest" play one after another.
    for (const done of res.completed) {
      const q = QUESTS[done.id];
      if (!quiet) {
        this.toast(t('Quest complete: {name}  (+{n} XP)', { name: t(q.title), n: done.xp }), 'good');
        audio.playQueued('questComplete');
      }
      if (done.levelsGained > 0) {
        if (!quiet) { this.toast(t('Level {n}!', { n: this.profile.level }), 'level'); audio.playQueued('levelUp'); }
        this.hooks?.statsChanged(this.stats, true);
      }
    }
    if (!quiet) {
      for (const id of res.started) {
        this.toast(t('New quest: {name}', { name: t(QUESTS[id].title) }), 'info');
        audio.playQueued('questNew');
      }
    }
    if (res.completed.length) void this.autoSave(true);
  }

  /** Records the active checkpoint and remembers it as that region's own last lamp. */
  setCheckpoint(region: string, id: string, x: number, y: number): void {
    this.profile.checkpoint = { region, id, x, y };
    this.profile.checkpoints[region] = { id, x, y };
  }

  registerKill(kind: EnemyKind): void {
    this.profile.stats.kills += 1;
    this.questEvent({ type: 'kill', target: kind });
  }

  /* ---------- persistence ---------- */

  async save(auto: boolean): Promise<boolean> {
    // Developer sandbox: the in-memory profile is disposable and must never overwrite the player's real save.
    if (__DEV_TOOLS__ && devFlags.sandbox) return true;
    try {
      this.profile.health = Math.max(1, this.profile.health);
      await saveManager.save(auto ? 'auto' : 'manual', this.profile);
      bus.emit('saved', { slot: auto ? 'auto' : 'manual', at: Date.now(), auto });
      return true;
    } catch (err) {
      console.warn('[save] failed', err);
      bus.emit('error', t('Could not save the game (storage unavailable).'));
      return false;
    }
  }

  /**
   * Call after a stage boss falls. If that clears every available stage and completion was never recorded,
   * records it (idempotent via a profile flag), saves, and returns true. Returns false for repeat calls.
   */
  async recordCampaignCompletion(): Promise<boolean> {
    if (!shouldRecordCompletion(this.profile)) return false;
    recordCompletion(this.profile);
    this.completionPending = true;
    this.emit();
    await this.save(true);
    return true;
  }

  /** Throttled auto-save; `force` bypasses the throttle for milestone saves. */
  async autoSave(force = false): Promise<void> {
    const now = performance.now();
    if (!force && now - this.lastAutoSave < 30_000) return;
    this.lastAutoSave = now;
    await this.save(true);
  }
}

export const session = new GameSession();
