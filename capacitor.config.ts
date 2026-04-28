import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.afterdark.app',
  appName: 'After Dark',
  webDir: 'out',
  server: {
    // Point the app to the live Vercel deployment so API routes work.
    // Without this, the app runs static files bundled in the APK and
    // /api/generate-story does not exist — stories can never generate.
    url: 'https://after-dark-tales.vercel.app',
    cleartext: false,
  },
};

export default config;
