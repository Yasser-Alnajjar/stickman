import type { ReactElement } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { ABILITIES, ABILITY_ORDER } from '@/game/config/abilities';
import { ATTRIBUTES, ATTRIBUTE_ORDER, MAX_LEVEL, xpToNext } from '@/game/config/progression';
import { checkAbilityUpgrade, checkAttributeUpgrade, deriveStats } from '@/game/systems/progression/profile';

export function SkillTree(): ReactElement {
  const p = useGameStore((s) => s.profile);
  const stats = deriveStats(p);
  return (
    <div className="skills">
      <header className="skills-head">
        <div><span className="muted">Level</span> <strong>{p.level}</strong>{p.level < MAX_LEVEL && <span className="muted"> · {p.xp}/{xpToNext(p.level)} XP</span>}</div>
        <div className="points" aria-label="Skill points">Skill points: <strong>{p.skillPoints}</strong></div>
      </header>

      <h3>Abilities</h3>
      <div className="skill-grid">
        {ABILITY_ORDER.map((id) => {
          const def = ABILITIES[id];
          const rank = p.abilities[id];
          const chk = checkAbilityUpgrade(p, id);
          const locked = p.level < def.unlockLevel;
          const maxed = rank >= def.maxRank;
          return (
            <article key={id} className={`skill ${locked ? 'locked' : ''}`} style={{ ['--c' as string]: def.color }}>
              <div className="skill-title"><span className="skill-icon">{def.icon}</span><h4>{def.name}</h4><span className="muted">[{def.keyLabel}]</span></div>
              <p className="small">{def.description}</p>
              <div className="pips" aria-label={`Rank ${rank} of ${def.maxRank}`}>
                {Array.from({ length: def.maxRank }, (_, i) => <i key={i} className={i < rank ? 'on' : ''} />)}
              </div>
              <ul className="small stats">
                <li>Energy {def.energyCost[Math.max(0, rank - 1)]}{rank > 0 && rank < def.maxRank ? ` → ${def.energyCost[rank]}` : ''}</li>
                <li>Cooldown {(def.cooldown[Math.max(0, rank - 1)] / 1000).toFixed(1)}s{rank > 0 && rank < def.maxRank ? ` → ${(def.cooldown[rank] / 1000).toFixed(1)}s` : ''}</li>
                <li>Damage {def.damage[Math.max(0, rank - 1)]}{rank > 0 && rank < def.maxRank ? ` → ${def.damage[rank]}` : ''}</li>
              </ul>
              <p className="small note">{rank < def.maxRank ? `Next: ${def.rankNotes[rank]}` : 'Fully upgraded.'}</p>
              {locked && <p className="small warn">Requires level {def.unlockLevel}</p>}
              <button className="btn small-btn" disabled={!chk.ok} onClick={() => gameApi.upgradeAbility(id)}>
                {maxed ? 'Maxed' : rank === 0 ? `Unlock (${def.rankCosts[0]} pt)` : chk.ok ? `Upgrade (${chk.cost} pt)` : chk.reason}
              </button>
              {rank === 0 && !locked && !chk.ok && <p className="small warn">{chk.reason}</p>}
            </article>
          );
        })}
      </div>

      <h3>Attributes</h3>
      <div className="attr-list">
        {ATTRIBUTE_ORDER.map((id) => {
          const def = ATTRIBUTES[id];
          const rank = p.attributes[id];
          const chk = checkAttributeUpgrade(p, id);
          return (
            <div key={id} className="attr">
              <div>
                <strong>{def.name}</strong> <span className="muted small">{def.perRank} / rank</span>
                <div className="pips">{Array.from({ length: def.maxRank }, (_, i) => <i key={i} className={i < rank ? 'on' : ''} />)}</div>
              </div>
              <button className="btn small-btn" disabled={!chk.ok} onClick={() => gameApi.upgradeAttribute(id)} aria-label={`Upgrade ${def.name}`}>+</button>
            </div>
          );
        })}
      </div>
      <p className="small muted">
        Health {stats.maxHealth} · Stamina {stats.maxStamina} · Energy {stats.maxEnergy} · Attack {stats.attack.toFixed(1)} · Defense {stats.defense} · Speed ×{stats.moveSpeedMult.toFixed(2)}
      </p>
    </div>
  );
}
