import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.qder.calendar',
  appName: 'Calendar',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      // Default status-bar glyph; replace with a real drawable when branding lands.
      iconColor: '#1976D2',
    },
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
