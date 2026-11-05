import Phaser from 'phaser';
import type { HudSnapshot, ItemId, RegionId } from '@/shared/types';
import { DEPTH, GRAVITY } from '@/shared/constants';
import { REGIONS, type RegionDef, type ZoneDef } from '@/game/config/regions';
import { ITEMS } from '@/game/config/items';
import { ABILITY_ORDER } from '@/game/config/abilities';
import { Fx } from '@/game/managers/Fx';
import { audio } from '@/game/managers/AudioManager';
import { session } from '@/game/managers/session';
import { runtime } from '@/game/managers/runtime';
import { gameApi } from '@/game/managers/game-api';
import { bus } from '@/game/events/bus';
import { GameClock } from '@/game/systems/combat/GameClock';
import { CombatSystem } from '@/game/systems/combat/CombatSystem';
import { ChunkManager } from '@/game/systems/world/ChunkManager';
import { EnemySpawner } from '@/game/systems/world/Spawner';
import type { WorldContext } from '@/game/systems/world/context';
import { Player } from '@/game/entities/player/Player';
import { Boss } from '@/game/entities/enemies/Boss';
import { CheckpointLamp, Pickup } from '@/game/entities/world/WorldObjects';
import { computeZoom } from '@/game/utils/viewport';
import type { BackdropScene } from './BackdropScene';
import { t } from '@/i18n';
import { devFlags } from '@/devtools/flags';
import { themeOf } from '@/game/world/themes';
import { WORLD_PACKS } from '@/game/world/stores';
import { packOfRegion } from '@/game/world/registry';
import { ensureRegion, loadPack, neighbourhood, trimPacks } from '@/game/world/loader';
import { collectedKey } from '@/persistence/legacy-v1';
import { Ambience } from '@/game/world/Ambience';
import type { WorldTheme } from '@/game/world/types';

export interface WorldInit {
  region: RegionId;
  /** Named spawn point, explicit coordinates (checkpoint respawn), or undefined for default. `id` marks a lamp: arriving there makes it the active checkpoint. */
  spawn?: string | { x: number; y: number; id?: string };
  respawn?: boolean;
}

declare global {
  interface Window { __stickman?: { scene: WorldScene; session: typeof session } }
}

export class WorldScene extends Phaser.Scene {
  private init0: WorldInit = { region: WORLD_PACKS[0].cityRegion };
  region!: RegionDef;
  player!: Player;
  fx!: Fx;
  clock!: GameClock;
  combat!: CombatSystem;
  chunks!: ChunkManager;
  spawner!: EnemySpawner;
  boss: Boss | null = null;
  theme!: WorldTheme;
  private ambience: Ambience | null = null;

  private ctx!: WorldContext;
  private lamps: CheckpointLamp[] = [];
  private pickups: Pickup[] = [];
  private secrets: { rect: Phaser.Geom.Rectangle; g: Phaser.GameObjects.Graphics; alpha: number }[] = [];
  private zoneInside = new Set<string>();
  private cameraTarget = { x: 0, y: 0 };
  private lookahead = 0;
  private hudTimer = 0;
  private lastHud = '';
  private chunkTimer = 0;
  private autosaveTimer = 0;
  private transitioning = false;
  private barrier: Phaser.GameObjects.Rectangle | null = null;
  private barrierG: Phaser.GameObjects.Graphics | null = null;
  private lampRest = 0;
  private gateOpened = false;
  private dropCounter = 0;
  private debugG: Phaser.GameObjects.Graphics | null = null;
  private unsubs: (() => void)[] = [];
  private readonly rectA = new Phaser.Geom.Rectangle();
  private readonly rectB = new Phaser.Geom.Rectangle();

  constructor() { super('World'); }

  init(data: WorldInit): void {
    this.init0 = data ?? { region: WORLD_PACKS[0].cityRegion };
  }

  /* ================================================================== create */

