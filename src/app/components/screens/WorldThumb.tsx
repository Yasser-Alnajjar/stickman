import type { ReactElement } from 'react';
import { themeOf } from '@/game/world/themes';

const cache = new Map<string, string>();
const W = 320, H = 180;

/** Paints a world's own backdrop (sky + far + mid parallax layers) into a still image. Cached per theme. */
export function themeThumbUrl(themeId: string): string {
  const hit = cache.get(themeId);
  if (hit !== undefined) return hit;
  let url = '';
  try {
    const art = themeOf(themeId).backdrop;
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
    url = c.toDataURL('image/jpeg', 0.8);
  } catch (e) {
    console.warn('[thumb] could not render', themeId, e);
  }
  cache.set(themeId, url);
  return url;
}

export function WorldThumb({ theme, className }: { theme: string; className?: string }): ReactElement {
  const url = themeThumbUrl(theme);
  return <div className={`thumb ${className ?? ''}`} style={url ? { backgroundImage: `url(${url})` } : undefined} aria-hidden="true" />;
}
