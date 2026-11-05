import { create } from 'zustand';
import type { BossView, HudSnapshot, ProfileData, ToastMsg } from '@/shared/types';
import type { PlayState } from '@/game/events/bus';
import { createProfile } from '@/game/systems/progression/profile';
import { DEFAULT_AUDIO, type AudioSettings, audio } from '@/game/managers/AudioManager';

export type Panel = 'root' | 'inventory' | 'skills' | 'quests' | 'settings' | 'controls' | 'about' | 'campaign';

export interface GameStore {
  play: PlayState;
  loading: number;
  panel: Panel;
  hud: HudSnapshot;
  profile: ProfileData;
  hasSave: boolean;
  lastSavedAt: number;
  toasts: ToastMsg[];
  boss: BossView | null;
  combo: number;
  banner: { title: string; subtitle?: string } | null;
  region: string;
  error: string | null;
  audio: AudioSettings;
  shake: boolean;
  setPanel(p: Panel): void;
  pushToast(t: Omit<ToastMsg, 'id'>): void;
  dismissToast(id: number): void;
}

let toastId = 1;
const startProfile = createProfile();

const readShake = (): boolean => {
  try { return localStorage.getItem('stickman.shake') !== '0'; } catch { return true; }
};

export const useGameStore = create<GameStore>((set) => ({
  play: 'loading',
  loading: 0,
  panel: 'root',
  hud: {
    health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, energy: 100, maxEnergy: 100,
    cooldowns: { fire_punch: { remaining: 0, total: 1 }, lightning_dash: { remaining: 0, total: 1 } },
  },
  profile: startProfile,
  hasSave: false,
  lastSavedAt: 0,
  toasts: [],
  boss: null,
  combo: 0,
  banner: null,
  region: '',
  error: null,
  audio: audio.settings ?? DEFAULT_AUDIO,
  shake: readShake(),
  setPanel: (panel) => set({ panel }),
  pushToast: (t) => set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id: toastId++ }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
