import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.afterdark.app',
  appName: 'After Dark',
  webDir: 'out',
  // No server.url — app runs from local static bundle, calls Vercel API directly
};

export default config;
