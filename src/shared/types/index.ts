/** Shared, engine-agnostic types. Nothing in here may import Phaser or React. */

export type Team = 'player' | 'enemy';
export type Facing = 1 | -1;
/** Content ids are plain strings: each world pack registers its own regions, bosses, enemies and items (see game/world/pack.ts). */
export type RegionId = string;
export type BossId = string;
export type AbilityId = 'fire_punch' | 'lightning_dash';
export type AttributeId = 'vitality' | 'strength' | 'endurance' | 'agility' | 'focus';
export type ItemId = string;
/** `'boss'` is reserved for boss fighters; every other kind is registered by core content or a world pack. */
export type EnemyKind = string;
export type Element = 'physical' | 'fire' | 'lightning' | 'ice';
export type SfxName =
  | 'step' | 'jump' | 'land' | 'punch' | 'kick' | 'heavy' | 'whoosh' | 'hit' | 'hitHeavy' | 'block'
  | 'perfect' | 'dash' | 'dodge' | 'fire' | 'zap' | 'enemyHit' | 'enemyDie' | 'hurt' | 'death'
  | 'pickup' | 'levelUp' | 'checkpoint' | 'quest' | 'questComplete' | 'questNew' | 'ui' | 'uiBack' | 'telegraph' | 'slam' | 'roar' | 'gate'
  | 'slash' | 'stab' | 'chop' | 'smash' | 'magic' | 'special' | 'coin' | 'weaponSwitch' | 'unlock' | 'upgrade' | 'purchase' | 'denied';
export type MusicTrack = 'city' | 'boss' | 'none';

export interface Rect { x: number; y: number; w: number; h: number }

/* ---------------- Combat data ---------------- */

export interface AttackDef {
  id: string;
  name: string;
  damage: number;
  /** Hitbox centre is `ox` px in front of the owner's centre; `oy` is vertical offset from centre. */
  hitbox: { w: number; h: number; ox: number; oy: number };
  startup: number;
  active: number;
  recovery: number;
  knockback: { x: number; y: number };
  hitStun: number;
  staminaCost?: number;
  energyCost?: number;
  /** Player only: ms after the attack ends in which a chain input is still accepted. */
  comboWindow?: number;
  /** Forward velocity impulse applied when the active phase starts. */
  lunge?: number;
  hitStop: number;
  shake: number;
  anim: string;
  sfx: SfxName;
  /** Chain table: which attack follows for a given input. */
  next?: { light?: string; kick?: string; heavy?: string };
  /** Enemy only: attack id launched immediately after this one (skips recovery). */
  chain?: string;
  /** Enemy only: ignore stagger while winding up/attacking. */
  superArmor?: boolean;
  telegraph?: boolean;
  /** Player weapons: breaks a raised shield regardless of damage. */
  armorBreak?: boolean;
  /** Player weapons: ms of stagger applied on hit (subject to per-target lockout; never applied to bosses). */
  stagger?: number;
  /** Player weapons: the hitbox is centred on the owner and hits both sides (ground slams). */
  radial?: boolean;
  /** Player weapons: fires this projectile when the active phase begins. */
  projectile?: ProjectileSpec;
}

/** A projectile fired by the player's weapons (bolts, crescent waves, ground shockwaves). */
export interface ProjectileSpec {
  speed: number;
  w: number;
  h: number;
  /** ms before it expires. */
  life: number;
  color: number;
  /** Extra targets it may pass through after the first hit; `-1` = unlimited (waves). */
  pierce: number;
  /** Vertical offset from the owner's centre. */
  oy?: number;
  /** Hugs the floor line (shockwaves) instead of flying level. */
  ground?: boolean;
  /** Explodes into an area hit where it ends. */
  burst?: { radius: number; damageMult: number };
  /** Fired both ways. */
  bothSides?: boolean;
  /** Damage multiplier relative to the attack that fired it. */
  damageMult?: number;
}

export type AttackPhase = 'idle' | 'startup' | 'active' | 'recovery';

