import Phaser from 'phaser';
import type { AttackDef, Facing, HitSpec, ProjectileSpec } from '@/shared/types';
import { DEPTH } from '@/shared/constants';
import type { Fighter } from '@/game/entities/Fighter';
import type { Fx } from '@/game/managers/Fx';
import type { CombatSystem } from './CombatSystem';
import { registerProjectileHits, stepProjectile, type SimProjectile } from '@/game/weapons/projectile-sim';
import { audio } from '@/game/managers/AudioManager';

interface Live extends SimProjectile {
  spec: ProjectileSpec;
  hit: HitSpec;
  hits: Set<number>;
  owner: Fighter;
  dir: Facing;
}

const rect = new Phaser.Geom.Rectangle();

/**
 * Bolts, crescent waves and ground shockwaves fired by the player's weapons. Movement is the pure `projectile-sim`;
 * every collision goes through `CombatSystem.hitRect`, so shields, boss invulnerability, hit-sets and the hit gate all
 * apply exactly as they do for melee.
 */
export class PlayerProjectiles {
  private readonly live: Live[] = [];
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, private readonly combat: CombatSystem, private readonly fx: Fx, private readonly bounds: () => { width: number; groundY: number }) {
    this.g = scene.add.graphics().setDepth(DEPTH.fx - 1);
  }

  fire(owner: Fighter, spec: ProjectileSpec, hit: HitSpec, dir: Facing): void {
    const sides: Facing[] = spec.bothSides ? [1, -1] : [dir];
    for (const d of sides) {
      const y = spec.ground ? owner.feetY - spec.h / 2 - 2 : owner.cy + (spec.oy ?? -10);
      this.live.push({
        x: owner.cx + d * (owner.w / 2 + 10), y, vx: d * spec.speed, vy: 0, ay: 0, life: spec.life,
        pierceLeft: spec.pierce, dead: false, struck: false, spec, hit, hits: new Set(), owner, dir: d,
      });
    }
  }

  update(dt: number): void {
    const { width, groundY } = this.bounds();
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      stepProjectile(p, dt);
      if (p.x < 0 || p.x > width) p.dead = true;
      if (!p.dead) {
        rect.setTo(p.x - p.spec.w / 2, p.y - p.spec.h / 2, p.spec.w, p.spec.h);
        const n = this.combat.hitRect(p.owner, rect, p.hit, p.hits, p.x - p.dir * 30);
        registerProjectileHits(p, n);
      }
      if (p.dead) {
        if (p.spec.burst && (p.struck || p.life <= 0)) this.detonate(p, groundY);
        this.live.splice(i, 1);
      }
    }
    this.draw();
  }

  private detonate(p: Live, _groundY: number): void {
    const b = p.spec.burst!;
    const hitSpec: HitSpec = { ...p.hit, damageMult: p.hit.damageMult * b.damageMult, def: { ...p.hit.def, hitStop: Math.min(p.hit.def.hitStop, 60) } as AttackDef };
    rect.setTo(p.x - b.radius, p.y - b.radius, b.radius * 2, b.radius * 2);
    const seen = new Set<number>(p.hits); // the target the orb struck has already taken the direct hit
    this.combat.hitRect(p.owner, rect, hitSpec, seen, p.x);
    this.fx.ring(p.x, p.y, p.spec.color, 10, b.radius, 320, 5);
    this.fx.hitSparks(p.x, p.y, 0, 10, true);
    this.fx.shake(0.004, 100);
    audio.play('hitHeavy');
  }

  private draw(): void {
    const g = this.g;
    g.clear();
    for (const p of this.live) {
      const s = p.spec;
      const a = Math.min(1, p.life / 120);
      if (s.ground) {
        g.fillStyle(s.color, 0.45 * a).fillEllipse(p.x, p.y + s.h * 0.2, s.w * 1.4, s.h * 1.3);
        g.fillStyle(s.color, 0.95 * a).fillTriangle(p.x - p.dir * s.w * 0.6, p.y + s.h / 2, p.x + p.dir * s.w * 0.5, p.y + s.h / 2, p.x, p.y - s.h / 2);
        g.fillStyle(0xffffff, 0.6 * a).fillTriangle(p.x - p.dir * s.w * 0.2, p.y + s.h / 2, p.x + p.dir * s.w * 0.2, p.y + s.h / 2, p.x, p.y - s.h * 0.1);
      } else if (s.pierce < 0) {
        // crescent
        g.lineStyle(s.w * 0.28, s.color, 0.9 * a);
        g.beginPath();
        g.arc(p.x - p.dir * s.w * 0.9, p.y, s.h * 0.55, p.dir > 0 ? -0.9 : Math.PI - 0.9, p.dir > 0 ? 0.9 : Math.PI + 0.9, false);
        g.strokePath();
        g.lineStyle(s.w * 0.1, 0xffffff, 0.8 * a);
        g.beginPath();
        g.arc(p.x - p.dir * s.w * 0.9, p.y, s.h * 0.55, p.dir > 0 ? -0.8 : Math.PI - 0.8, p.dir > 0 ? 0.8 : Math.PI + 0.8, false);
        g.strokePath();
      } else {
        g.fillStyle(s.color, 0.28 * a).fillCircle(p.x, p.y, s.h * 1.15);
        g.fillStyle(s.color, 1).fillEllipse(p.x, p.y, s.w, s.h);
        g.fillStyle(0xffffff, 0.85).fillEllipse(p.x + p.dir * 3, p.y, s.w * 0.45, s.h * 0.45);
        if (Math.random() < 0.5) this.fx.fireTick(p.x - p.dir * s.w * 0.4, p.y);
      }
    }
  }

  destroy(): void { this.live.length = 0; this.g.destroy(); }
}
