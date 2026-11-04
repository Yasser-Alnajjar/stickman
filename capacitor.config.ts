import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yasseralnajjar.stickman',
  appName: 'Stickman - Open World Fighter',
  webDir: 'dist',
  backgroundColor: '#070816',
  android: {
    allowMixedContent: false,
    // chrome://inspect attach is opt-in (`CAP_DEBUG=1 cap sync`); release builds never enable it.
    webContentsDebuggingEnabled: process.env.CAP_DEBUG === '1',
  },
};

export default config;
