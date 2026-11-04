import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useGameStore } from '@/store/game-store';
import { gameApi } from '@/game/managers/game-api';
import { session } from '@/game/managers/session';
import { audio } from '@/game/managers/AudioManager';
import { touchInput } from '@/game/input/TouchInput';

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/**
 * Android (Capacitor) lifecycle + system Back wiring. No-op in the browser, so the web build is unchanged.
 * - pause: release held touches, pause gameplay, flush an auto-save, suspend audio.
 * - resume: resume audio (gameplay stays paused behind the pause menu until the player resumes).
 * - back: close sub-panels first, then pause/resume, and exit only from the root main menu.
 */
export function installNativeBridge(): () => void {
  if (!isNativeApp()) return () => {};
  // Ask the WebView to keep IndexedDB from being evicted under storage pressure.
  void navigator.storage?.persist?.().catch(() => {});

  const handles: Promise<{ remove: () => Promise<void> }>[] = [];

  handles.push(CapApp.addListener('pause', () => {
    touchInput.releaseAll();
    // Only save while a world session is live; saving from the menu would overwrite real progress with a blank profile.
    const wasInWorld = useGameStore.getState().play === 'playing' || useGameStore.getState().play === 'paused';
    if (useGameStore.getState().play === 'playing') gameApi.pause();
    if (wasInWorld) void session.autoSave(true).catch(() => {});
    audio.suspend();
  }));
  handles.push(CapApp.addListener('resume', () => {
    touchInput.releaseAll();
    audio.resumeContext();
  }));
  handles.push(CapApp.addListener('backButton', () => {
    const { play, panel, setPanel } = useGameStore.getState();
    if (play === 'playing') gameApi.pause();
    else if (play === 'paused') { if (panel === 'root') gameApi.resume(); else setPanel('root'); }
    else if (play === 'menu') { if (panel !== 'root') setPanel('root'); else void CapApp.exitApp(); }
    // loading / dead: ignore Back so it cannot interrupt a transition.
  }));

  return () => { handles.forEach((h) => void h.then((x) => x.remove())); };
}
