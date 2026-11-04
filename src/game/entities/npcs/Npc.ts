import Phaser from 'phaser';
import { DEPTH } from '@/shared/constants';
import type { NpcDef } from '@/game/config/npcs';
import { StickmanRig } from '@/game/animations/StickmanRig';
import { makePose } from '@/game/animations/pose';
import { poseIdle, posePointing } from '@/game/animations/clips';
import { QUESTS } from '@/game/config/quests';
import { session } from '@/game/managers/session';
import { questState } from '@/game/systems/quests/quest-engine';
import { t } from '@/i18n';

/** Non-combat character: idles, faces the player, shows a quest marker. */
export class Npc {
  readonly rig: StickmanRig;
  private readonly marker: Phaser.GameObjects.Text;
  private readonly pose = makePose();
  facing: 1 | -1 = -1;
  private t = Math.random() * 6;
  private lastMarker = '';

  constructor(scene: Phaser.Scene, readonly def: NpcDef, readonly x: number, readonly feetY: number) {
    this.rig = new StickmanRig(scene, def.style, DEPTH.npcs);
    this.marker = scene.add.text(x, feetY - 150, '', { fontFamily: 'system-ui, sans-serif', fontSize: '34px', fontStyle: '900', color: '#ffd24a', stroke: '#000', strokeThickness: 5 })
      .setOrigin(0.5).setDepth(DEPTH.npcs + 1);
  }

  /** '!' = quest available, '?' = quest ready to turn in. */
  private markerText(): { text: string; color: string } {
    const p = session.profile;
    let text = '', color = '#ffd24a';
    for (const id of this.def.quests) {
      const st = questState(p, QUESTS[id]);
      if (st === 'ready') return { text: '?', color: '#7dffa0' };
      if (st === 'available') { text = '!'; color = '#ffd24a'; }
      if (st === 'active' && !text) { text = '…'; color = '#9aa3c7'; }
    }
    return { text, color };
  }

  update(dt: number, playerX: number): void {
    this.t += dt / 1000;
    this.facing = playerX >= this.x ? 1 : -1;
    const near = Math.abs(playerX - this.x) < 160;
    if (near) posePointing(this.pose, this.t); else poseIdle(this.pose, this.t);
    this.rig.draw(this.x, this.feetY, this.facing, this.pose, 12, dt);
    const m = this.markerText();
    const key = m.text + m.color;
    if (key !== this.lastMarker) { this.lastMarker = key; this.marker.setText(m.text).setColor(m.color); }
    this.marker.y = this.feetY - 150 + Math.sin(this.t * 3) * 4;
  }

  destroy(): void {
    this.rig.destroy();
    this.marker.destroy();
  }
}
