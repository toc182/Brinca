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
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext } from '@/shared/contexts/AuthContext';
import type { AuthState } from '@/shared/contexts/AuthContext';

import { getDatabase } from '@/lib/sqlite/db';
import { initSentry } from '@/lib/sentry';
import { getSession } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { startSyncEngine } from '@/lib/sync/engine';
import '@/shared/i18n/config';
import { colors } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
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
  const initialRouteHandled = useRef(false);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const authContextValue = useMemo(() => ({ setAuthState }), []);

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
          const { pendingVerificationEmail } = useOnboardingStore.getState();
          setAuthState(pendingVerificationEmail ? 'onboarding-verification' : 'unauthenticated');
          return;
        }

        // Session found — may be stale from Keychain surviving a reinstall.
        // Validate server-side before trusting it.
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          await supabase.auth.signOut().catch(() => {});
          setAuthState('unauthenticated');
          return;
        }

        // Valid session — check mid-verification state
        const { pendingVerificationEmail } = useOnboardingStore.getState();
        if (pendingVerificationEmail) {
          setAuthState('onboarding-verification');
          return;
        }

        // Check onboarding progress — try local state first
        const activeChild = useActiveChildStore.getState();
        if (activeChild.childId && activeChild.familyId) {
          const activity = await getFirstActivity(activeChild.childId);
          setAuthState(activity ? 'authenticated' : 'onboarding-activity');
          return;
        }

        // Local state incomplete (normal on reinstall — MMKV/SQLite wiped
        // but Keychain retains session). Recover entirely from Supabase.
        const userId = userData.user.id;

        // 1. Find family
        const { data: members } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', userId)
          .limit(1);

        if (!members || members.length === 0) {
          setAuthState('onboarding-child');
          return;
        }

        const remoteFamilyId = members[0].family_id;

        // 2. Find child (query Supabase, not local SQLite)
        const { data: remoteChildren } = await supabase
          .from('children')
          .select('id, name')
          .eq('family_id', remoteFamilyId)
          .order('created_at', { ascending: true })
          .limit(1);

        if (!remoteChildren || remoteChildren.length === 0) {
          useOnboardingStore.getState().setPendingFamilyId(remoteFamilyId);
          setAuthState('onboarding-child');
          return;
        }

        const remoteChild = remoteChildren[0];
        useActiveChildStore.getState().setActiveChild(
          remoteChild.id,
          remoteChild.name,
          remoteFamilyId,
        );

        // Reinstall recovery: user already completed onboarding if they have
        // a family + child. Whether activities exist in Supabase is a sync
        // question — send them home and let the sync engine handle the rest.
        setAuthState('authenticated');
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

  // Route based on auth state.
  // On initial load: always navigate explicitly (segments may not reflect
  // the rendered route on the first render cycle).
  // After initial load: react to ongoing state changes (e.g. sign-out).
  useEffect(() => {
    if (!appReady || authState === 'loading') return;

    if (!initialRouteHandled.current) {
      initialRouteHandled.current = true;
      switch (authState) {
        case 'unauthenticated':
          router.replace('/(auth)/login');
          break;
        case 'onboarding-verification':
          router.replace('/(auth)/onboarding/verify-email');
          break;
        case 'onboarding-child':
          router.replace('/(auth)/onboarding/step-2');
          break;
        case 'onboarding-activity':
          router.replace('/(auth)/onboarding/step-3');
          break;
        case 'authenticated':
          router.replace('/(tabs)/home');
          break;
      }
      return;
    }

    // Ongoing state changes — redirect across group boundaries
    const inAuthGroup = segments[0] === '(auth)';
    if (authState === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (authState === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [authState, segments, appReady, router]);

  if (!appReady || (!fontsLoaded && !fontError)) {
    return <View style={styles.loading} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
    <AuthContext.Provider value={authContextValue}>
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(settings)" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="(modals)" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
    </QueryClientProvider>
    </AuthContext.Provider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
