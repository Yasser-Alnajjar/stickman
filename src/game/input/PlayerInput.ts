import Phaser from 'phaser';
import { touchInput } from '@/game/input/TouchInput';

export interface Intent {
  moveX: -1 | 0 | 1;
  jumpPressed: boolean;
  jumpHeld: boolean;
  dashPressed: boolean;
  dodgePressed: boolean;
  blockHeld: boolean;
  downHeld: boolean;
  light: boolean;
  kick: boolean;
  heavy: boolean;
  ability1: boolean;
  ability2: boolean;
  tonic: boolean;
  cell: boolean;
}

export const neutralIntent = (): Intent => ({
  moveX: 0, jumpPressed: false, jumpHeld: false, dashPressed: false, dodgePressed: false, blockHeld: false,
  downHeld: false, light: false, kick: false, heavy: false, ability1: false, ability2: false,
  tonic: false, cell: false,
});

type KeyMap = Record<'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space' | 'shift' | 'x' | 'c' | 'down' | 's'
  | 'j' | 'k' | 'l' | 'one' | 'two' | 'h' | 'g', Phaser.Input.Keyboard.Key>;

/** Reads the keyboard (and the virtual touch controls) into one reusable intent struct. */
export class PlayerInput {
  private readonly keys: KeyMap;
  readonly intent: Intent = neutralIntent();
  private readonly kb: Phaser.Input.Keyboard.KeyboardPlugin;
  /** Edge-triggered presses are recorded from key events so a tap shorter than one frame is never lost. */
  private readonly edge = new Set<keyof KeyMap>();

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('Keyboard plugin unavailable');
    this.kb = kb;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      left: K.LEFT, right: K.RIGHT, a: K.A, d: K.D, up: K.UP, w: K.W, space: K.SPACE, shift: K.SHIFT,
      x: K.X, c: K.C, down: K.DOWN, s: K.S, j: K.J, k: K.K, l: K.L, one: K.ONE, two: K.TWO,
      h: K.H, g: K.G,
    }, true) as KeyMap;
    for (const name of Object.keys(this.keys) as (keyof KeyMap)[]) this.keys[name].on('down', () => this.edge.add(name));
  }

  private took(...names: (keyof KeyMap)[]): boolean {
    let hit = false;
    for (const n of names) if (this.edge.delete(n)) hit = true;
    return hit;
  }

  /** `locked` zeroes gameplay input (death) but still tracks edge state so presses don't leak. */
  poll(locked: boolean): Intent {
    const k = this.keys, I = this.intent;
    const T = touchInput;
    const jump = this.took('space', 'up', 'w') || T.take('jump');
    const dash = this.took('shift') || T.take('dash'), dodge = this.took('x', 'c') || T.take('dodge');
    const light = this.took('j') || T.take('light'), kick = this.took('k') || T.take('kick'), heavy = this.took('l') || T.take('heavy');
    const a1 = this.took('one') || T.take('ability1'), a2 = this.took('two') || T.take('ability2');
    const tonic = this.took('h') || T.take('tonic'), cell = this.took('g') || T.take('cell');
    this.edge.clear();
    T.dropEdges();
    if (locked) {
      Object.assign(I, neutralIntent());
      return I;
    }
    const left = k.left.isDown || k.a.isDown || T.moveX < 0, right = k.right.isDown || k.d.isDown || T.moveX > 0;
    I.moveX = left === right ? 0 : left ? -1 : 1;
    I.jumpPressed = jump;
    I.jumpHeld = k.space.isDown || k.up.isDown || k.w.isDown || T.isHeld('jump');
    I.dashPressed = dash;
    I.dodgePressed = dodge;
    I.blockHeld = k.down.isDown || k.s.isDown || T.down || T.isHeld('block');
    I.downHeld = I.blockHeld;
    I.light = light; I.kick = kick; I.heavy = heavy;
    I.ability1 = a1; I.ability2 = a2;
    I.tonic = tonic; I.cell = cell;
    return I;
  }

  reset(): void {
    this.kb.resetKeys();
    this.edge.clear();
    touchInput.releaseAll();
  }

  destroy(): void {
    this.kb.removeAllKeys(true);
  }
}