  create(): void {
    const region = REGIONS[this.init0.region];
    if (!region) throw new Error(`Region "${this.init0.region}" is not loaded: start worlds through gameApi.startWorld`);
    this.region = region;
    // Keep this world, its neighbours and world 1 in memory; drop every other world's level data.
    trimPacks([...neighbourhood(region.id), ...(packOfRegion(session.profile.checkpoint.region) ? [packOfRegion(session.profile.checkpoint.region)!.id] : [])]);
    this.transitioning = false;
    this.lamps = []; this.pickups = []; this.secrets = []; this.zoneInside.clear();
    this.gateOpened = !!session.profile.flags.gate_open;
    this.unsubs = [];
    this.boss = null; this.barrier = null; this.barrierG = null;

    this.theme = themeOf(region.theme);
    this.physics.world.setBounds(0, 0, region.width, region.height);
    this.physics.world.gravity.y = GRAVITY;
    this.cameras.main.setBounds(0, 0, region.width, region.height);

    this.fx = new Fx(this);
    this.clock = new GameClock(this.physics.world);
    this.combat = new CombatSystem(this.fx, this.clock);
    const actors = this.physics.add.group();
    this.chunks = new ChunkManager(this, region);

    this.ctx = {
      scene: this, fx: this.fx, combat: this.combat, clock: this.clock, actors, region,
      getPlayer: () => this.player,
      isLoadedAt: (x) => this.chunks.isLoadedAt(x),
      spawnEnemy: (kind, x, y, patrol = 120) => this.spawner.create(kind, x, y, patrol),
      dropItem: (item, x, y) => this.dropItem(item, x, y),
    };
    this.spawner = new EnemySpawner(this.ctx, region.spawns);

    // --- spawn position
    const spawn = this.resolveSpawn();
    this.chunks.update(spawn.x - 1200, spawn.x + 1200);
    this.player = new Player(this.ctx, spawn.x, spawn.y);
    if (this.init0.respawn) {
      session.profile.health = session.stats.maxHealth;
      this.player.fullRestore();
    }
    this.player.onDied = () => bus.emit('state', 'dead');
    session.hooks = {
      restoreHealth: (n) => this.player.restoreHealth(n),
      restoreEnergy: (n) => this.player.restoreEnergy(n),
      statsChanged: (_s, full) => this.player.applyStats(full),
      isFull: (k) => (k === 'health' ? this.player.health >= this.player.maxHealth : this.player.energy >= this.player.stats.maxEnergy),
    };

    // --- colliders
    this.physics.add.collider(actors, this.chunks.solidGroup);
    this.physics.add.collider(actors, this.chunks.oneWayGroup,
      (a) => { if (a === this.player.body) this.player.oneWayTouch = this.clock.now; },
      (a, b) => {
        const obj = a as Phaser.GameObjects.Rectangle;
        const body = obj.body as Phaser.Physics.Arcade.Body;
        const plat = (b as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
        if ((obj.getData('dropUntil') as number | undefined ?? 0) > this.clock.now) return false;
        return body.velocity.y >= 0 && body.prev.y + body.height <= plat.top + 24;
      });

    this.buildEntities(region);
    this.ambience = new Ambience(this, region, this.theme);

    // --- camera
    this.cameraTarget.x = this.player.cx;
    this.cameraTarget.y = this.player.cy - 60;
    const cam = this.cameras.main;
    cam.startFollow(this.cameraTarget, false, 0.12, 0.1);
    cam.setDeadzone(40, 30);
    this.applyZoom();
    cam.centerOn(this.cameraTarget.x, this.cameraTarget.y);
    cam.fadeIn(350, 0, 0, 0);
    this.scale.on('resize', this.applyZoom, this);

    // --- backdrop / audio / UI state
    (this.scene.get('Backdrop') as BackdropScene).setTheme(region.theme);
    const bossDone = !region.boss || session.profile.defeatedBosses.includes(region.boss.id);
    audio.playMusic(bossDone ? 'city' : 'none');
    this.fx.setShake(this.shakeEnabled());
    bus.emit('region', region.name);
    if (!region.boss) {
      bus.emit('banner', { title: t(region.name), subtitle: t(packOfRegion(region.id)?.tagline ?? '') });
      this.time.delayedCall(3200, () => bus.emit('banner', null));
    }
    // Warm up the world that follows this one so crossing the exit never waits on a download.
    this.preloadNeighbour();
    bus.emit('state', 'playing');
    // The player died/restarted between the final kill and the screen: still show it.
    if (session.completionPending) this.scheduleCompletionScreen();

    this.input.keyboard?.on('keydown-F3', this.toggleDebug, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    runtime.world = this;
    if (__DEV_TOOLS__) window.__stickman = { scene: this, session };
    void session.autoSave(true);
  }

  private shakeEnabled(): boolean {
    try { return localStorage.getItem('stickman.shake') !== '0'; } catch { return true; }
  }

  private resolveSpawn(): { x: number; y: number } {
    const r = this.region;
    const s = this.init0.spawn;
    let pos: { x: number; y: number } | undefined;
    if (typeof s === 'string') {
      pos = r.spawnPoints[s] ?? (s === 'entry' ? r.spawnPoints.from_west : undefined);
      if (pos) session.setCheckpoint(r.id, s, pos.x, pos.y);
    } else if (s) {
      pos = { x: s.x, y: s.y };
      if (s.id) session.setCheckpoint(r.id, s.id, s.x, s.y);
    } else {
      const cp = session.profile.checkpoint;
      const own = session.profile.checkpoints[r.id];
      if (cp.region === r.id) pos = { x: cp.x, y: cp.y };
      else if (own) pos = { x: own.x, y: own.y };
    }
    return pos ?? { x: 160, y: r.groundY };
  }

  private applyZoom(): void {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setZoom(computeZoom(w, h));
    this.cameras.main.setSize(w, h);
  }

  /* ------------------------------------------------------------------ entities */

  private buildEntities(region: RegionDef): void {
    for (const c of region.checkpoints) {
      const l = new CheckpointLamp(this, c, region.groundY);
      l.active = session.profile.checkpoint.id === c.id && session.profile.checkpoint.region === region.id;
      this.lamps.push(l);
    }
    for (const p of region.pickups) {
      if (session.profile.collected.includes(collectedKey(region.id, p.id))) continue;
      const pk = new Pickup(this, p);
      this.pickups.push(pk);
    }
    for (const s of region.secrets) {
      const g = this.add.graphics().setDepth(DEPTH.secret);
      g.fillStyle(0x1d2347, 1).fillRect(s.x, s.y, s.w, s.h);
      g.lineStyle(2, 0x3a4272, 1);
      for (let y = s.y + 10; y < s.y + s.h; y += 14) g.lineBetween(s.x, y, s.x + s.w, y);
      for (let x = s.x + 30, row = 0; x < s.x + s.w; x += 58, row++) for (let y = s.y; y < s.y + s.h; y += 28) g.lineBetween(x + (Math.floor(y / 28) % 2) * 29, y, x + (Math.floor(y / 28) % 2) * 29, y + 14);
      g.lineStyle(3, 0x0a0c1c, 0.9);
      g.lineBetween(s.x + s.w * 0.12, s.y + 4, s.x + s.w * 0.16, s.y + 40);
      g.lineBetween(s.x + s.w * 0.16, s.y + 40, s.x + s.w * 0.1, s.y + 78);
      this.secrets.push({ rect: new Phaser.Geom.Rectangle(s.x, s.y, s.w, s.h), g, alpha: 1 });
    }
    if (region.boss && !session.profile.defeatedBosses.includes(region.boss.id)) {
      this.boss = new Boss(this.ctx, region.boss.x, region.groundY - 2, region.boss.id);
      this.boss.onDefeated = () => this.onBossDefeated();
    }
  }

  private dropItem(item: ItemId, x: number, y: number): void {
    const pk = new Pickup(this, { id: `drop_${this.dropCounter++}`, item, qty: 1, x, y: y + 30 });
    this.pickups.push(pk);
  }

  /* ================================================================== update */

  private lastErrorAt = -1e9;

  /** A thrown exception would stop Phaser's loop for good; report it (rate-limited) and keep the frame going. */
  override update(time: number, delta: number): void {
    try {
      this.step(delta);
    } catch (err) {
      console.error('[world] update failed', err);
      if (time - this.lastErrorAt > 5000) {
        this.lastErrorAt = time;
        bus.emit('error', t('A gameplay error occurred. If the game misbehaves, pause and return to the menu.'));
      }
    }
  }

  private step(delta: number): void {
    const dt = this.clock.tick(delta);
    session.profile.stats.playTimeMs += dt;

    if (__DEV_TOOLS__ && (devFlags.infiniteHealth || devFlags.god)) this.player.health = this.player.maxHealth;
    if (__DEV_TOOLS__ && devFlags.god) this.refillBars();
    this.player.update(dt);
    if (__DEV_TOOLS__ && devFlags.god) this.refillBars(); // again after update, so the HUD never sees a spent bar
    this.spawner.update(dt, this.player.cx);
    this.boss?.update(dt);
    if (__DEV_TOOLS__ && devFlags.god) this.superTouchKill();
    for (const l of this.lamps) l.update(dt);
    for (const p of this.pickups) p.update(dt);
    this.fx.update(dt);
    this.ambience?.update(dt, this.cameras.main.worldView, this.time.now);

    this.updateDrift(dt);
    this.updateInteractions(dt);
    this.updateZones();
    this.updateSecrets(dt);
    this.updateCamera(dt);
    this.updateHud(dt);
    this.updateGate();

    this.chunkTimer += dt;
    if (this.chunkTimer > 120) {
      this.chunkTimer = 0;
      const v = this.cameras.main.worldView;
      this.chunks.update(v.left, v.right);
    }
    this.autosaveTimer += dt;
    if (this.autosaveTimer > 60_000) { this.autosaveTimer = 0; void session.autoSave(); }

    if (this.player.cy > this.region.height + 300) this.rescuePlayer();
    if (this.debugG) this.drawDebug();
  }

  /** World currents (conveyors, gales): nudges the player along while they stand inside a drift band. */
  private updateDrift(dt: number): void {
    const bands = this.region.drift;
    if (!bands || !this.player.alive || this.player.locked) return;
    const px = this.player.cx;
    for (const b of bands) if (px >= b.x && px <= b.x + b.w) this.player.arcade.position.x += b.vx * (dt / 1000);
  }

  /** Opens the Warden Gate the moment the keycard quest pays out its flag. */
  private updateGate(): void {
    if (this.gateOpened || !session.profile.flags.gate_open) return;
    this.gateOpened = true;
    if (!this.chunks.openGate('gate')) return;
    audio.play('gate');
    this.fx.shake(0.01, 500);
    this.fx.debrisBurst(9022, 820, 24);
    this.fx.text(9022, 640, t('GATE OPENED'), '#7dffa0', 24, 1400);
    session.toast(t('The Warden Gate has opened'), 'good');
  }

  private rescuePlayer(): void {
    const cp = session.profile.checkpoint;
    this.player.body.setPosition(cp.region === this.region.id ? cp.x : 160, cp.y - 60);
    this.player.arcade.setVelocity(0, 0);
  }

  /* ------------------------------------------------------------------ interactions */

  private updateInteractions(_dt: number): void {
    const p = this.player;
    // pickups
    for (const pk of this.pickups) {
      if (pk.collected) continue;
      if (Math.abs(pk.x - p.cx) < 44 && Math.abs(pk.y - 20 - p.cy) < 80) this.collect(pk);
    }

    // checkpoints
    for (const l of this.lamps) {
      if (!p.alive || !l.contains(p.cx) || Math.abs(p.feetY - l.y) > 60) continue;
      const cp = session.profile.checkpoint;
      const isCurrent = cp.id === l.def.id && cp.region === this.region.id;
      if (!isCurrent) {
        session.setCheckpoint(this.region.id, l.def.id, l.def.x, l.y);
        this.lamps.forEach((o) => (o.active = o === l));
        session.toast(t('Checkpoint: {name}', { name: t(l.def.name) }), 'good');
        audio.play('checkpoint');
        this.fx.ring(l.def.x, l.y - 160, 0x7dffa0, 10, 120, 600, 5);
        p.fullRestore();
        void session.autoSave(true);
        this.lampRest = this.clock.now + 6000;
      } else if (this.clock.now > this.lampRest && (p.health < p.maxHealth || p.energy < p.stats.maxEnergy)) {
        p.fullRestore();
        this.fx.ring(l.def.x, l.y - 160, 0x7dffa0, 10, 90, 500, 4);
        session.toast(t('Rested at lamp'), 'info');
        audio.play('checkpoint');
        this.lampRest = this.clock.now + 6000;
      }
    }

  }

  private collect(pk: Pickup): void {
    pk.collect();
    session.giveItem(pk.def.item, pk.def.qty);
    audio.play('pickup');
    this.fx.hitSparks(pk.x, pk.y - 20, 0, 10, true);
    this.fx.text(pk.x, pk.y - 40, t(ITEMS[pk.def.item].name), '#ffd24a', 18, 900);
    if (!pk.def.id.startsWith('drop_')) session.profile.collected.push(collectedKey(this.region.id, pk.def.id));
    this.pickups = this.pickups.filter((x) => x !== pk);
    pk.destroy();
  }

  private updateZones(): void {
    const p = this.player;
    if (!p.alive || this.transitioning) return;
    p.hurtbox(this.rectA);
    for (const z of this.region.zones) {
      this.rectB.setTo(z.x, z.y, z.w, z.h);
      const inside = Phaser.Geom.Rectangle.Overlaps(this.rectA, this.rectB);
      const was = this.zoneInside.has(z.id);
      if (inside && !was) { this.zoneInside.add(z.id); this.onZoneEnter(z); }
      else if (!inside && was) this.zoneInside.delete(z.id);
    }
  }

  private onZoneEnter(z: ZoneDef): void {
    if (z.kind === 'reach') {
      session.questEvent({ type: 'reach', target: z.id });
      session.toast(t('Beacon reached'), 'info');
      audio.play('checkpoint');
      this.fx.ring(z.x + z.w / 2, z.y + z.h / 2, 0xff4d5e, 10, 160, 800, 6);
    } else if (z.kind === 'exit' && z.to) {
      if (z.requiresBoss && !session.profile.defeatedBosses.includes(z.requiresBoss) && !(__DEV_TOOLS__ && devFlags.unlockAll)) return;
      this.transitionTo(z.to, z.spawn);
    } else if (z.kind === 'boss' && this.boss && !this.boss.engaged && this.boss.alive) {
      this.startBossFight();
    }
  }

  private transitionTo(region: RegionId, spawn?: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.locked = true;
    audio.play('gate');
    const cam = this.cameras.main;
    cam.fadeOut(450, 0, 0, 0);
    // The destination world may still be downloading: the fade is the loading screen.
    const ready = ensureRegion(region);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      void ready.then(() => this.scene.restart({ region, spawn } satisfies WorldInit)).catch((e) => {
        console.error('[world] could not load', region, e);
        bus.emit('error', t('A gameplay error occurred. If the game misbehaves, pause and return to the menu.'));
        this.transitioning = false;
        this.player.locked = false;
        cam.fadeIn(300, 0, 0, 0);
      });
    });
  }

