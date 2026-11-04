import { useSyncExternalStore } from 'react';
import { AR } from './ar';

export type Lang = 'en' | 'ar';
export const LANGS: { id: Lang; label: string; dir: 'ltr' | 'rtl' }[] = [
  { id: 'en', label: 'English', dir: 'ltr' },
  { id: 'ar', label: 'العربية', dir: 'rtl' },
];

const STORAGE_KEY = 'stickman.lang';
const DICTS: Record<Lang, Record<string, string>> = { en: {}, ar: AR };
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ar') return saved;
  } catch { /* storage unavailable */ }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

let current: Lang = detect();

function applyDocument(): void {
  if (typeof document === 'undefined') return;
  const l = LANGS.find((x) => x.id === current)!;
  document.documentElement.lang = l.id;
  document.documentElement.dir = l.dir;
}
applyDocument();

export const getLang = (): Lang => current;
export const isRtl = (): boolean => current === 'ar';

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage unavailable */ }
  applyDocument();
  listeners.forEach((fn) => fn());
}

/**
 * Translates an English source string. The English text is the key, so untranslated strings
 * fall back to English. `{name}` placeholders are replaced from `vars`.
 */
export function t(text: string, vars?: Record<string, string | number>): string {
  const out = DICTS[current][text] ?? text;
  return vars ? out.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : out;
}

export function useLang(): Lang {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, getLang, getLang);
}
