import type { BossId, ProfileData } from '@/shared/types';
import { REGIONS, STAGE_ORDER } from '@/game/config/regions';

/**
 * Campaign completion, derived from data: the campaign is the ordered list of stage bosses that exist in the
 * world packs. Nothing here hardcodes "three stages", so appending a world pack extends the campaign and the
 * game is simply "not complete" again until the new boss falls.
 */
export function campaignBosses(): BossId[] {
  return STAGE_ORDER.map((id) => REGIONS[id].boss?.id).filter((b): b is BossId => !!b);
}

/** Flag key is scoped to the campaign's final boss, so a future final boss earns its own completion. */
export function completionFlag(finalBoss: BossId): string {
  return `campaign_complete:${finalBoss}`;
}

export function isCampaignComplete(profile: ProfileData, bosses: BossId[] = campaignBosses()): boolean {
  return bosses.length > 0 && bosses.every((b) => profile.defeatedBosses.includes(b));
}

/** True exactly once per final boss: every available boss is down and completion was never recorded. */
export function shouldRecordCompletion(profile: ProfileData, bosses: BossId[] = campaignBosses()): boolean {
  if (!isCampaignComplete(profile, bosses)) return false;
  return !profile.flags[completionFlag(bosses[bosses.length - 1])];
}

export function recordCompletion(profile: ProfileData, bosses: BossId[] = campaignBosses()): void {
  profile.flags[completionFlag(bosses[bosses.length - 1])] = true;
}
