import type { ReactElement } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { ABILITIES, ABILITY_ORDER } from '@/game/config/abilities';
import { ATTRIBUTES, ATTRIBUTE_ORDER, MAX_LEVEL, xpToNext } from '@/game/config/progression';
import { checkAbilityUpgrade, checkAttributeUpgrade, deriveStats } from '@/game/systems/progression/profile';
import { t } from '@/i18n';

/** Translates the engine's English reason strings (with their numbers). */
function reason(r: string): string {
  const lv = /^Requires level (\d+)$/.exec(r);
  if (lv) return t('Requires level {n}', { n: lv[1] });
  const sp = /^Needs (\d+) skill points?$/.exec(r);
  if (sp) return t(Number(sp[1]) > 1 ? 'Needs {n} skill points' : 'Needs {n} skill point', { n: sp[1] });
  return t(r);
}

export function SkillTree(): ReactElement {
  const p = useGameStore((s) => s.profile);
  const stats = deriveStats(p);
  return (
    <div className="skills">
      <header className="skills-head">
        <div><span className="muted">{t('Level')}</span> <strong>{p.level}</strong>{p.level < MAX_LEVEL && <span className="muted"> · {p.xp}/{xpToNext(p.level)} XP</span>}</div>
        <div className="points" aria-label="Skill points">{t('Skill points')}: <strong>{p.skillPoints}</strong></div>
      </header>

      <h3>{t('Abilities')}</h3>
      <div className="skill-grid">
        {ABILITY_ORDER.map((id) => {
          const def = ABILITIES[id];
          const rank = p.abilities[id];
          const chk = checkAbilityUpgrade(p, id);
          const locked = p.level < def.unlockLevel;
          const maxed = rank >= def.maxRank;
          return (
            <article key={id} className={`skill ${locked ? 'locked' : ''}`} style={{ ['--c' as string]: def.color }}>
              <div className="skill-title"><span className="skill-icon">{def.icon}</span><h4>{t(def.name)}</h4><span className="muted">[{def.keyLabel}]</span></div>
              <p className="small">{t(def.description)}</p>
              <div className="pips" aria-label={`Rank ${rank} of ${def.maxRank}`}>
                {Array.from({ length: def.maxRank }, (_, i) => <i key={i} className={i < rank ? 'on' : ''} />)}
              </div>
              <ul className="small stats">
                <li>{t('Energy')} {def.energyCost[Math.max(0, rank - 1)]}{rank > 0 && rank < def.maxRank ? ` → ${def.energyCost[rank]}` : ''}</li>
                <li>{t('Cooldown')} {(def.cooldown[Math.max(0, rank - 1)] / 1000).toFixed(1)}s{rank > 0 && rank < def.maxRank ? ` → ${(def.cooldown[rank] / 1000).toFixed(1)}s` : ''}</li>
                <li>{t('Damage')} {def.damage[Math.max(0, rank - 1)]}{rank > 0 && rank < def.maxRank ? ` → ${def.damage[rank]}` : ''}</li>
              </ul>
              <p className="small note">{rank < def.maxRank ? t('Next: {note}', { note: t(def.rankNotes[rank]) }) : t('Fully upgraded.')}</p>
              {locked && <p className="small warn">{t('Requires level {n}', { n: def.unlockLevel })}</p>}
              <button className="btn small-btn" disabled={!chk.ok} onClick={() => gameApi.upgradeAbility(id)}>
                {maxed ? t('Maxed') : rank === 0 ? t('Unlock ({n} pt)', { n: def.rankCosts[0] }) : chk.ok ? t('Upgrade ({n} pt)', { n: chk.cost }) : reason(chk.reason)}
              </button>
              {rank === 0 && !locked && !chk.ok && <p className="small warn">{reason(chk.reason)}</p>}
            </article>
          );
        })}
      </div>

      <h3>{t('Attributes')}</h3>
      <div className="attr-list">
        {ATTRIBUTE_ORDER.map((id) => {
          const def = ATTRIBUTES[id];
          const rank = p.attributes[id];
          const chk = checkAttributeUpgrade(p, id);
          return (
            <div key={id} className="attr">
              <div>
                <strong>{t(def.name)}</strong> <span className="muted small">{t(def.perRank)} {t('/ rank')}</span>
                <div className="pips">{Array.from({ length: def.maxRank }, (_, i) => <i key={i} className={i < rank ? 'on' : ''} />)}</div>
              </div>
              <button className="btn small-btn" disabled={!chk.ok} onClick={() => gameApi.upgradeAttribute(id)} aria-label={`Upgrade ${def.name}`}>+</button>
            </div>
          );
        })}
      </div>
      <p className="small muted">
        {t('Health')} {stats.maxHealth} · {t('Stamina')} {stats.maxStamina} · {t('Energy')} {stats.maxEnergy} · {t('Attack')} {stats.attack.toFixed(1)} · {t('Defense')} {stats.defense} · {t('Speed')} ×{stats.moveSpeedMult.toFixed(2)}
      </p>
    </div>
  );
}
