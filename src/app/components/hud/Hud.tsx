import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { ABILITIES, ABILITY_ORDER } from '@/game/config/abilities';
import { NPCS } from '@/game/config/npcs';
import { MAX_LEVEL, xpToNext } from '@/game/config/progression';
import { trackedQuests } from '@/game/systems/quests/quest-engine';
import { useDevice } from '@/app/mobile/device';
import { t } from '@/i18n';

function Bar({ value, max, cls, label }: { value: number; max: number; cls: string; label: string }): ReactElement {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={`hbar ${cls}`} role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemax={max}>
      <div className="hbar-fill" style={{ width: `${pct}%` }} />
      <span className="hbar-text">{value} / {max}</span>
    </div>
  );
}

function Toasts(): ReactElement {
  const toasts = useGameStore((s) => s.toasts);
  const dismiss = useGameStore((s) => s.dismissToast);
  useEffect(() => {
    if (!toasts.length) return;
    const t = window.setTimeout(() => dismiss(toasts[0].id), 2800);
    return () => window.clearTimeout(t);
  }, [toasts, dismiss]);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}
    </div>
  );
}

function Dialogue(): ReactElement | null {
  const d = useGameStore((s) => s.dialogue);
  if (!d) return null;
  return (
    <div className="dialogue" role="dialog" aria-label={`Dialogue with ${d.npcName}`}>
      <div className="dialogue-name">{d.npcName}</div>
      <p>{d.text}</p>
      {d.choices ? (
        <div className="dialogue-choices">
          {d.choices.map((c, i) => <button key={c} className="btn small-btn" onClick={() => gameApi.dialogueChoose(i)}>{c}</button>)}
        </div>
      ) : (
        <button className="btn small-btn" onClick={() => gameApi.dialogueAdvance()}>{t(d.hasNext ? 'Next ▸' : 'Close')} <kbd>E</kbd></button>
      )}
    </div>
  );
}

export function Hud(): ReactElement {
  const { touch } = useDevice();
  const hud = useGameStore((s) => s.hud);
  const profile = useGameStore((s) => s.profile);
  const boss = useGameStore((s) => s.boss);
  const prompt = useGameStore((s) => s.prompt);
  const combo = useGameStore((s) => s.combo);
  const banner = useGameStore((s) => s.banner);
  const dialogue = useGameStore((s) => s.dialogue);
  const tracked = trackedQuests(profile);
  const xpNeed = profile.level >= MAX_LEVEL ? 1 : xpToNext(profile.level);
  const xpPct = profile.level >= MAX_LEVEL ? 100 : (profile.xp / xpNeed) * 100;

  return (
    <div className="hud" aria-hidden={false}>
      <div className="hud-tl">
        <div className="level-badge" title="Level">{profile.level}</div>
        <div className="bars">
          <Bar value={hud.health} max={hud.maxHealth} cls="hp" label="Health" />
          <Bar value={hud.stamina} max={hud.maxStamina} cls="st" label="Stamina" />
          <Bar value={hud.energy} max={hud.maxEnergy} cls="en" label="Energy" />
          <div className="xpbar" role="progressbar" aria-label="Experience" aria-valuenow={profile.xp}><div style={{ width: `${xpPct}%` }} /></div>
          {profile.skillPoints > 0 && <div className="sp-note">{t(profile.skillPoints > 1 ? '{n} skill points (Tab)' : '{n} skill point (Tab)', { n: profile.skillPoints })}</div>}
        </div>
      </div>

      <div className="hud-tr">
        {tracked.length > 0 && (
          <div className="tracker">
            <h5>{t('Quests')}</h5>
            {tracked.map(({ def, progress }) => (
              <div key={def.id} className="tracker-q">
                <strong>{t(def.title)}</strong>
                {progress.status === 'ready' ? <div className="ready">{t('Return to {name}', { name: t(NPCS[def.giver].name) })}</div> : def.objectives.map((o, i) => (
                  <div key={i} className={progress.progress[i] >= o.count ? 'done' : ''}>{t(o.label)} {Math.min(progress.progress[i], o.count)}/{o.count}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {boss && (
        <div className="boss-bar" role="progressbar" aria-label="Boss health">
          <div className="boss-name">{boss.name} <span className="muted small">{t('Phase')} {boss.phase}</span></div>
          <div className="boss-track"><div className="boss-fill" style={{ width: `${(boss.health / boss.maxHealth) * 100}%` }} /></div>
        </div>
      )}

      <div className="hud-bottom" data-hud-abilities>
        <div className="abilities">
          {ABILITY_ORDER.map((id) => {
            const def = ABILITIES[id];
            const rank = profile.abilities[id];
            const cd = hud.cooldowns[id];
            const frac = cd.total > 0 ? cd.remaining / cd.total : 0;
            const cost = def.energyCost[Math.max(0, rank - 1)];
            const noEnergy = rank > 0 && hud.energy < cost;
            return (
              <div key={id} className={`slot ${rank === 0 ? 'locked' : ''} ${noEnergy ? 'low' : ''}`} style={{ ['--c' as string]: def.color }} title={t(def.name)}>
                <span className="slot-icon">{def.icon}</span>
                <span className="slot-key">{def.keyLabel}</span>
                {rank > 0 && <span className="slot-cost">{cost}</span>}
                {frac > 0 && <div className="cd" style={{ height: `${frac * 100}%` }} />}
                {frac > 0 && <span className="cd-text">{(cd.remaining / 1000).toFixed(1)}</span>}
                {rank === 0 && <span className="lock">🔒</span>}
              </div>
            );
          })}
        </div>
      </div>

      {combo >= 2 && <div className="combo" key={combo}>{combo}<small> {t('HIT COMBO')}</small></div>}
      {prompt && !dialogue && <div className="prompt">{touch ? prompt.replace(/Press E to/i, 'Tap 💬 to').replace(/اضغط E/, 'اضغط 💬') : prompt}</div>}
      {banner && <div className="banner"><h2>{banner.title}</h2>{banner.subtitle && <p>{banner.subtitle}</p>}</div>}
      <Dialogue />
      <Toasts />
    </div>
  );
}
