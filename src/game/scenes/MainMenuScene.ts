import Phaser from 'phaser';
import { StickmanRig } from '@/game/animations/StickmanRig';
import { makePose } from '@/game/animations/pose';
import { poseAttack } from '@/game/animations/clips';
import { PLAYER_ATTACKS } from '@/game/config/attacks';
import { COLORS } from '@/shared/constants';
import { computeZoom } from '@/game/utils/viewport';
import { audio } from '@/game/managers/AudioManager';
import { bus } from '@/game/events/bus';
import type { BackdropScene } from './BackdropScene';

const ROUTINE = ['punch1', 'punch2', 'combo_kick', 'combo_heavy'] as const;

/** Animated backdrop behind the React main menu: the hero shadow-boxes the combo chain. */
export class MainMenuScene extends Phaser.Scene {
  private rig!: StickmanRig;
  private ground!: Phaser.GameObjects.Graphics;
  private pose = makePose();
  private idx = 0;
  private t = 0;
  private scroll = 0;
  private phase: 'startup' | 'active' | 'recovery' = 'startup';

  constructor() { super('MainMenu'); }

  create(): void {
    this.rig = new StickmanRig(this, { color: COLORS.player, lineWidth: 5, scale: 1.9, accessory: 'hero', accent: COLORS.playerAccent, headRadius: 10 }, 5);
    this.ground = this.add.graphics();
    this.ground.fillStyle(0x1a1f3d, 1).fillRect(-4000, 0, 8000, 900).fillStyle(0x4a5490, 1).fillRect(-4000, 0, 8000, 8);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.applyZoom, this));
    (this.scene.get('Backdrop') as BackdropScene).setTheme('neon');
    audio.playMusic('city');
    bus.emit('state', 'menu');
  }

  private applyZoom(): void {
    const cam = this.cameras.main;
    cam.setZoom(computeZoom(this.scale.width, this.scale.height));
    cam.centerOn(-260, -150);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    this.t += dt;
    this.scroll += dt * 0.03;
    (this.scene.get('Backdrop') as BackdropScene).setFocus(this.scroll, 800);
    const def = PLAYER_ATTACKS[ROUTINE[this.idx]];
    const dur = this.phase === 'startup' ? def.startup * 1.6 : this.phase === 'active' ? def.active * 1.6 : def.recovery * 2.4 + (this.idx === 3 ? 700 : 0);
    if (this.t >= dur) {
      this.t = 0;
      if (this.phase === 'startup') this.phase = 'active';
      else if (this.phase === 'active') this.phase = 'recovery';
      else { this.phase = 'startup'; this.idx = (this.idx + 1) % ROUTINE.length; }
    }
    const p = Math.min(1, this.t / Math.max(1, dur));
    poseAttack(this.pose, def.anim, this.phase, p);
    this.rig.draw(0, 0, 1, this.pose, 40, dt);
  }
}
