import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yasseralnajjar.stickman',
  appName: 'Stickman - Open World Fighter',
  webDir: 'dist',
  backgroundColor: '#070816',
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: true, // debug builds only matter; lets chrome://inspect attach for testing
  },
};

export default config;
