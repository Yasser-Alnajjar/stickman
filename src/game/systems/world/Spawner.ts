import type { SpawnDef } from '@/game/config/regions';
import { ENEMIES, type EnemyDef } from '@/game/config/enemies';
import { session } from '@/game/managers/session';
import { Enemy } from '@/game/entities/enemies/Enemy';
import type { WorldContext } from './context';
import { hasFallenOut, shouldDespawn, shouldSpawn, spawnKey } from './spawn-rules';

export { spawnKey };

interface Entry { def: SpawnDef; enemy: Enemy | null; killed: boolean }


/** Region difficulty: same enemy kinds hit and endure more the deeper the stage. */
export function scaleDef(def: EnemyDef, scale: { hp: number; atk: number } | undefined): EnemyDef {
  if (!scale) return def;
  return { ...def, maxHealth: Math.round(def.maxHealth * scale.hp), attack: Math.round(def.attack * scale.atk), xp: Math.round(def.xp * scale.hp), gold: Math.round(def.gold * scale.hp) };
}

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
    // Enemies defeated earlier in this playthrough stay dead across area changes, reloads and saves.
    const dead = new Set(session.profile.killedEnemies);
    this.entries = defs.map((def) => ({ def, enemy: null, killed: dead.has(spawnKey(ctx.region.id, def.id)) }));
  }

  /** Creates an enemy outside the spawn table (boss minions). */
  create(kind: keyof typeof ENEMIES, x: number, y: number, patrol: number): Enemy {
    const e = new Enemy(this.ctx, scaleDef(ENEMIES[kind], this.ctx.region.enemyScale), x, y, patrol);
    e.lootScale = 0; // summoned reinforcements never drop coins
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
          const e = new Enemy(this.ctx, scaleDef(ENEMIES[en.def.kind], this.ctx.region.enemyScale), en.def.x, (en.def.y ?? this.ctx.region.groundY) - 2, en.def.patrol);
          e.onKilled = () => {
            en.killed = true;
            const key = spawnKey(this.ctx.region.id, en.def.id);
            const list = session.profile.killedEnemies;
            if (!list.includes(key)) list.push(key);
          };
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