  /** Builds the next world in the background while the player is in a safe place to wait (never blocks gameplay). */
  private preloadNeighbour(): void {
    const i = WORLD_PACKS.findIndex((p) => p.cityRegion === this.region.id || p.arenaRegion === this.region.id);
    const next = this.region.boss ? WORLD_PACKS[i + 1] : WORLD_PACKS[i];
    if (!next) return;
    this.time.delayedCall(1500, () => { void loadPack(next.id); });
  }

  /* ------------------------------------------------------------------ boss arena */

  private startBossFight(): void {
    const b = this.boss;
    if (!b) return;
    const x = this.region.boss?.barrierX ?? 590, h = this.region.groundY;
    this.barrier = this.add.rectangle(x, h / 2, 30, h, 0, 0);
    this.physics.add.existing(this.barrier, true);
    this.chunks.solidGroup.add(this.barrier);
    this.barrierG = this.add.graphics().setDepth(DEPTH.foreground);
    const stage = this.theme.stage;
    if (stage?.drawBarrier) stage.drawBarrier(this.barrierG, x, h);
    else {
      this.barrierG.fillStyle(0xff3b3b, 0.35).fillRect(x - 15, 0, 30, h);
      this.barrierG.fillStyle(0xff8080, 0.8).fillRect(x - 3, 0, 6, h);
    }
    audio.play('gate');
    audio.playMusic('boss');
    // Each arena stages its own entrance (shutters, surf, eruption...) on top of the boss's own roar.
    if (stage?.onStart) stage.onStart({ scene: this, region: this.region, fx: this.fx });
    b.engage();
    session.toast(t('The gate seals behind you'), 'warn');
  }

