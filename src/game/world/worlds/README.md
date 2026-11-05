# World packs

A *world* = one city + its boss arena(s), each with its own look. Everything visual is data + small painters; the
engine (`ChunkManager`, `BackdropScene`, `Ambience`, `WorldScene`) never mentions a specific world.

## Adding a world (e.g. "Crystal Caverns")
1. `worlds/crystal/theme.ts` exports a `WorldTheme` (see `../types.ts`):
   - `backdrop` – sky gradient + `far` / `mid` / optional `near` tiling canvas painters (parallax layers).
   - `backdropFx` – per-frame screen-space props (trains, gulls, lightning, volcano plumes).
   - `drawSolid` / `drawLedge` / `drawDecor` – how ground, roofs, crates, walls, one-way ledges and *your own decor
     kinds* look. Decor kinds are free-form strings; invent as many as the world needs.
   - `animated` – decor kinds repainted every frame (only while on screen): gears, cranes, fire, billboards.
   - `bed` – animated strip behind the ground (water, lava) visible through gaps in the deck.
   - `ambient` – weather/particles (rain, embers, mist).
   - `stage` – boss entrance (`onStart`: shutters, surges, eruptions) and the seal `drawBarrier`.
2. `worlds/crystal/city.ts` builds the city `RegionDef` with `RegionBuilder` (platform layout, spawns, pickups,
   checkpoints). `worlds/crystal/arena.ts` builds the arena with `arenaRegion({... platforms, decorate })` and its own
   theme (spread the city theme and override what differs, but give the arena its own backdrop and decor).
3. Add the new region ids to `RegionId` (`shared/types`) and `REGIONS` list in `persistence/save-schema.ts`.
   **Never rename an existing region, spawn, pickup or checkpoint id** – saves reference them.
4. Append a pack to `WORLD_PACKS` in `worlds/index.ts`. Stage order, dev tools and tests pick it up automatically.

Performance rules: static art goes in per-chunk Graphics (built once, streamed); only `animated` decor and `ambient`
repaint each frame; keep weather stateless (`rainLayer` in `kit.ts`) and particle counts under ~150.
