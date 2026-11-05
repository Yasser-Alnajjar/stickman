export const VIEW_HEIGHT = 640;
export const WORLD_HEIGHT = 1080;
export const MIN_VIEW_WIDTH = 960;
export const MAX_VIEW_WIDTH = 1920;
export const GRAVITY = 1900;
export const CHUNK_WIDTH = 1600;

export const DEPTH = {
  sky: 0, far: 1, mid: 2,
  decor: 10, solids: 20, pickups: 28, enemies: 40, boss: 42, player: 50,
  fx: 60, foreground: 70, secret: 80, hitbox: 90,
} as const;

export const COLORS = {
  player: 0xf4f7ff, playerAccent: 0xff4d5e,
  basic: 0xff9a5c, fast: 0xb06bff, heavy: 0x5cd1a0, boss: 0xff3b3b, archer: 0xe6c36a, guard: 0x8fb4ff, blade: 0xff5c7a,
  fire: 0xff7a1a, fireCore: 0xffd24a, lightning: 0x5cf0ff, spark: 0xfff1b0, ice: 0x9fe4ff, coin: 0xffd24a,
} as const;
