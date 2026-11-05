import { MAX_VIEW_WIDTH, MIN_VIEW_WIDTH, VIEW_HEIGHT, WORLD_HEIGHT } from '@/shared/constants';

let dpr = 1;
export const getDpr = (): number => dpr;
export const setDpr = (v: number): void => { dpr = v; };
/**
 * Resolution factor for the tiled backdrop canvases. Phones get ~40% fewer pixels (a theme is ~13 MB at full size,
 * and the layers are heavily blurred by parallax anyway); desktops paint at full size.
 */
export function backdropQuality(): number {
  try {
    const small = Math.min(window.screen.width, window.screen.height) <= 820 || matchMedia('(pointer: coarse)').matches;
    return small ? 0.6 : 1;
  } catch { return 1; }
}

export const detectDpr = (): number => Math.min(2, Math.max(1, window.devicePixelRatio || 1));

/**
 * Camera zoom (in device pixels) for a canvas of `gameW x gameH` device pixels.
 * Keeps a constant ~720 world-unit vertical field of view and limits the horizontal field of view
 * to a sane range so ultrawide and narrow windows both play well.
 */
export function computeZoom(gameW: number, gameH: number): number {
  const cssW = gameW / dpr, cssH = gameH / dpr;
  let z = Math.min(cssH / VIEW_HEIGHT, cssW / MIN_VIEW_WIDTH);
  z = Math.max(z, cssW / MAX_VIEW_WIDTH, cssH / WORLD_HEIGHT); // never show more than the world's height
  return z * dpr;
}
