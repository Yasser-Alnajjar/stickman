import { beforeEach, describe, expect, it } from 'vitest';
import { joystickAxes, touchInput } from './TouchInput';

describe('joystickAxes', () => {
  it('ignores the dead zone', () => expect(joystickAxes(5, 0, 48).moveX).toBe(0));
  it('maps horizontal pushes to -1 / 1', () => {
    expect(joystickAxes(-40, 0, 48).moveX).toBe(-1);
    expect(joystickAxes(40, 0, 48).moveX).toBe(1);
  });
  it('treats a strong downward pull as block, not a sideways diagonal graze', () => {
    expect(joystickAxes(0, 40, 48).down).toBe(true);
    expect(joystickAxes(40, 10, 48).down).toBe(false);
  });
});

describe('touchInput', () => {
  beforeEach(() => touchInput.releaseAll());
  it('keeps a press edge even if released before the next poll', () => {
    touchInput.press('light');
    touchInput.release('light');
    expect(touchInput.take('light')).toBe(true);
    expect(touchInput.take('light')).toBe(false);
  });
  it('counts overlapping holds per action', () => {
    touchInput.press('block'); touchInput.press('block');
    touchInput.release('block');
    expect(touchInput.isHeld('block')).toBe(true);
    touchInput.release('block');
    expect(touchInput.isHeld('block')).toBe(false);
  });
  it('releaseAll clears holds, edges and the stick (cancel / blur)', () => {
    touchInput.press('jump'); touchInput.press('block'); touchInput.setStick(1, true);
    touchInput.releaseAll();
    expect(touchInput.isHeld('jump') || touchInput.isHeld('block')).toBe(false);
    expect(touchInput.take('jump')).toBe(false);
    expect(touchInput.moveX).toBe(0);
    expect(touchInput.down).toBe(false);
  });
});
