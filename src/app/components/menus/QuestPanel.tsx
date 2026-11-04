import type { ReactElement } from 'react';
import { useGameStore } from '@/store/game-store';
import { QUESTS, QUEST_ORDER } from '@/game/config/quests';
import { t } from '@/i18n';

export function QuestPanel(): ReactElement {
  const quests = useGameStore((s) => s.profile.quests);
  const entries = QUEST_ORDER.map((id) => ({ def: QUESTS[id], prog: quests[id] })).filter((e) => e.prog);
  const active = entries.filter((e) => e.prog.status !== 'completed');
  const done = entries.filter((e) => e.prog.status === 'completed');
  return (
    <div className="quests">
      {entries.length === 0 && <p className="muted">{t('No quests yet. Talk to the people of Neon Street (press E near them).')}</p>}
      {active.map(({ def, prog }) => (
        <article key={def.id} className="quest">
          <h4>{t(def.title)} {prog.status === 'ready' && <span className="tag good">{t('Turn in')}</span>}</h4>
          <p className="small muted">{t(def.summary)}</p>
          <ul>
            {def.objectives.map((o, i) => (
              <li key={i} className={prog.progress[i] >= o.count ? 'done' : ''}>{t(o.label)} ({Math.min(prog.progress[i], o.count)}/{o.count})</li>
            ))}
          </ul>
          <p className="small muted">{t('Reward')}: {def.reward.xp} {t('XP')}{def.reward.gold ? `, ${def.reward.gold} ${t('gold')}` : ''}</p>
        </article>
      ))}
      {done.length > 0 && <h4 className="muted">{t('Completed')}</h4>}
      {done.map(({ def }) => <p key={def.id} className="small done">✓ {t(def.title)}</p>)}
    </div>
  );
}
