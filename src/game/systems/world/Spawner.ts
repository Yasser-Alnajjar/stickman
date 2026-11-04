import type { SpawnDef } from '@/game/config/regions';
import { ENEMIES } from '@/game/config/enemies';
import { Enemy } from '@/game/entities/enemies/Enemy';
import type { WorldContext } from './context';
import { hasFallenOut, shouldDespawn, shouldSpawn } from './spawn-rules';

interface Entry { def: SpawnDef; enemy: Enemy | null; killed: boolean }

/**
 * Activates enemies near the player and parks them (destroys them) when far away,
 * so only a handful of fighters ever cost CPU/GPU time.
 */
export class EnemySpawner {
  private readonly entries: Entry[];
  readonly active = new Set<Enemy>();
  private acc = 0;
  private readonly spawnRadius = 1700;
  private readonly despawnRadius = 2800;

  constructor(private readonly ctx: WorldContext, defs: SpawnDef[]) {
    this.entries = defs.map((def) => ({ def, enemy: null, killed: false }));
  }

  /** Creates an enemy outside the spawn table (boss minions). */
  create(kind: keyof typeof ENEMIES, x: number, y: number, patrol: number): Enemy {
    const e = new Enemy(this.ctx, ENEMIES[kind], x, y, patrol);
    this.active.add(e);
    return e;
  }

  update(dt: number, playerX: number): void {
    this.acc += dt;
    if (this.acc >= 250) {
      this.acc = 0;
      for (const en of this.entries) {
        if (en.killed) continue;
        const dist = Math.abs(en.def.x - playerX);
        if (!en.enemy && shouldSpawn(dist, this.spawnRadius, this.ctx.isLoadedAt(en.def.x))) {
          const e = new Enemy(this.ctx, ENEMIES[en.def.kind], en.def.x, (en.def.y ?? this.ctx.region.groundY) - 2, en.def.patrol);
          e.onKilled = () => { en.killed = true; };
          en.enemy = e;
          this.active.add(e);
        } else if (en.enemy && en.enemy.alive && (hasFallenOut(en.enemy.cy, this.ctx.region.height) || shouldDespawn(Math.abs(en.enemy.cx - playerX), this.despawnRadius, this.ctx.isLoadedAt(en.enemy.cx)))) {
          this.active.delete(en.enemy);
          en.enemy.destroy();
          en.enemy = null;
        }
      }
    }
    for (const e of this.active) {
      e.update(dt);
      if (e.removed) {
        this.active.delete(e);
        e.destroy();
        for (const en of this.entries) if (en.enemy === e) en.enemy = null;
      }
    }
  }

  get aliveCount(): number {
    let n = 0;
    for (const e of this.active) if (e.alive) n++;
    return n;
  }

  destroy(): void {
    for (const e of this.active) e.destroy();
    this.active.clear();
  }
}