  private onBossDefeated(): void {
    audio.playMusic('city');
    // Persist completion immediately (before the victory banner), then show the screen once the player has seen the kill.
    void session.recordCampaignCompletion().then(() => this.scheduleCompletionScreen());
    this.time.delayedCall(2600, () => {
      this.barrier?.destroy();
      this.barrierG?.destroy();
      this.barrier = null; this.barrierG = null;
      session.toast(t(this.region.zones.some((z) => z.requiresBoss) ? 'The seal breaks. The exit is open.' : 'The seal breaks. The way back is open.'), 'good');
      audio.play('gate');
    });
  }

  private refillBars(): void {
    this.player.stamina = this.player.stats.maxStamina;
    this.player.energy = this.player.stats.maxEnergy;
  }

  /** Dev "Super Mode": any living enemy (or engaged boss) overlapping the player dies on contact. */
  private superTouchKill(): void {
    if (!this.player.alive) return;
    this.player.hurtbox(this.rectA);
    const targets: { alive: boolean; hurtbox(r: Phaser.Geom.Rectangle): void }[] = [...this.spawner.active];
    if (this.boss?.engaged) targets.push(this.boss);
    for (const e of targets) {
      if (!e.alive) continue;
      e.hurtbox(this.rectB);
      if (!Phaser.Geom.Rectangle.Overlaps(this.rectA, this.rectB)) continue;
      devFlags.sandbox = true; // kills pay out XP/loot: keep the real save untouched, like every other dev action
      (e as unknown as { die(): void }).die();
    }
  }

