import type {
  BossView, HudSnapshot, ProfileData, SfxName, ToastMsg,
} from '@/shared/types';

type Handler<T> = (payload: T) => void;

export class TypedEmitter<E extends { [K in keyof E]: unknown }> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  off<K extends keyof E>(event: K, handler: Handler<E[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of [...set]) (h as Handler<E[K]>)(payload);
  }

  listenerCount(event?: keyof E): number {
    if (event) return this.handlers.get(event)?.size ?? 0;
    let n = 0;
    this.handlers.forEach((s) => (n += s.size));
    return n;
  }
}

export type PlayState = 'loading' | 'menu' | 'playing' | 'paused' | 'dead' | 'complete';

export interface GameEvents {
  'hud:update': HudSnapshot;
  'profile:changed': ProfileData;
  'toast': Omit<ToastMsg, 'id'>;
  'boss:update': BossView | null;
  'combo': number;
  'region': string;
  'state': PlayState;
  'loading': number;
  'saved': { slot: string; at: number; auto: boolean };
  'error': string;
  'sfx': SfxName;
  'banner': { title: string; subtitle?: string } | null;
}

/** Single event bus between the Phaser game and the React UI. */
export const bus = new TypedEmitter<GameEvents>();
