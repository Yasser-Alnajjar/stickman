# Stickman: Open World Fighter

A 2D side-scrolling stickman fighting game that runs in the browser. Phaser 3 (rendering, physics, combat, AI),
React + Zustand (menus, HUD, skill tree), TypeScript (strict), Vite, IndexedDB saves.
Everything is original and procedural: skeletal stickman animation, backgrounds, particles and **all audio
(WebAudio synthesis)**. There are no external assets.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build into dist/ (static, relative paths)
npm run preview      # serve dist/
npm test             # unit tests (vitest)
npm run e2e          # optional browser smoke test (needs Playwright; see scripts/e2e-smoke.mjs)
```

Append `?debug` to the URL to expose `window.__stickman` (used by the e2e script). `F3` toggles hitbox overlays.

## Controls

| Key | Action |
| --- | --- |
| A/D, ←/→ | Move |
| Space / W / ↑ | Jump (hold for height; Down + Jump drops through ledges) |
| Shift | Dash (brief invulnerability; attack during a dash = Dash Strike) |
| X / C | Dodge roll (invulnerable) |
| J, K, L | Light punch, kick, heavy punch. **J J J J = Jab → Cross → Roundhouse → Finisher** |
| S / ↓ (hold) | Block. Block just before a hit lands for a **perfect block** |
| 1 / 2 | Fire Punch / Lightning Dash (energy + cooldown) |
| E | Talk to NPCs |
| H / G | Health Tonic / Energy Cell |
| Esc, P / Tab | Pause menu / Skills |

## What is in the game

- **Movement**: acceleration/deceleration, variable jump height, coyote time and jump buffering, one-way ledges.
- **Combat**: explicit player state machine (Idle, Moving, Jumping, Falling, Attacking, Blocking, Dodging, Dashing,
  TakingDamage, Dead) with a transition table that rejects invalid transitions; independent per-attack hitboxes with
  startup/active/recovery, knockback, hit-stun, hit-stop, input buffering, combo chains with damage scaling,
  block/perfect block/guard break, i-frames, one hit per swing per target.
- **Abilities**: Fire Punch (burn from rank 2) and Lightning Dash (invulnerable, damages everything on its path,
  stops at walls, rank 3 stuns). Energy cost, cooldowns, 3 ranks each with real stat changes.
- **Enemies**: Street Thug, Shadow Runner (dash approach + dodge roll), Iron Brute (super armor, heavy knockback
  resistance). State machine: Idle/Patrol/Detect/Chase/Attack/Recover/Dodge/Hit/Stunned/Dead, data-driven stats,
  distance-based AI throttling, spawn/despawn by distance.
- **Boss** (Iron Warden Kaizo): three phases, telegraphed Slam / Charge / Combo / Leap, exhaustion windows where he takes
  +50% damage, minions in phase 3, dedicated health bar, rewards and quest completion.
- **World**: Neon Street (9600 px) plus the Warden Arena, streamed by 1600 px chunks, one-way ledges, a signal tower,
  a hidden rooftop room, checkpoints, a locked gate, region transitions with fades.
- **NPCs & quests**: dialogue driven by quest state; kill / reach / collect / boss objectives, rewards, a 4-quest chain.
- **Progression**: XP, levels 1-10, skill points, ability ranks, 5 attributes with real stat effects, inventory, gold.
- **Saves**: IndexedDB (`manual` + `auto` slots), schema validation/sanitising, versioned migrations, corruption fallback,
  auto-save on lamps/level-ups/quests/region changes and every 60 s.
- **Languages**: English and Arabic (full RTL layout, mirrored HUD/menus, Arabic text in the world). Pick one in Settings; it is
  remembered and defaults to the browser language. Add a language by creating `src/i18n/<lang>.ts` (English text is the key,
  missing entries fall back to English; `npm test` fails if a string lacks an Arabic entry) and registering it in `src/i18n/index.ts`.
- **UI**: main menu, HUD (bars, XP, ability cooldowns, quest tracker, boss bar, combo counter), pause menu with
  inventory/skills/quests/settings/controls, dialogue, death screen, fullscreen, audio and screen-shake settings.

## Architecture

```
src/
  shared/        types + constants (no engine imports)
  game/
    config/      all data: attacks, abilities, enemies, quests, regions, progression (no engine imports)
    systems/     combat (damage, combo, attack runner, hit resolution), abilities, progression (pure profile logic),
                 quests (pure quest engine + dialogue), world (chunks, spawner)
    entities/    Fighter base, Player (+transitions), Enemy/Boss, NPC, world objects
    animations/  Pose model, procedural clips, StickmanRig renderer
    managers/    audio (WebAudio), fx (pooled particles/trails/text), session (profile owner), game-api (React facade)
    scenes/      Boot, Preload (generates all textures), Backdrop (parallax), MainMenu, World
    events/      typed event bus (Phaser -> React)
  store/         Zustand store (UI state only)
  persistence/   IndexedDB save manager + schema/migrations
  app/           React UI
```

Key decisions / trade-offs:

- **Phaser never reads React state, React never runs per-frame logic.** React commands the game through `gameApi`;
  the game publishes throttled (~15 Hz, change-only) snapshots through a typed event bus.
- **Pure logic is separated from Phaser** (config, damage, combos, progression, quests, save schema, transition tables) so it
  is unit-tested in Node without a browser.
- **Procedural graphics instead of a tilemap.** Regions are data (`config/regions.ts`); a chunk manager builds Graphics and
  physics bodies only near the camera. This keeps memory flat for long regions and is the hook for future connected regions.
  Trade-off: no Tiled/tilemap editor workflow.
- **Settings live in `localStorage`** (synchronous, needed before the game boots); game progress lives in IndexedDB.
- **No `React.StrictMode`**: the Phaser game is a singleton created in an effect and a dev double-mount would boot two engines.
- **Fixed-step physics vs. logic clock**: Arcade steps on real time while gameplay timers use a clamped, hit-stop-aware
  clock. Where exactness matters (dash distance) logic uses distance, not time.

## Testing performed

- `npm test`: 38 unit tests (translations, progression, quests, damage, combos, save schema/migrations, state tables, level reachability).
- `npm run e2e` and ad-hoc Playwright scripts in headless Chromium (WebGL via SwiftShader): movement, jump heights, combo chain
  and single-hit guarantee, abilities/energy/cooldowns, block, NPC dialogue + quests, hidden room, gate opening, checkpoints,
  death/respawn, boss phases/summons/death/rewards, pause/save/reload/continue, resize at five viewport sizes.

## Known limitations

- Verified only in Chromium. Firefox/Safari/Edge should work (standard APIs, WebGL with Canvas fallback, prefixed fullscreen)
  but were not run here.
- 60 FPS on a real GPU is not measured. In the software-rendered test environment, game logic costs ~0.3 ms median
  (< 4 ms p95) per frame with 7 active enemies; frame rate there is limited by software rasterisation.
- Audio is synthesised and was verified to run without errors, not by listening.
- Keyboard only. Touch controls are not implemented. Multiplayer is out of scope.
- Only the City and Boss Arena regions exist; Forest/Desert/Underground are architecture-ready but not built.
- Balance is tuned by reasoning and spot tests, not by large-scale playtesting.
