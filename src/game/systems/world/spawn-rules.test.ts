import { describe, expect, it } from 'vitest';
import { hasFallenOut, shouldDespawn, shouldSpawn } from './spawn-rules';

describe('enemy spawn rules', () => {
  it('does not spawn enemies over ground that is not streamed in', () => {
    expect(shouldSpawn(1500, 1700, false)).toBe(false);
    expect(shouldSpawn(1500, 1700, true)).toBe(true);
    expect(shouldSpawn(1800, 1700, true)).toBe(false);
  });
  it('parks enemies whose ground unloads or that are far away', () => {
    expect(shouldDespawn(1500, 2800, false)).toBe(true);
    expect(shouldDespawn(3000, 2800, true)).toBe(true);
    expect(shouldDespawn(1500, 2800, true)).toBe(false);
  });
  it('detects enemies that fell out of the world', () => {
    expect(hasFallenOut(1000, 1080)).toBe(false);
    expect(hasFallenOut(136686, 1080)).toBe(true);
  });
});
