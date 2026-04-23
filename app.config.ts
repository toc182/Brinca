import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: IS_DEV ? 'Brinca (Dev)' : 'Brinca',
  slug: 'brinca',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'brinca',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAF8FF',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: IS_DEV ? 'com.brinca.app.dev' : 'com.brinca.app',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Brinca uses the microphone only when you tap record on a Voice Note during a practice session.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#FAF8FF',
    },
    package: IS_DEV ? 'com.brinca.app.dev' : 'com.brinca.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    [
      'expo-sqlite',
      {
        enableFTS: false,
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG ?? '',
        project: process.env.SENTRY_PROJECT ?? '',
      },
    ],
  ],
  updates: {
    url: 'https://u.expo.dev/2bbf775c-5028-48e5-a574-1e213e939d4e',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    eas: {
      projectId: '2bbf775c-5028-48e5-a574-1e213e939d4e',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