export interface HitSpec {
  def: AttackDef;
  damageMult: number;
  element: Element;
  comboScale: number;
  burn?: { dps: number; duration: number };
  extraStun?: number;
  /** Weapon stagger in ms (see AttackDef.stagger). */
  stagger?: number;
}

export type HitOutcome = 'ignored' | 'hit' | 'blocked' | 'perfect' | 'killed';

/* ---------------- Progression ---------------- */

export interface QuestObjective {
  type: 'kill' | 'reach' | 'collect' | 'boss';
  /** kill: enemy kind or 'any'; reach: zone id; collect: item id; boss: boss id */
  target: string;
  count: number;
  label: string;
}

export interface QuestReward {
  xp: number;
  gold?: number;
  items?: Partial<Record<ItemId, number>>;
  flags?: string[];
}

export interface QuestDef {
  id: string;
  title: string;
  summary: string;
  /** World pack id this quest belongs to (see world/worlds). The quest cannot unlock while that world is locked. */
  world: string;
  objectives: QuestObjective[];
  reward: QuestReward;
  /** Short tip shown in the quest log. */
  hint: string;
}

/** `ready` only exists transiently (and in old saves, which are paid out on load): quests complete automatically. */
export type QuestStatus = 'active' | 'ready' | 'completed';
export interface QuestProgress { status: QuestStatus; progress: number[] }

export type QuestEvent =
  | { type: 'kill'; target: EnemyKind }
  | { type: 'reach'; target: string }
  | { type: 'collect'; target: ItemId; count: number }
  | { type: 'boss'; target: string };

export interface CheckpointRef { region: RegionId; id: string; x: number; y: number }
/** Last lamp activated inside one region (the region is the key it is stored under). */
export interface RegionCheckpoint { id: string; x: number; y: number }

export interface ProfileData {
  level: number;
  xp: number;
  skillPoints: number;
  abilities: Record<AbilityId, number>;
  attributes: Record<AttributeId, number>;
  health: number;
  quests: Record<string, QuestProgress>;
  defeatedBosses: string[];
  /** Spawn keys (`region:spawnId`) of enemies killed this playthrough; they never respawn. */
  killedEnemies: string[];
  flags: Record<string, boolean>;
  /** Region-qualified pickup keys (`region:pickupId`) so two worlds may reuse a pickup id. */
  collected: string[];
  /** The most recently activated checkpoint anywhere: where Continue resumes. */
  checkpoint: CheckpointRef;
  /** Last lamp per region, so returning to a world resumes there without disturbing any other world. */
  checkpoints: Record<RegionId, RegionCheckpoint>;
  /** `gold` is the single in-game currency (Gold Coins): an integer, never negative. */
  inventory: { items: Partial<Record<ItemId, number>>; gold: number };
  /** Weapon ownership, equipment and upgrade levels (save v3). */
  weapons: WeaponsState;
  /** One-time reward claims (`boss:<id>`, `quest:<id>`, `chest:<region>:<id>`, `migration:*`); a claim is never granted twice. */
  rewardClaims: string[];
  stats: { kills: number; deaths: number; playTimeMs: number };
}

export interface WeaponsState {
  owned: string[];
  equipped: string;
  /** Upgrade level per weapon id, 1-based. */
  levels: Record<string, number>;
}

export interface PlayerStats {
  maxHealth: number;
  maxStamina: number;
  maxEnergy: number;
  attack: number;
  defense: number;
  moveSpeedMult: number;
  staminaRegen: number;
  energyRegen: number;
}

/* ---------------- UI views (published through the event bus) ---------------- */

export interface HudSnapshot {
  health: number; maxHealth: number;
  stamina: number; maxStamina: number;
  energy: number; maxEnergy: number;
  cooldowns: Record<AbilityId, { remaining: number; total: number }>;
  /** Equipped weapon and its special-ability cooldown. */
  weaponId: string;
  special: { remaining: number; total: number; cost: number };
}

export interface BossView { name: string; health: number; maxHealth: number; phase: number }

export interface ToastMsg { id: number; text: string; kind: 'info' | 'good' | 'warn' | 'level' }