  private scheduleCompletionScreen(): void {
    if (!session.completionPending) return;
    this.time.delayedCall(4200, () => gameApi.showCompletion());
  }

  /* ------------------------------------------------------------------ secrets / camera / HUD */

  private updateSecrets(dt: number): void {
    this.player.hurtbox(this.rectA);
    for (const s of this.secrets) {
      const inside = Phaser.Geom.Rectangle.Overlaps(this.rectA, s.rect);
      const target = inside ? 0.04 : 1;
      s.alpha += (target - s.alpha) * Math.min(1, dt / 160);
      s.g.setAlpha(s.alpha);
    }
  }

  private updateCamera(dt: number): void {
    const p = this.player;
    const targetLook = p.facing * 90;
    this.lookahead += (targetLook - this.lookahead) * Math.min(1, dt / 350);
    let tx = p.cx + this.lookahead;
    let ty = p.cy - 70;
    // Pull the camera toward nearby fights so enemies stay framed.
    let nearest: { cx: number; cy: number } | null = null;
    let nd = 520;
    for (const e of this.spawner.active) {
      if (!e.alive) continue;
      const d = Math.abs(e.cx - p.cx);
      if (d < nd) { nd = d; nearest = e; }
    }
    if (this.boss?.engaged && this.boss.alive) nearest = this.boss;
    if (nearest) {
      tx += Phaser.Math.Clamp((nearest.cx - p.cx) * 0.3, -170, 170);
      ty += Phaser.Math.Clamp((nearest.cy - p.cy) * 0.1, -40, 40);
    }
    this.cameraTarget.x = tx;
    this.cameraTarget.y = ty;
    const cam = this.cameras.main;
    (this.scene.get('Backdrop') as BackdropScene).setFocus(cam.midPoint.x, cam.midPoint.y);
  }

