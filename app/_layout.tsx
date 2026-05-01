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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
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
import { GlobalToast } from '@/shared/components/GlobalToast';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { rehydrateActivities } from '@/lib/sync/rehydrate';
import { resolveAuthFromUser, ensureFKChainAndVerify } from '@/lib/supabase/auth-recovery';
import { ErrorState } from '@/shared/components/ErrorState';
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

  const authStateRef = useRef<AuthState>('loading');
  const recoveryInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

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

  const recover = useCallback(async (): Promise<void> => {
    if (recoveryInFlight.current) {
      return recoveryInFlight.current;
    }
    const run = (async () => {
      setAuthState('loading');
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          await supabase.auth.signOut().catch(() => {});
          setAuthState('unauthenticated');
          return;
        }

        const { pendingVerificationEmail } = useOnboardingStore.getState();
        if (pendingVerificationEmail) {
          setAuthState('onboarding-verification');
          return;
        }

        const activeChild = useActiveChildStore.getState();
        if (activeChild.childId && activeChild.familyId) {
          await ensureFKChainAndVerify(
            activeChild.childId,
            activeChild.familyId,
            activeChild.childName,
          );
          setAuthState('authenticated');
          rehydrateActivities(activeChild.childId, queryClient).catch(console.error);
          return;
        }

        const result = await resolveAuthFromUser(userData.user.id);
        if (result.state === 'authenticated') {
          useActiveChildStore.getState().setActiveChild(
            result.childId,
            result.childName,
            result.familyId,
          );
          setAuthState('authenticated');
          rehydrateActivities(result.childId, queryClient).catch(console.error);
        } else {
          if (result.pendingFamilyId) {
            useOnboardingStore.getState().setPendingFamilyId(result.pendingFamilyId);
          }
          setAuthState('onboarding-child');
        }
      } catch (error) {
        Sentry.captureException(error, { extra: { context: 'auth-recovery' } });
        setAuthState('auth-error');
      }
    })();
    recoveryInFlight.current = run;
    try {
      await run;
    } finally {
      recoveryInFlight.current = null;
    }
  }, []);

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

        await recover();
      } catch (error) {
        Sentry.captureException(error, { extra: { context: 'init' } });
        setAuthState('auth-error');
      } finally {
        setAppReady(true);
      }
    }

    init();
  }, [recover]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setAuthState('unauthenticated');
        return;
      }
      if (event === 'SIGNED_IN') {
        await recover();
        return;
      }
      if (event === 'TOKEN_REFRESHED') {
        // Don't auto-dismiss the auth-error UI on a background token refresh —
        // the user's retry tap is the explicit recovery signal.
        if (authStateRef.current === 'auth-error') return;
        await recover();
      }
    });
    return () => subscription.unsubscribe();
  }, [recover]);

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
    <KeyboardProvider>
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
      {authState === 'auth-error' && (
        <View style={styles.errorOverlay}>
          <ErrorState onRetry={recover} />
        </View>
      )}
      <GlobalToast />
    </QueryClientProvider>
    </AuthContext.Provider>
    </KeyboardProvider>
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
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
});
