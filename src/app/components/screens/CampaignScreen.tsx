import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { saveManager } from "@/persistence/save-manager";
import { createProfile } from "@/game/systems/progression/profile";
import {
  buildCampaign,
  type WorldEntry,
} from "@/game/systems/campaign/progress";
import { gameApi } from "@/game/managers/game-api";
import { useGameStore } from "@/store/game-store";
import { WorldThumb } from "@/app/components/screens/WorldThumb";
import { t } from "@/i18n";

const STATUS_ICON = { completed: "✓", unlocked: "▶", locked: "🔒" } as const;

function statusLabel(w: WorldEntry): string {
  return t(
    w.status === "completed"
      ? "Completed"
      : w.status === "unlocked"
        ? "Unlocked"
        : "Locked",
  );
}

/** World map / campaign progress. Everything is derived from the latest save and the registered world packs. */
export function CampaignScreen(): ReactElement {
  const setPanel = useGameStore((s) => s.setPanel);
  const [loaded, setLoaded] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [profile, setProfile] = useState(createProfile);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void saveManager
      .latest()
      .catch(() => null)
      .then((latest) => {
        if (!alive) return;
        if (latest) setProfile(latest.save.profile);
        setHasSave(!!latest);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const campaign = useMemo(() => buildCampaign(profile), [profile]);
  const sel =
    campaign.worlds.find(
      (w) => w.number === (selected ?? campaign.current?.number ?? 1),
    ) ?? campaign.worlds[0];

  const go = async (fn: () => Promise<unknown> | void): Promise<void> => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const play = (w: WorldEntry): Promise<unknown> | void =>
    !hasSave && w.number === 1
      ? gameApi.newGame()
      : gameApi.playWorld(w.cityRegion, w.spawn);

  return (
    <div className="campaign">
      <div className="camp-stats">
        <div className="camp-stat">
          <span className="muted small">{t("Total Worlds")}</span>
          <b>{campaign.total}</b>
        </div>
        <div className="camp-stat">
          <span className="muted small">{t("Completed Worlds")}</span>
          <b>
            {campaign.completed} / {campaign.total}
          </b>
        </div>
        <div className="camp-stat">
          <span className="muted small">{t("Current World")}</span>
          <b>{campaign.current ? t(campaign.current.name) : "—"}</b>
        </div>
        <div className="camp-stat camp-progress">
          <span className="muted small">{t("Overall Progress")}</span>
          <b>{campaign.percent}%</b>
          <div
            className="bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={campaign.percent}
          >
            <div
              className="bar-fill"
              style={{ width: `${campaign.percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className={`camp-grid ${loaded ? "ready" : ""}`} role="list">
        {campaign.worlds.map((w) => (
          <button
            key={w.packId}
            role="listitem"
            className={`world-card ${w.status} ${w.current ? "current" : ""} ${sel.number === w.number ? "sel" : ""}`}
            aria-pressed={sel.number === w.number}
            aria-disabled={w.status === "locked"}
            onClick={() => setSelected(w.number)}
          >
            <WorldThumb theme={w.cityTheme} />
            <span className="world-num">{t("World {n}", { n: w.number })}</span>
            <span className={`world-status ${w.status}`}>
              <i aria-hidden="true">{STATUS_ICON[w.status]}</i> {statusLabel(w)}
            </span>
            {w.status === "locked" && (
              <span className="world-lock" aria-hidden="true">
                🔒
              </span>
            )}
            <span className="world-info">
              <b className="world-name">{t(w.name)}</b>
              {w.bossName && (
                <span className="world-boss">⚔ {t(w.bossName)}</span>
              )}
              {w.current && (
                <span className="world-here">
                  ●{" "}
                  {t(
                    w.inArena ? "Current Level — Boss Arena" : "Current Level",
                  )}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="camp-actions">
        <div className="camp-sel">
          <b>
            {t("World {n}", { n: sel.number })} · {t(sel.name)}
          </b>
          <span className="muted small">{t(sel.description)}</span>
          <span className="muted small">
            {sel.status === "locked" && sel.requiresBossName
              ? t("Defeat {name} to unlock", { name: t(sel.requiresBossName) })
              : sel.bossName
                ? t("Boss: {name}", { name: t(sel.bossName) })
                : ""}
          </span>
        </div>
        {sel.status !== "locked" && sel.current && hasSave && (
          <button
            className="btn primary small-btn"
            disabled={busy}
            onClick={() => void go(() => gameApi.continueGame())}
          >
            {t("Continue")}
          </button>
        )}
        {sel.status === "unlocked" && !(sel.current && hasSave) && (
          <button
            className="btn primary small-btn"
            disabled={busy}
            onClick={() => void go(() => play(sel))}
          >
            {t("Play")}
          </button>
        )}
        {sel.status === "completed" && (
          <button
            className="btn small-btn"
            disabled={busy}
            onClick={() => void go(() => play(sel))}
          >
            {t("Replay")}
          </button>
        )}
        <button className="btn small-btn" onClick={() => setPanel("root")}>
          {t("Back")}
        </button>
      </div>
    </div>
  );
}
