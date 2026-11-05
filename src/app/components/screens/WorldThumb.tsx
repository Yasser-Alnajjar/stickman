import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { themeAsync } from '@/game/world/loader';
import type { WorldTheme } from '@/game/world/types';

const cache = new Map<string, string>();
const W = 320, H = 180;

/** Paints a theme's own backdrop (sky + far + mid parallax layers) into a still image. */
function paint(theme: WorldTheme): string {
  const art = theme.backdrop;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 0, H);
  for (const [o, col] of art.sky) sky.addColorStop(o, col);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (const layer of [art.far, art.mid]) {
    const tile = document.createElement('canvas');
    tile.width = layer.w; tile.height = layer.h;
    layer.draw(tile.getContext('2d')!, layer.w, layer.h);
    const s = (H * 0.95) / layer.h;
    g.drawImage(tile, 0, 0, Math.min(layer.w, W / s), layer.h, 0, H - layer.h * s, Math.min(layer.w * s, W), layer.h * s);
  }
  return c.toDataURL('image/jpeg', 0.8);
}

/** One thumbnail at a time, with a pause between them, so opening the world map never blocks a frame for long. */
let queue: Promise<void> = Promise.resolve();
const idle = (): Promise<void> => new Promise((res) => setTimeout(res, 16));

export function themeThumbUrl(themeId: string): Promise<string> {
  const hit = cache.get(themeId);
  if (hit !== undefined) return Promise.resolve(hit);
  const job = queue.then(async () => {
    const again = cache.get(themeId);
    if (again !== undefined) return again;
    let url = '';
    try {
      const theme = await themeAsync(themeId);
      if (theme) url = paint(theme);
    } catch (e) {
      console.warn('[thumb] could not render', themeId, e);
    }
    cache.set(themeId, url);
    await idle();
    return url;
  });
  queue = job.then(() => undefined, () => undefined);
  return job;
}

/** Renders lazily: nothing is generated until the card scrolls into view. */
export function WorldThumb({ theme, className }: { theme: string; className?: string }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string>(cache.get(theme) ?? '');

  useEffect(() => {
    if (url) return;
    const el = ref.current;
    let alive = true;
    const start = (): void => { void themeThumbUrl(theme).then((u) => { if (alive) setUrl(u); }); };
    if (!el || typeof IntersectionObserver === 'undefined') { start(); return () => { alive = false; }; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '120px' });
    io.observe(el);
    return () => { alive = false; io.disconnect(); };
  }, [theme, url]);

  return <div ref={ref} className={`thumb ${className ?? ''}`} style={url ? { backgroundImage: `url(${url})` } : undefined} aria-hidden="true" />;
}
