import type { ItemId, ProfileData, QuestDef, QuestEvent, QuestProgress } from '@/shared/types';
import { QUESTS, QUEST_ORDER } from '@/game/config/quests';
import { addItem, addXp, itemCount } from '@/game/systems/progression/profile';
import { buildCampaign } from '@/game/systems/campaign/progress';
import { earnGold } from '@/game/economy/wallet';
import { grantReward, questClaim, questWeapons } from '@/game/economy/rewards';

export type QuestState = 'locked' | 'available' | 'active' | 'ready' | 'completed';

/** Why a quest is still locked. */
export type QuestLock = { kind: 'quest'; quest: string } | { kind: 'world'; world: string };

/** Quests run as one story line in `QUEST_ORDER`; ids missing from the list follow in definition order. */
export function questOrder(): string[] {
  const listed = QUEST_ORDER.filter((id) => QUESTS[id]);
  return [...listed, ...Object.keys(QUESTS).filter((id) => !listed.includes(id))];
}

export function prerequisite(id: string): string | undefined {
  const order = questOrder();
  const i = order.indexOf(id);
  return i > 0 ? order[i - 1] : undefined;
}

/** Null when the quest can start: previous quest completed and its world reachable. */
export function lockInfo(p: ProfileData, q: QuestDef): QuestLock | null {
  const prev = prerequisite(q.id);
  if (prev && p.quests[prev]?.status !== 'completed') return { kind: 'quest', quest: prev };
  const world = buildCampaign(p).worlds.find((w) => w.packId === q.world);
  if (world && world.status === 'locked') return { kind: 'world', world: q.world };
  return null;
}

export function questState(p: ProfileData, q: QuestDef): QuestState {
  const prog = p.quests[q.id];
  if (prog) return prog.status;
  return lockInfo(p, q) ? 'locked' : 'available';
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

export interface QuestEventResult {
  /** Quests whose objectives are now all met. */
  ready: string[];
  /** Objectives that reached their target because of this event. */
  objectives: { id: string; index: number }[];
}

/** Applies a gameplay event to every active quest. */
export function applyQuestEvent(p: ProfileData, ev: QuestEvent): QuestEventResult {
  const ready: string[] = [];
  const objectives: { id: string; index: number }[] = [];
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
      if ((entry.progress[i] ?? 0) >= o.count) objectives.push({ id, index: i });
    });
    if (changed) {
      const before = entry.status;
      refreshStatus(q, entry);
      if (before !== 'ready' && entry.status === 'ready') ready.push(id);
    }
  }
  return { ready, objectives };
}

export interface QuestCompletion { id: string; xp: number; levelsGained: number; gold: number; weapons: string[] }

/** Pays out a ready quest. */
export function completeQuest(p: ProfileData, id: string): QuestCompletion | null {
  const q = QUESTS[id];
  const entry = p.quests[id];
  if (!q || !entry || entry.status !== 'ready') return null;
  entry.status = 'completed';
  const { reward } = q;
  const { levelsGained } = addXp(p, reward.xp);
  const gold = earnGold(p, reward.gold ?? 0);
  for (const [item, qty] of Object.entries(reward.items ?? {})) addItem(p, item as ItemId, qty ?? 0);
  for (const f of reward.flags ?? []) p.flags[f] = true;
  // Weapon rewards go through the shared claim ledger, so a quest can never hand out its weapon twice.
  const weapons = grantReward(p, questClaim(id), { weapons: questWeapons(id) }).weapons;
  return { id, xp: reward.xp, levelsGained, gold, weapons };
}

/** Active quests ordered for the tracker. */
export function trackedQuests(p: ProfileData): { def: QuestDef; progress: QuestProgress }[] {
  return Object.values(QUESTS)
    .filter((q) => p.quests[q.id] && p.quests[q.id].status !== 'completed')
    .map((def) => ({ def, progress: p.quests[def.id] }));
}

/** Starts every quest whose lock has lifted. Returns the ids started, in story order. */
export function syncQuests(p: ProfileData): string[] {
  const started: string[] = [];
  for (const id of questOrder()) if (!p.quests[id] && acceptQuest(p, id)) started.push(id);
  return started;
}

export interface SettleResult { started: string[]; completed: QuestCompletion[] }

/**
 * Brings the quest log to a stable state without any NPC: pays out finished quests (including `ready` ones from
 * older saves) and starts whatever that unlocked, repeating until nothing changes. Safe to call at any time.
 */
export function settleQuests(p: ProfileData): SettleResult {
  const res: SettleResult = { started: [], completed: [] };
  for (let guard = 0; guard < 64; guard++) {
    let changed = false;
    for (const id of questOrder()) {
      const done = completeQuest(p, id);
      if (done) { res.completed.push(done); changed = true; }
    }
    const started = syncQuests(p);
    if (started.length) { res.started.push(...started); changed = true; }
    if (!changed) break;
  }
  return res;
}

export interface QuestLogEntry {
  def: QuestDef;
  /** 1-based position in the quest line. */
  number: number;
  state: 'active' | 'locked' | 'completed';
  progress: number[];
  lock: QuestLock | null;
  /** The quest to work on now: the first unfinished one in story order. */
  current: boolean;
}

/** Everything the quest menu shows, derived from the profile. The UI does no quest logic of its own. */
export function questLog(p: ProfileData): QuestLogEntry[] {
  let currentTaken = false;
  return questOrder().map((id, idx) => {
    const def = QUESTS[id];
    const entry = p.quests[id];
    const state = entry ? (entry.status === 'completed' ? 'completed' : 'active') : 'locked';
    const current = state === 'active' && !currentTaken;
    if (current) currentTaken = true;
    return { def, number: idx + 1, state, progress: entry?.progress ?? def.objectives.map(() => 0), lock: entry ? null : lockInfo(p, def), current };
  });
}