  private updateHud(dt: number): void {
    this.hudTimer += dt;
    if (this.hudTimer < 66) return;
    this.hudTimer = 0;
    const p = this.player;
    const snap: HudSnapshot = {
      health: Math.ceil(p.health), maxHealth: p.maxHealth,
      stamina: Math.ceil(p.stamina), maxStamina: p.stats.maxStamina,
      energy: Math.floor(p.energy), maxEnergy: p.stats.maxEnergy,
      cooldowns: {
        fire_punch: { remaining: Math.ceil(p.abilities.cooldowns.fire_punch.remaining / 100) * 100, total: p.abilities.cooldowns.fire_punch.total },
        lightning_dash: { remaining: Math.ceil(p.abilities.cooldowns.lightning_dash.remaining / 100) * 100, total: p.abilities.cooldowns.lightning_dash.total },
      },
    };
    const key = `${snap.health}|${snap.maxHealth}|${snap.stamina}|${snap.energy}|${snap.maxEnergy}|${ABILITY_ORDER.map((a) => snap.cooldowns[a].remaining).join(',')}`;
    if (key !== this.lastHud) { this.lastHud = key; bus.emit('hud:update', snap); }
  }

  /* ------------------------------------------------------------------ debug */

  private toggleDebug(): void {
    if (this.debugG) { this.debugG.destroy(); this.debugG = null; this.combat.debug = false; return; }
    this.debugG = this.add.graphics().setDepth(DEPTH.hitbox);
    this.combat.debug = true;
  }

