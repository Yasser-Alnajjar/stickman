import type { AbilityId, AttributeId, EnemyKind, ItemId, PlayerStats, ProfileData, QuestEvent } from '@/shared/types';
import { bus } from '@/game/events/bus';
import {
  addItem, addXp, createProfile, deriveStats, removeItem, upgradeAbility, upgradeAttribute, itemCount,
} from '@/game/systems/progression/profile';
import { acceptQuest, applyQuestEvent, completeQuest } from '@/game/systems/quests/quest-engine';
import { QUESTS } from '@/game/config/quests';
import { ITEMS } from '@/game/config/items';
import { ABILITIES } from '@/game/config/abilities';
import { saveManager } from '@/persistence/save-manager';
import { audio } from '@/game/managers/AudioManager';
import { t } from '@/i18n';
import { devFlags } from '@/devtools/flags';

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

  reset(): void {
    this.profile = createProfile();
    this.emit();
  }

  load(profile: ProfileData): void {
    this.profile = profile;
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
    const ready = applyQuestEvent(this.profile, ev);
    for (const id of ready) {
      const q = QUESTS[id];
      if (q.autoComplete) this.completeQuest(id);
      else {
        this.toast(t('Quest ready to turn in: {name}', { name: t(q.title) }), 'good');
        audio.play('quest');
      }
    }
    this.emit();
  }

  acceptQuest(id: string): void {
    if (!acceptQuest(this.profile, id)) return;
    this.toast(t('Quest accepted: {name}', { name: t(QUESTS[id].title) }), 'good');
    audio.play('quest');
    const entry = this.profile.quests[id];
    if (entry.status === 'ready' && QUESTS[id].autoComplete) this.completeQuest(id);
    else if (entry.status === 'ready') this.toast(t('Quest ready to turn in: {name}', { name: t(QUESTS[id].title) }), 'good');
    this.emit();
  }

  completeQuest(id: string): void {
    const done = completeQuest(this.profile, id);
    if (!done) return;
    this.toast(t('Quest complete: {name}  (+{n} XP)', { name: t(QUESTS[id].title), n: done.xp }), 'good');
    audio.play('quest');
    if (done.levelsGained > 0) {
      this.toast(t('Level {n}!', { n: this.profile.level }), 'level');
      audio.play('levelUp');
      this.hooks?.statsChanged(this.stats, true);
    }
    this.emit();
    void this.autoSave(true);
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

  /** Throttled auto-save; `force` bypasses the throttle for milestone saves. */
  async autoSave(force = false): Promise<void> {
    const now = performance.now();
    if (!force && now - this.lastAutoSave < 30_000) return;
    this.lastAutoSave = now;
    await this.save(true);
  }
}

export const session = new GameSession();
