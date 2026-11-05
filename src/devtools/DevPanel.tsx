import type { CSSProperties, ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import type { BossId, RegionId } from "@/shared/types";
import { bossOrder } from "@/game/config/enemies";
import { runtime } from "@/game/managers/runtime";
import { WORLD_PACKS } from "@/game/world/worlds";
import { t, useLang } from "@/i18n";
import { devFlags } from "./flags";
import { dt } from "./strings";
import * as dev from "./actions";

interface Snap {
  running: boolean;
  stage: string;
  boss: string;
  bossState: string;
  hp: string;
  state: string;
  pos: string;
  theme: string;
  fps: string;
  chunks: string;
  stageId: string;
  god: boolean;
  inf: boolean;
  unlock: boolean;
  sandbox: boolean;
}

function snapshot(): Snap {
  const w = runtime.world;
  const b = w?.boss;
  return {
    running: !!w,
    stageId: w?.region.id ?? "",
    stage: dev.stageName(w?.region.id),
    boss: b
      ? dev.BOSSES[b.bossId].name
      : w?.region.boss
        ? "defeated"
        : "none here",
    bossState: b
      ? `${b.alive ? (b.engaged ? "fighting" : "waiting") : "dead"}|${Math.max(0, Math.ceil(b.health))}/${b.maxHealth}|${b.phase}`
      : "",
    hp: w ? `${Math.ceil(w.player.health)}/${w.player.maxHealth}` : "-",
    state: w ? `${w.player.state}${w.player.alive ? "" : "|dead"}` : "",
    pos: w ? `${Math.round(w.player.cx)}, ${Math.round(w.player.feetY)}` : "-",
    theme: w?.theme.id ?? "-",
    fps: w ? String(Math.round(w.game.loop.actualFps)) : "-",
    chunks: w ? `${w.chunks.loadedCount} | ${w.region.decor.length}` : "-",
    god: devFlags.god,
    inf: devFlags.infiniteHealth,
    unlock: devFlags.unlockAll,
    sandbox: devFlags.sandbox,
  };
}

const CSS = `
#stickman-devtools-root{position:fixed;z-index:99999;top:8px;inset-inline-end:8px;font:11px/1.35 ui-monospace,Menlo,monospace;color:#d8e6ff}
#stickman-devtools-root .dt-tab{background:#10142b;border:1px solid #3a4272;color:#9fe8ff;padding:3px 8px;border-radius:6px;cursor:pointer;opacity:.85}
#stickman-devtools-root .dt-tab.sb{background:#4a1020;border-color:#ff5c7a;color:#ffd0d8}
#stickman-devtools-root .dt-panel{width:268px;max-height:calc(100vh - 160px);overflow:auto;background:rgba(10,12,28,.96);border:1px solid #3a4272;border-radius:8px;padding:8px}
#stickman-devtools-root h4{margin:8px 0 4px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#7c8bd0;border-bottom:1px solid #232a52}
#stickman-devtools-root .row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:2px}
#stickman-devtools-root button{background:#1b2146;color:#d8e6ff;border:1px solid #3a4272;border-radius:4px;padding:3px 6px;font:inherit;cursor:pointer}
#stickman-devtools-root button:hover{background:#27306a}
#stickman-devtools-root button.on{background:#14532d;border-color:#4ade80;color:#dcfce7}
#stickman-devtools-root button.danger{border-color:#ff5c7a;color:#ffc2cc}
#stickman-devtools-root .kv{display:flex;justify-content:space-between;gap:8px}
#stickman-devtools-root .kv b{color:#9fe8ff;font-weight:600;text-align:end}
#stickman-devtools-root .dt-arrow{display:inline-block}
:root[dir='rtl'] #stickman-devtools-root .dt-arrow{transform:scaleX(-1)}
#stickman-devtools-root .warn{background:#3a0d1a;border:1px solid #ff5c7a;border-radius:4px;padding:4px;margin-bottom:4px;color:#ffd0d8}
`;

function Btn(p: {
  on?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}): ReactElement {
  return (
    <button
      className={`${p.on ? "on" : ""} ${p.danger ? "danger" : ""}`}
      title={p.title ? dt(p.title) : undefined}
      onClick={() => {
        p.onClick();
        (document.activeElement as HTMLElement | null)?.blur();
      }}
    >
      {p.children}
    </button>
  );
}

const KV = ({
  k,
  v,
  ltr,
}: {
  k: string;
  v: string;
  ltr?: boolean;
}): ReactElement => (
  <div className="kv">
    <span>{dt(k)}</span>
    <b dir={ltr ? "ltr" : undefined}>{v}</b>
  </div>
);

export function DevPanel(): ReactElement {
  useLang(); // re-render (and flip direction, handled on <html dir>) whenever the language changes
  const [open, setOpen] = useState(true);
  const [snap, setSnap] = useState<Snap>(snapshot);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const iv = setInterval(() => setSnap(snapshot()), 250);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "F2") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(iv);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const flash = (s: string): void => {
    setMsg(s);
    setTimeout(() => setMsg(""), 2500);
  };
  const toggle = (k: "god" | "infiniteHealth"): void => {
    devFlags[k] = !devFlags[k];
    setSnap(snapshot());
  };

  const [bs, hpTxt, ph] = snap.bossState.split("|");
  const bossState = snap.bossState
    ? `${dt(bs)} · ${hpTxt} · ${dt("phase")} ${ph}`
    : "-";
  const [ps, dead] = snap.state.split("|");
  const playerState = ps ? `${dt(ps)}${dead ? ` (${dt("dead")})` : ""}` : "-";
  const stageBtn = (id: RegionId): ReactElement => (
    <Btn key={id} on={snap.stageId === id} onClick={() => dev.goTo(id)}>
      {t(dev.stageName(id))}
    </Btn>
  );
  const bossNames = (id: BossId): string => t(dev.BOSSES[id].name);

  return (
    <>
      <style>{CSS}</style>
      <div style={{ textAlign: "end" } as CSSProperties}>
        <button
          className={`dt-tab ${snap.sandbox ? "sb" : ""}`}
          onClick={() => setOpen((o) => !o)}
        >
          {dt(snap.sandbox ? "DEV SANDBOX" : "DEV")} {open ? "▾" : "▸"}{" "}
          <small dir="ltr">F2</small>
        </button>
      </div>
      {open && (
        <div className="dt-panel" onKeyDown={(e) => e.stopPropagation()}>
          {snap.sandbox && (
            <div className="warn">
              {dt("Sandbox: saves are disabled, your real save is untouched.")}{" "}
              <Btn onClick={dev.exitSandbox}>{dt("Exit sandbox (reload)")}</Btn>
            </div>
          )}

          <h4>{dt("Status")}</h4>
          <KV k="Stage" v={snap.stage ? t(snap.stage) : "-"} />
          <KV
            k="Boss"
            v={
              snap.running
                ? snap.boss === "defeated" || snap.boss === "none here"
                  ? dt(snap.boss)
                  : t(snap.boss)
                : "-"
            }
          />
          <KV k="Boss state" v={bossState} ltr />
          <KV k="Player HP" v={snap.hp} ltr />
          <KV k="Player state" v={playerState} />
          <KV k="Position" v={snap.pos} ltr />
          <KV k="Theme" v={snap.theme} ltr />
          <KV k="Frame rate" v={snap.fps} ltr />
          <KV k="Chunks | decor" v={snap.chunks} ltr />

          <h4>{dt("Stage Navigation")}</h4>
          <div className="row">
            <Btn onClick={() => dev.stepStage(-1)}>
              <span className="dt-arrow">◀</span> {dt("Prev")}
            </Btn>
            <Btn onClick={() => dev.stepStage(1)}>
              {dt("Next")} <span className="dt-arrow">▶</span>
            </Btn>
            <Btn
              onClick={dev.resetStage}
              title="Restore enemies, chests and the boss, restart at the entrance"
            >
              {dt("Reset stage")}
            </Btn>
          </div>
          <div className="row">{dev.CITIES.map(stageBtn)}</div>
          <div className="row">
            {dev.STAGE_ORDER.filter((id) => !dev.CITIES.includes(id)).map(
              stageBtn,
            )}
          </div>

          <h4>{dt("Worlds")}</h4>
          {WORLD_PACKS.map((pack) => (
            <div className="row" key={pack.id}>
              {stageBtn(pack.cityRegion)}
              <Btn
                on={snap.stageId === pack.arenaRegion}
                onClick={() => dev.goTo(pack.arenaRegion)}
                title="Enter the boss arena at its entrance without starting the fight"
              >
                {dt("Arena")}
              </Btn>
              <Btn
                onClick={() => dev.fightBoss(pack.boss.id)}
                title="Teleport into the arena and start the fight"
              >
                {dt("Entrance")}
              </Btn>
            </div>
          ))}

          <h4>{dt("Boss Selection")}</h4>
          <div className="row">
            {bossOrder().map((id) => (
              <Btn
                key={id}
                onClick={() => dev.fightBoss(id)}
                title="Teleport into the arena and start the fight"
              >
                {dt("Fight")} {bossNames(id).split(" ").slice(-1)[0]}
              </Btn>
            ))}
          </div>
          <div className="row">
            <Btn
              danger
              onClick={() =>
                flash(
                  dt(
                    dev.defeatBossNow()
                      ? "Boss defeated"
                      : "No active boss here",
                  ),
                )
              }
            >
              {dt("Defeat boss now")}
            </Btn>
          </div>

          <h4>{dt("Player Testing")}</h4>
          <div className="row">
            <Btn on={snap.god} onClick={() => toggle("god")}>
              {dt("Super Mode")}
            </Btn>
            <Btn on={snap.inf} onClick={() => toggle("infiniteHealth")}>
              {dt("Infinite health")}
            </Btn>
            <Btn
              on={snap.unlock}
              onClick={() => dev.setUnlockAll(!devFlags.unlockAll)}
            >
              {dt("Unlock all stages")}
            </Btn>
          </div>
          <div className="row">
            <Btn
              onClick={() => {
                runtime.world?.player.fullRestore();
              }}
            >
              {dt("Heal")}
            </Btn>
            <Btn
              onClick={() => {
                dev.restoreNormal();
                flash(dt("Normal gameplay restored"));
              }}
            >
              {dt("Restore normal")}
            </Btn>
          </div>

          <h4>{dt("Progress Management")}</h4>
          <div className="row">
            <Btn
              onClick={dev.resetKills}
              title="Respawn every enemy of the current stage (sandbox only)"
            >
              {dt("Reset enemy kills")}
            </Btn>
            <Btn
              onClick={() =>
                void dev
                  .loadSaveCopy()
                  .then((ok) =>
                    flash(
                      dt(ok ? "Loaded copy of your save" : "No save found"),
                    ),
                  )
              }
              title="Copies your save into the sandbox; the save itself is not modified"
            >
              {dt("Sandbox ← save copy")}
            </Btn>
            <Btn
              onClick={() => {
                if (
                  confirm(
                    dt(
                      "Reset SANDBOX progress to a new game? Your real save is not affected.",
                    ),
                  )
                )
                  dev.resetSandboxProgress();
              }}
            >
              {dt("Reset sandbox progress")}
            </Btn>
          </div>
          <div className="row">
            <Btn
              danger
              onClick={() => {
                if (
                  confirm(dt("DELETE your real save slots permanently?")) &&
                  confirm(
                    dt(
                      "Really delete ALL saved progress? This cannot be undone.",
                    ),
                  )
                )
                  void dev.wipeRealSave();
              }}
            >
              {dt("Wipe REAL save…")}
            </Btn>
          </div>
          {msg && <div style={{ marginTop: 6, color: "#ffe08a" }}>{msg}</div>}
        </div>
      )}
    </>
  );
}
