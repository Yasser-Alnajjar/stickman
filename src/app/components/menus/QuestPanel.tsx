import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useGameStore } from '@/store/game-store';
import { ITEMS } from '@/game/config/items';
import { buildCampaign } from '@/game/systems/campaign/progress';
import { questLog, type QuestLogEntry } from '@/game/systems/quests/quest-engine';
import { QUESTS } from '@/game/config/quests';
import { WEAPONS } from '@/game/weapons/registry';
import { bossWeapons, questWeapons } from '@/game/economy/rewards';
import type { ItemId } from '@/shared/types';
import { t } from '@/i18n';

function Rewards({ entry, earned }: { entry: QuestLogEntry; earned?: boolean }): ReactElement {
  const r = entry.def.reward;
  const parts = [
    `${r.xp} ${t('XP')}`,
    ...(r.gold ? [`${r.gold} ${t('gold')}`] : []),
    ...[...questWeapons(entry.def.id), ...entry.def.objectives.filter((o) => o.type === 'boss').flatMap((o) => bossWeapons(o.target))]
      .map((id) => `${WEAPONS[id].icon} ${t('Weapon')}: ${t(WEAPONS[id].name)}`),
    ...Object.entries(r.items ?? {}).map(([id, n]) => `${ITEMS[id as ItemId].icon} ${t(ITEMS[id as ItemId].name)}${(n ?? 1) > 1 ? ` ×${n}` : ''}`),
  ];
  return <p className="small quest-rewards"><span className="muted">{earned ? t('Rewards earned') : t('Rewards')}:</span> {parts.join(' · ')}</p>;
}

function Objectives({ entry }: { entry: QuestLogEntry }): ReactElement {
  return (
    <ul className="quest-objectives">
      {entry.def.objectives.map((o, i) => {
        const n = Math.min(entry.progress[i] ?? 0, o.count);
        return (
          <li key={i} className={n >= o.count ? 'done' : ''}>
            <span>{n >= o.count ? '✓ ' : ''}{t(o.label)}</span>
            <span className="quest-count">{n}/{o.count}</span>
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={o.count} aria-valuenow={n}><div className="bar-fill" style={{ width: `${(n / o.count) * 100}%` }} /></div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Quest log. Pure view over `questLog(profile)`; quests start and finish by themselves during play. Sections follow
 * the quest line (completed -> active -> locked), so the original order is preserved and nothing is ever removed.
 */
export function QuestPanel(): ReactElement {
  const profile = useGameStore((s) => s.profile);
  const log = useMemo(() => questLog(profile), [profile]);
  const worlds = useMemo(() => buildCampaign(profile).worlds, [profile]);
  const worldName = (id: string): string => t(worlds.find((w) => w.packId === id)?.name ?? '');
  const done = log.filter((e) => e.state === 'completed');
  const active = log.filter((e) => e.state === 'active');
  const locked = log.filter((e) => e.state === 'locked');

  const lockText = (e: QuestLogEntry): string =>
    e.lock?.kind === 'quest'
      ? t('Requires: complete "{name}"', { name: t(QUESTS[e.lock.quest].title) })
      : e.lock ? t('Requires: unlock {name}', { name: worldName(e.lock.world) }) : '';

  return (
    <div className="quests">
      {done.length > 0 && <h4 className="quest-section muted">{t('Completed Quests')}</h4>}
      {done.map((e) => (
        <details key={e.def.id} className="quest completed">
          <summary>
            <span className="quest-num">{e.number}</span>
            <span className="quest-title">{t(e.def.title)}</span>
            <span className="tag good">✓ {t('Completed')}</span>
          </summary>
          <p className="small muted">{worldName(e.def.world)} · {t(e.def.summary)}</p>
          <Objectives entry={e} />
          <Rewards entry={e} earned />
        </details>
      ))}

      {active.length > 0 && <h4 className="quest-section">{t('Active Quests')}</h4>}
      {active.map((e) => (
        <article key={e.def.id} className={`quest active ${e.current ? 'current' : ''}`}>
          <h4>
            <span className="quest-num">{e.number}</span>
            <span className="quest-title">{t(e.def.title)}</span>
            {e.current && <span className="tag good">{t('Current Quest')}</span>}
          </h4>
          <p className="small muted">{worldName(e.def.world)} · {t(e.def.summary)}</p>
          <Objectives entry={e} />
          <Rewards entry={e} />
          <p className="small muted">💡 {t(e.def.hint)}</p>
        </article>
      ))}

      {locked.length > 0 && <h4 className="quest-section muted">{t('Locked Quests')}</h4>}
      {locked.map((e) => (
        <article key={e.def.id} className="quest locked">
          <h4>
            <span className="quest-num">{e.number}</span>
            <span className="quest-title"><span aria-hidden="true">🔒 </span>{t(e.def.title)}</span>
          </h4>
          <p className="small muted">{worldName(e.def.world)} · {t(e.def.summary)}</p>
          <p className="small warn">{lockText(e)}</p>
          <Rewards entry={e} />
        </article>
      ))}
    </div>
  );
}
