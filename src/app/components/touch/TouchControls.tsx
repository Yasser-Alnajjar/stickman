import type { PointerEvent as RPointerEvent, ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { ABILITIES, ABILITY_ORDER } from '@/game/config/abilities';
import { installTouchSafety, joystickAxes, onTouchReleaseAll, touchInput, type TouchAction } from '@/game/input/TouchInput';
import { t } from '@/i18n';

const noMenu = (e: { preventDefault(): void }): void => e.preventDefault();

/** Pointer-capture can throw for synthetic/expired pointers; the control must still work without it. */
const capture = (el: Element, id: number): void => { try { el.setPointerCapture(id); } catch { /* not capturable */ } };

interface TouchBtnProps {
  action: TouchAction;
  label: string;
  cls?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** A momentary button: press on pointerdown, release on up/cancel/lost-capture/leave-with-capture-lost. */
function TouchBtn({ action, label, cls = '', children, style }: TouchBtnProps): ReactElement {
  const [down, setDown] = useState(false);
  const pointer = useRef<number | null>(null);
  const end = useCallback((e?: RPointerEvent) => {
    if (e && pointer.current !== null && e.pointerId !== pointer.current) return;
    if (pointer.current !== null) { pointer.current = null; touchInput.release(action); }
    setDown(false);
  }, [action]);
  useEffect(() => {
    const off = onTouchReleaseAll(() => { pointer.current = null; setDown(false); });
    return () => { off(); if (pointer.current !== null) { touchInput.release(action); pointer.current = null; } };
  }, [action]);
  return (
    <button
      type="button"
      className={`tbtn ${cls} ${down ? 'down' : ''}`}
      style={style}
      aria-label={label}
      aria-pressed={down}
      data-action={action}
      onPointerDown={(e) => {
        e.preventDefault();
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        capture(e.currentTarget, e.pointerId);
        touchInput.press(action);
        setDown(true);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onContextMenu={noMenu}
    >
      {children}
    </button>
  );
}

/** Floating joystick: anywhere in the left zone. Horizontal = move, pull down = block / drop through. */
function Joystick(): ReactElement {
  const zone = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const [view, setView] = useState<{ ox: number; oy: number; kx: number; ky: number; active: boolean }>({ ox: 0, oy: 0, kx: 0, ky: 0, active: false });
  const RADIUS = 48;

  const finish = useCallback((e?: RPointerEvent) => {
    if (e && pointer.current !== null && e.pointerId !== pointer.current) return;
    pointer.current = null;
    touchInput.setStick(0, false);
    setView((v) => ({ ...v, kx: 0, ky: 0, active: false }));
  }, []);

  useEffect(() => {
    const off = onTouchReleaseAll(() => { pointer.current = null; setView((v) => ({ ...v, kx: 0, ky: 0, active: false })); });
    return () => { off(); pointer.current = null; touchInput.setStick(0, false); };
  }, []);

  const local = (e: RPointerEvent): { x: number; y: number } => {
    const r = zone.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const update = (e: RPointerEvent): void => {
    const p = local(e);
    let dx = p.x - origin.current.x, dy = p.y - origin.current.y;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) { dx = (dx / len) * RADIUS; dy = (dy / len) * RADIUS; }
    const a = joystickAxes(dx, dy, RADIUS);
    touchInput.setStick(a.moveX, a.down);
    setView({ ox: origin.current.x, oy: origin.current.y, kx: dx, ky: dy, active: true });
  };

  return (
    <div
      ref={zone}
      className={`stick-zone ${view.active ? 'active' : ''}`}
      data-testid="joystick"
      onPointerDown={(e) => {
        e.preventDefault();
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        capture(e.currentTarget, e.pointerId);
        const r = zone.current!.getBoundingClientRect();
        const p = local(e);
        origin.current = { x: Math.max(RADIUS * 0.8, Math.min(r.width - RADIUS * 0.8, p.x)), y: Math.max(RADIUS * 0.8, Math.min(r.height - RADIUS * 0.8, p.y)) };
        update(e);
      }}
      onPointerMove={(e) => { if (e.pointerId === pointer.current) update(e); }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onContextMenu={noMenu}
      role="group"
      aria-label={t('Movement stick')}
    >
      <div className="stick-base" style={view.active ? { left: view.ox, top: view.oy } : undefined}>
        <div className="stick-knob" style={{ transform: `translate(${view.kx}px, ${view.ky}px)` }} />
      </div>
    </div>
  );
}

function AbilityBtn({ index }: { index: 0 | 1 }): ReactElement | null {
  const id = ABILITY_ORDER[index];
  const rank = useGameStore((s) => s.profile.abilities[id]);
  const cd = useGameStore((s) => s.hud.cooldowns[id]);
  const energy = useGameStore((s) => s.hud.energy);
  if (!id || rank <= 0) return null;
  const def = ABILITIES[id];
  const cost = def.energyCost[Math.max(0, rank - 1)];
  const frac = cd.total > 0 ? cd.remaining / cd.total : 0;
  return (
    <TouchBtn action={index === 0 ? 'ability1' : 'ability2'} label={t(def.name)} cls={`ability a${index + 1} ${energy < cost ? 'low' : ''}`} style={{ ['--c' as string]: def.color }}>
      <span className="ticon">{def.icon}</span>
      <span className="tcost">{cost}</span>
      {frac > 0 && <span className="tcd" style={{ height: `${frac * 100}%` }} />}
      {frac > 0 && <span className="tcd-text">{(cd.remaining / 1000).toFixed(1)}</span>}
    </TouchBtn>
  );
}

/** Touch overlay for landscape play. Everything it does goes through `touchInput` -> `PlayerInput`. */
export function TouchControls(): ReactElement {
  const prompt = useGameStore((s) => s.prompt);
  const dialogue = useGameStore((s) => s.dialogue);
  useEffect(() => {
    installTouchSafety();
    return () => touchInput.releaseAll();
  }, []);
  // Dialogue and prompts lock gameplay input; hide the pad so it cannot cover the dialogue box.
  if (dialogue) return <></>;
  return (
    <div className="touch-layer" dir="ltr" data-testid="touch-controls" onContextMenu={noMenu}>
      <Joystick />
      <div className="tpad" role="group" aria-label={t('Action buttons')}>
        <TouchBtn action="jump" label={t('Jump')} cls="jump"><span className="ticon">⤒</span><span className="tlbl">{t('Jump')}</span></TouchBtn>
        <TouchBtn action="light" label={t('Light attack')} cls="light"><span className="ticon">👊</span><span className="tlbl">{t('Light')}</span></TouchBtn>
        <TouchBtn action="heavy" label={t('Heavy attack')} cls="heavy"><span className="ticon">💥</span><span className="tlbl">{t('Heavy')}</span></TouchBtn>
        <TouchBtn action="kick" label={t('Kick')} cls="kick"><span className="ticon">🦶</span><span className="tlbl">{t('Kick')}</span></TouchBtn>
        <TouchBtn action="dash" label={t('Dash')} cls="dash"><span className="ticon">⇢</span><span className="tlbl">{t('Dash')}</span></TouchBtn>
        <TouchBtn action="dodge" label={t('Dodge')} cls="dodge"><span className="ticon">↺</span><span className="tlbl">{t('Dodge')}</span></TouchBtn>
        <TouchBtn action="block" label={t('Block')} cls="block"><span className="ticon">🛡</span><span className="tlbl">{t('Block')}</span></TouchBtn>
        <AbilityBtn index={0} />
        <AbilityBtn index={1} />
      </div>
      {prompt && (
        <TouchBtn action="interact" label={t('Interact')} cls="interact"><span className="ticon">💬</span><span className="tlbl">{t('Talk')}</span></TouchBtn>
      )}
      <div className="tquick">
        <TouchBtn action="tonic" label={t('Health Tonic')} cls="mini"><span className="ticon">🧪</span></TouchBtn>
        <TouchBtn action="cell" label={t('Energy Cell')} cls="mini"><span className="ticon">🔋</span></TouchBtn>
        <button type="button" className="tbtn mini pause-btn" aria-label={t('Pause')} onClick={() => gameApi.pause()} onContextMenu={noMenu}>
          <span className="ticon">❚❚</span>
        </button>
      </div>
    </div>
  );
}
