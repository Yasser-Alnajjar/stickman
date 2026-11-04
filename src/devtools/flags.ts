/**
 * Developer-only runtime flags. Imported by game code solely inside `if (__DEV_TOOLS__)` branches, so in production
 * builds every reference (and this module) is removed by the bundler. Nothing here may run in a player build.
 */
export const DEV_MARKER = 'stickman-devtools';

export const devFlags = {
  /** True once a developer action detached the session from the real save. Saving is then a no-op. */
  sandbox: false,
  /** Player takes no damage. */
  god: false,
  /** Player health is topped up every frame. */
  infiniteHealth: false,
  /** Boss-gated exits are open regardless of progress. */
  unlockAll: false,
};
