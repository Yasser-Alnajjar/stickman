import type { ItemId, ProfileData, QuestDef, QuestEvent, QuestProgress } from '@/shared/types';
import { QUESTS } from '@/game/config/quests';
import { addItem, addXp, itemCount } from '@/game/systems/progression/profile';

export type QuestState = 'locked' | 'available' | 'active' | 'ready' | 'completed';

export function questState(p: ProfileData, q: QuestDef): QuestState {
  const prog = p.quests[q.id];
  if (prog) return prog.status;
  const reqOk = (q.requires ?? []).every((r) => p.quests[r]?.status === 'completed');
  return reqOk ? 'available' : 'locked';
}

const isDone = (q: QuestDef, prog: number[]): boolean =>
  q.objectives.every((o, i) => (prog[i] ?? 0) >= o.count);

/** Starts a quest. Collect objectives are seeded from items already carried. */
export function acceptQuest(p: ProfileData, id: string): boolean {
  const q = QUESTS[id];
  if (!q || questState(p, q) !== 'available') return false;
  const progress = q.objectives.map((o) =>
    o.type === 'collect' ? Math.min(o.count, itemCount(p, o.target as ItemId)) : 0,
  );
  const entry: QuestProgress = { status: 'active', progress };
  p.quests[id] = entry;
  refreshStatus(q, entry);
  return true;
}

function refreshStatus(q: QuestDef, entry: QuestProgress): void {
  if (entry.status === 'completed') return;
  entry.status = isDone(q, entry.progress) ? 'ready' : 'active';
}

/** Applies a gameplay event to every active quest. Returns ids that became ready. */
export function applyQuestEvent(p: ProfileData, ev: QuestEvent): string[] {
  const ready: string[] = [];
  for (const id of Object.keys(p.quests)) {
    const entry = p.quests[id];
    const q = QUESTS[id];
    if (!q || entry.status === 'completed') continue;
    let changed = false;
    q.objectives.forEach((o, i) => {
      if ((entry.progress[i] ?? 0) >= o.count || o.type !== ev.type) return;
      if (o.type === 'kill' && (o.target === 'any' || o.target === ev.target)) {
        entry.progress[i] += 1;
        changed = true;
      } else if (o.type === 'reach' && o.target === ev.target) {
        entry.progress[i] = o.count;
        changed = true;
      } else if (o.type === 'collect' && ev.type === 'collect' && o.target === ev.target) {
        entry.progress[i] = Math.min(o.count, entry.progress[i] + ev.count);
        changed = true;
      } else if (o.type === 'boss' && o.target === ev.target) {
        entry.progress[i] = o.count;
        changed = true;
      }
    });
    if (changed) {
      const before = entry.status;
      refreshStatus(q, entry);
      if (before !== 'ready' && entry.status === 'ready') ready.push(id);
    }
  }
  return ready;
}

export interface QuestCompletion { id: string; xp: number; levelsGained: number }

/** Pays out a ready quest. */
export function completeQuest(p: ProfileData, id: string): QuestCompletion | null {
  const q = QUESTS[id];
  const entry = p.quests[id];
  if (!q || !entry || entry.status !== 'ready') return null;
  entry.status = 'completed';
  const { reward } = q;
  const { levelsGained } = addXp(p, reward.xp);
  p.inventory.gold += reward.gold ?? 0;
  for (const [item, qty] of Object.entries(reward.items ?? {})) addItem(p, item as ItemId, qty ?? 0);
  for (const f of reward.flags ?? []) p.flags[f] = true;
  return { id, xp: reward.xp, levelsGained };
}

/** Active quests ordered for the tracker. */
export function trackedQuests(p: ProfileData): { def: QuestDef; progress: QuestProgress }[] {
  return Object.values(QUESTS)
    .filter((q) => p.quests[q.id] && p.quests[q.id].status !== 'completed')
    .map((def) => ({ def, progress: p.quests[def.id] }));
}
