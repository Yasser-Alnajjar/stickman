import { bus } from '@/game/events/bus';
import { useGameStore } from '@/store/game-store';

/**
 * Subscribes the store to the game event bus. Returns one cleanup function; call it exactly once per bind
 * (React effect cleanup) so listeners can never be duplicated.
 */
export function bindGameToStore(): () => void {
  const set = useGameStore.setState;
  const get = useGameStore.getState;
  const offs = [
    bus.on('hud:update', (hud) => set({ hud })),
    bus.on('profile:changed', (profile) => set({ profile })),
    bus.on('toast', (t) => get().pushToast(t)),
    bus.on('dialogue:update', (dialogue) => set({ dialogue })),
    bus.on('boss:update', (boss) => set({ boss })),
    bus.on('prompt', (prompt) => set({ prompt })),
    bus.on('combo', (combo) => set({ combo })),
    bus.on('banner', (banner) => set({ banner })),
    bus.on('region', (region) => set({ region })),
    bus.on('loading', (loading) => set({ loading })),
    bus.on('error', (error) => set({ error })),
    bus.on('saved', ({ slot, at }) => set({ hasSave: slot !== 'none', lastSavedAt: at })),
    bus.on('state', (play) => set((s) => ({ play, panel: play === 'paused' || play === 'menu' ? 'root' : s.panel, ...(play === 'menu' ? { dialogue: null, boss: null, combo: 0, prompt: null, banner: null } : {}) }))),
  ];
  return () => offs.forEach((off) => off());
}
