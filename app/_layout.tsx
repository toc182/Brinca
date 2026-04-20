import {
  Fredoka_600SemiBold,
} from '@expo-google-fonts/fredoka';
import {
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getDatabase } from '@/lib/sqlite/db';
import { initSentry } from '@/lib/sentry';
import { getSession } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { startSyncEngine } from '@/lib/sync/engine';
import '@/shared/i18n/config';
import { colors } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { getFirstChild } from '@/features/onboarding/repositories/child.repository';
import { getFirstActivity } from '@/features/onboarding/repositories/activity.repository';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://c1b5bd34c56cc08f89eebd3c02cd7318@o4511140030251008.ingest.us.sentry.io/4511254380675072',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default Sentry.wrap(function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'onboarding-child' | 'onboarding-activity' | 'authenticated'>('loading');

  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    JetBrainsMono_500Medium,
  });

  // Initialize DB + Sentry + sync engine + check auth state
  useEffect(() => {
    async function init() {
      try {
        initSentry();
        await getDatabase();
        startSyncEngine();
        const session = await getSession();

        if (!session) {
          setAuthState('unauthenticated');
        } else {
          // Check onboarding progress
          const activeChild = useActiveChildStore.getState();
          if (activeChild.childId && activeChild.familyId) {
            const activity = await getFirstActivity(activeChild.childId);
            if (activity) {
              setAuthState('authenticated');
            } else {
              setAuthState('onboarding-activity');
            }
          } else {
            // Try to find child in SQLite from family
            const familyId = activeChild.familyId;
            if (familyId) {
              const child = await getFirstChild(familyId);
              if (child) {
                useActiveChildStore.getState().setActiveChild(child.id, child.name, familyId);
                const activity = await getFirstActivity(child.id);
                setAuthState(activity ? 'authenticated' : 'onboarding-activity');
              } else {
                setAuthState('onboarding-child');
              }
            } else {
              setAuthState('onboarding-child');
            }
          }
        }
      } catch (error) {
        console.error('Init failed:', error);
        setAuthState('unauthenticated');
      } finally {
        setAppReady(true);
      }
    }

    init();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAuthState('unauthenticated');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Hide splash when ready
  useEffect(() => {
    if (appReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [appReady, fontsLoaded, fontError]);

  // Route based on auth state
  useEffect(() => {
    if (!appReady || authState === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (authState === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (authState === 'onboarding-child' && !inAuthGroup) {
      router.replace('/(auth)/onboarding/step-2');
    } else if (authState === 'onboarding-activity' && !inAuthGroup) {
      router.replace('/(auth)/onboarding/step-3');
    } else if (authState === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [authState, segments, appReady, router]);

  if (!appReady || (!fontsLoaded && !fontError)) {
    return <View style={styles.loading} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(modals)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
});

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
