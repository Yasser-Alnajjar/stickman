import { useSyncExternalStore } from 'react';

/** 'auto' follows the primary pointer / first touch; 'on' and 'off' are user overrides (Settings). */
export type TouchPref = 'auto' | 'on' | 'off';
const KEY = 'stickman.touch';

export interface DeviceState { touch: boolean; portrait: boolean }

const readPref = (): TouchPref => {
  try {
    const q = new URLSearchParams(location.search).get('touch');
    if (q === '1') return 'on';
    if (q === '0') return 'off';
    const v = localStorage.getItem(KEY);
    if (v === 'on' || v === 'off') return v;
  } catch { /* storage unavailable */ }
  return 'auto';
};

let pref: TouchPref = readPref();
let sawTouch = false;
let state: DeviceState = { touch: false, portrait: false };
const listeners = new Set<() => void>();

const mq = (q: string): boolean => typeof matchMedia === 'function' && matchMedia(q).matches;

function compute(): DeviceState {
  const coarse = mq('(pointer: coarse)') || (mq('(any-pointer: coarse)') && !mq('(any-pointer: fine)'));
  const touch = pref === 'on' ? true : pref === 'off' ? false : coarse || sawTouch;
  const portrait = touch && window.innerHeight > window.innerWidth;
  return { touch, portrait };
}

function refresh(): void {
  const next = compute();
  if (next.touch === state.touch && next.portrait === state.portrait) return;
  state = next;
  document.documentElement.toggleAttribute('data-touch', next.touch);
  listeners.forEach((fn) => fn());
}

let started = false;
function start(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  state = compute();
  document.documentElement.toggleAttribute('data-touch', state.touch);
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' && !sawTouch) { sawTouch = true; refresh(); }
  }, { passive: true, capture: true });
  for (const q of ['(pointer: coarse)', '(any-pointer: fine)']) matchMedia(q).addEventListener?.('change', refresh);
}

export const getTouchPref = (): TouchPref => pref;
export function setTouchPref(p: TouchPref): void {
  pref = p;
  try { if (p === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, p); } catch { /* storage unavailable */ }
  refresh();
  listeners.forEach((fn) => fn());
}

export function useDevice(): DeviceState {
  start();
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => state, () => state);
}
