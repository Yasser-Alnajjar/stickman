import { loadAllPacks } from '@/game/world/loader';

// Level data is loaded on demand in the game. Tests inspect every world, so load them all once up front
// (this also exercises the same dynamic-import path the game uses).
await loadAllPacks();