  private drawDebug(): void {
    const g = this.debugG!;
    g.clear();
    for (const f of this.combat.fighters) {
      f.hurtbox(this.rectA);
      g.lineStyle(1.5, 0x35ff7a, 0.9).strokeRect(this.rectA.x, this.rectA.y, this.rectA.width, this.rectA.height);
      if (f.runner.running && f.runner.def) {
        f.runner.hitbox(f.cx, f.cy, f.facing, this.rectB);
        g.lineStyle(2, f.runner.active ? 0xff3030 : 0xffb030, 0.9).strokeRect(this.rectB.x, this.rectB.y, this.rectB.width, this.rectB.height);
      }
    }
  }

  /* ================================================================== lifecycle */

  /**
   * Phaser tears down display lists, physics groups and plugins during shutdown (before this runs), so the
   * game objects themselves must not be destroyed again. We only release what Phaser doesn't know about:
   * listeners, session hooks, input keys and UI-facing state.
   */
  private onShutdown(): void {
    const safe = (fn: () => void): void => { try { fn(); } catch (e) { console.warn('[world] cleanup step failed', e); } };
    safe(() => this.scale.off('resize', this.applyZoom, this));
    safe(() => this.input.keyboard?.off('keydown-F3', this.toggleDebug, this));
    safe(() => this.unsubs.forEach((u) => u()));
    safe(() => this.clock.dispose());
    safe(() => this.player.input.destroy());
    safe(() => this.chunks.destroy());
    this.ambience = null;
    this.debugG = null;
    session.hooks = null;
    if (runtime.world === this) runtime.world = null;
    bus.emit('boss:update', null);
    bus.emit('banner', null);
    bus.emit('combo', 0);
  }

  /** Called by the API when the UI pauses/resumes. */
  resumeInput(): void {
    this.player.input.reset();
  }
}
