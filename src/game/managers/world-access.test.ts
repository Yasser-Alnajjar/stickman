import { describe, expect, it, vi } from 'vitest';

vi.mock('@/game/managers/AudioManager', () => ({ audio: { unlock: () => undefined, play: () => undefined, playMusic: () => undefined, playQueued: () => undefined, set: () => undefined } }));
vi.mock('@/persistence/save-manager', () => ({ saveManager: { latest: async () => null, save: async () => undefined, load: async () => null, clear: async () => undefined } }));

const { gameApi } = await import('./game-api');
const { runtime } = await import('./runtime');
const { session } = await import('./session');
const { createProfile } = await import('@/game/systems/progression/profile');
const { bus } = await import('@/game/events/bus');
const { REGIONS } = await import('@/game/config/regions');
const { WORLD_PACKS } = await import('@/game/world/stores');

function fakeGame(): { starts: { name: string; init: unknown }[] } {
  const starts: { name: string; init: unknown }[] = [];
  runtime.game = { scene: { isActive: () => false, isPaused: () => false, stop: () => undefined, start: (name: string, init: unknown) => starts.push({ name, init }) } } as never;
  return { starts };
}

describe('direct access to worlds', () => {
  it('locked worlds cannot be started through the API, whatever the caller', async () => {
    const { starts } = fakeGame();
    session.profile = createProfile();
    const errors: string[] = [];
    const off = bus.on('error', (m) => errors.push(m));
    for (const p of WORLD_PACKS.slice(1)) {
      expect(await gameApi.startWorld({ region: p.cityRegion }), p.id).toBe(false);
      expect(await gameApi.startWorld({ region: p.arenaRegion }), p.id).toBe(false);
    }
    expect(starts.length).toBe(0);
    expect(errors.length).toBe(18);
    off();
  });

  it('unknown regions are refused', async () => {
    const { starts } = fakeGame();
    expect(await gameApi.startWorld({ region: 'does_not_exist' })).toBe(false);
    expect(starts.length).toBe(0);
  });

  it('world 1 always starts, and each boss defeat unlocks exactly the next world', async () => {
    const { starts } = fakeGame();
    session.profile = createProfile();
    expect(await gameApi.startWorld({ region: WORLD_PACKS[0].cityRegion })).toBe(true);
    for (let i = 0; i < 9; i++) {
      session.profile.defeatedBosses.push(WORLD_PACKS[i].boss.id);
      expect(await gameApi.startWorld({ region: WORLD_PACKS[i + 1].cityRegion }), `world ${i + 2}`).toBe(true);
      if (i < 8) expect(await gameApi.startWorld({ region: WORLD_PACKS[i + 2].cityRegion }), `world ${i + 3} still locked`).toBe(false);
    }
    expect(starts.length).toBe(10);
    expect(starts.every((s) => s.name === 'World')).toBe(true);
  });

  it('starting a world loads its level data on demand', async () => {
    fakeGame();
    session.profile = createProfile();
    session.profile.defeatedBosses = WORLD_PACKS.slice(0, 9).map((p) => p.boss.id);
    await gameApi.startWorld({ region: WORLD_PACKS[9].arenaRegion });
    expect(REGIONS[WORLD_PACKS[9].arenaRegion]).toBeDefined();
  });
});
