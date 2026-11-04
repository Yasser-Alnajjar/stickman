import { migrate, serializeSave, type SaveFile } from '@/persistence/save-schema';
import type { ProfileData } from '@/shared/types';

const DB_NAME = 'stickman-open-world';
const DB_VERSION = 1;
const STORE = 'saves';

export type SlotId = 'manual' | 'auto';
const SLOTS: SlotId[] = ['manual', 'auto'];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error ?? new Error('IndexedDB transaction failed'));
      t.onabort = () => reject(t.error ?? new Error('IndexedDB transaction aborted'));
    });
  } finally {
    db.close();
  }
}

export interface LoadedSave { slot: SlotId; save: SaveFile }

export const saveManager = {
  async save(slot: SlotId, profile: ProfileData): Promise<SaveFile> {
    const file = serializeSave(profile);
    await tx('readwrite', (s) => s.put(file, slot));
    return file;
  },

  /** Returns a validated save, or null if missing / corrupted / incompatible. */
  async load(slot: SlotId): Promise<SaveFile | null> {
    try {
      const raw = await tx<unknown>('readonly', (s) => s.get(slot));
      if (raw === undefined) return null;
      const res = migrate(raw);
      if (!res.ok) {
        console.warn(`[save] slot "${slot}" rejected: ${res.error}`);
        return null;
      }
      return res.save;
    } catch (err) {
      console.warn('[save] load failed', err);
      return null;
    }
  },

  /** Most recent valid save across slots. */
  async latest(): Promise<LoadedSave | null> {
    const found: LoadedSave[] = [];
    for (const slot of SLOTS) {
      const save = await this.load(slot);
      if (save) found.push({ slot, save });
    }
    found.sort((a, b) => b.save.savedAt - a.save.savedAt);
    return found[0] ?? null;
  },

  async clear(slot: SlotId): Promise<void> {
    try {
      await tx('readwrite', (s) => s.delete(slot));
    } catch (err) {
      console.warn('[save] clear failed', err);
    }
  },
};
