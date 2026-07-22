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
import { AppState, type AppStateStatus, LogBox, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AuthContext } from '@/shared/contexts/AuthContext';
import type { AuthState } from '@/shared/contexts/AuthContext';

import { getDatabase } from '@/lib/sqlite/db';
import { initSentry } from '@/lib/sentry';
import { getSession } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { startSyncEngine } from '@/lib/sync/engine';
import { processPendingPhotos } from '@/lib/sync/photo-upload-queue';
import '@/shared/i18n/config';
import { colors } from '@/shared/theme';
import { GlobalToast } from '@/shared/components/GlobalToast';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useParentProfileStore } from '@/stores/parent-profile.store';
import { rehydrateChildData, hydrateFamilyChildren } from '@/lib/sync/rehydrate';
import { pullChildDataSafe } from '@/lib/sync/pull';
import { prefetchProfile } from '@/features/accounts-center/hooks/useAccountsCenter';
import { resolveAuthFromUser, ensureFKChainAndVerify } from '@/lib/supabase/auth-recovery';
import { withTimeout } from '@/lib/async/withTimeout';
import { ErrorState } from '@/shared/components/ErrorState';
import * as Sentry from '@sentry/react-native';

// Native Sentry SDK warning fires before JS init runs in dev builds; harmless, suppress.
if (__DEV__) {
  LogBox.ignoreLogs([/\[SentrySessionReplay\]/]);
}

initSentry();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

// Launch resilience: bound every startup network/IO await so a stalled network
// can never freeze the app on a blank/splash screen. Per-step timeout is the
// primary guard; the watchdog is the absolute backstop. See src/lib/async/withTimeout.
const LAUNCH_STEP_TIMEOUT_MS = 8000;
const LAUNCH_WATCHDOG_MS = 18000;

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
  // Becomes true once the initial auth-based navigation has been issued. The
  // splash stays up until then so the user never sees the navigator's first
  // (possibly restored) frame before we redirect to the correct screen.
  const [navReady, setNavReady] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const authContextValue = useMemo(() => ({ setAuthState }), []);

  const [bootTimedOut, setBootTimedOut] = useState(false);
  const authStateRef = useRef<AuthState>('loading');
  const appReadyRef = useRef(false);
  const recoveryInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  useEffect(() => {
    appReadyRef.current = appReady;
  }, [appReady]);

  // Pull a child's activities/drills/tracking_elements whenever they BECOME the
  // active child — one choke point covering the profile switcher, onboarding,
  // and any future switch UI. Without this, switching to a sibling that
  // hydrateFamilyChildren bulk-added shows an empty activity grid until a cold
  // relaunch (rehydrateActivities otherwise runs only for the auth-time active
  // child). Guarded + idempotent: a no-op once the child has local rows, so
  // repeat switches are cheap. The auth-restore paths keep their own explicit
  // call because the fast path restores childId from MMKV before this subscribes
  // (no change event fires).
  useEffect(() => {
    const unsubscribe = useActiveChildStore.subscribe((state, prev) => {
      if (state.childId && state.childId !== prev.childId) {
        // Bootstrap missing rows for a never-loaded child, then pull deltas so a
        // sibling edited on another device is current on switch, not stale.
        rehydrateChildData(state.childId, queryClient).catch(console.error);
        pullChildDataSafe(state.childId, queryClient);
      }
    });
    return unsubscribe;
  }, []);

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
      const activeChild = useActiveChildStore.getState();
      const hasLocalIdentity = !!(activeChild.childId && activeChild.familyId);
      try {
        Sentry.addBreadcrumb({ category: 'launch', message: 'recover:getUser start' });
        const { data: userData, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          LAUNCH_STEP_TIMEOUT_MS,
          'getUser',
        );
        Sentry.addBreadcrumb({ category: 'launch', message: 'recover:getUser done' });
        if (userError || !userData.user) {
          await supabase.auth.signOut().catch(() => {});
          setAuthState('unauthenticated');
          return;
        }

        const meta = userData.user.user_metadata as {
          full_name?: string;
          avatar_url?: string;
          email?: string;
        };
        useParentProfileStore.getState().setProfile(
          meta.full_name ?? meta.email ?? null,
          meta.avatar_url ?? null,
        );
        // Warm the parent profile query (network fetch + signed avatar URL) now
        // so opening Settings later renders the parent photo instantly instead
        // of cold-fetching on open. Fire-and-forget; non-fatal on error.
        void prefetchProfile(queryClient).catch(() => {});

        const { pendingVerificationEmail } = useOnboardingStore.getState();
        if (pendingVerificationEmail) {
          setAuthState('onboarding-verification');
          return;
        }

        if (hasLocalIdentity) {
          try {
            await withTimeout(
              ensureFKChainAndVerify(
                activeChild.childId!,
                activeChild.familyId!,
                activeChild.childName,
              ),
              LAUNCH_STEP_TIMEOUT_MS,
              'ensureFKChain',
            );
          } catch {
            // Best-effort server verify. We already trust the local (MMKV)
            // identity, so a slow/stalled check must not block launch.
            Sentry.addBreadcrumb({ category: 'launch', message: 'recover:fkChain skipped' });
          }
          setAuthState('authenticated');
          rehydrateChildData(activeChild.childId!, queryClient).catch(console.error);
          pullChildDataSafe(activeChild.childId!, queryClient);
          hydrateFamilyChildren(activeChild.familyId!, queryClient).catch(console.error);
          return;
        }

        const result = await withTimeout(
          resolveAuthFromUser(userData.user.id),
          LAUNCH_STEP_TIMEOUT_MS,
          'resolveAuthFromUser',
        );
        if (result.state === 'authenticated') {
          useActiveChildStore.getState().setActiveChild(
            result.childId,
            result.childName,
            result.familyId,
          );
          setAuthState('authenticated');
          rehydrateChildData(result.childId, queryClient).catch(console.error);
          pullChildDataSafe(result.childId, queryClient);
          hydrateFamilyChildren(result.familyId, queryClient).catch(console.error);
        } else {
          if (result.pendingFamilyId) {
            useOnboardingStore.getState().setPendingFamilyId(result.pendingFamilyId);
          }
          setAuthState('onboarding-child');
        }
      } catch (error) {
        // Offline-first: if a launch network call stalled or failed but we already
        // have a local active child, open the app from local state instead of
        // blocking on the server. Fire-and-forget rehydrate backfills on reconnect.
        if (hasLocalIdentity) {
          Sentry.captureMessage('launch: auth network stalled, opening offline from local identity', 'warning');
          setAuthState('authenticated');
          rehydrateChildData(activeChild.childId!, queryClient).catch(console.error);
          hydrateFamilyChildren(activeChild.familyId!, queryClient).catch(console.error);
          return;
        }
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

  // Initialize DB + sync engine + check auth state (Sentry init runs at module load)
  useEffect(() => {
    async function init() {
      let dbReady = false;
      try {
        Sentry.addBreadcrumb({ category: 'launch', message: 'init:getDatabase start' });
        await withTimeout(getDatabase(), LAUNCH_STEP_TIMEOUT_MS, 'getDatabase');
        dbReady = true;
        Sentry.addBreadcrumb({ category: 'launch', message: 'init:getDatabase done' });
        startSyncEngine();
        // Kick the photo upload drainer once at startup so any photos that
        // were picked but didn't finish uploading in a previous session retry now.
        void processPendingPhotos();
        const session = await withTimeout(getSession(), LAUNCH_STEP_TIMEOUT_MS, 'getSession');

        if (!session) {
          const { pendingVerificationEmail } = useOnboardingStore.getState();
          setAuthState(pendingVerificationEmail ? 'onboarding-verification' : 'unauthenticated');
          return;
        }

        await recover();
      } catch (error) {
        // A stalled DB open or session read lands here via the timeout. If the DB
        // is open and we have a local active child, open the app offline-first;
        // otherwise show the retryable error screen rather than hanging forever.
        const activeChild = useActiveChildStore.getState();
        if (dbReady && activeChild.childId && activeChild.familyId) {
          Sentry.captureMessage('launch: init stalled after DB ready, opening offline', 'warning');
          setAuthState('authenticated');
        } else {
          Sentry.captureException(error, { extra: { context: 'init' } });
          setAuthState('auth-error');
        }
      } finally {
        setAppReady(true);
      }
    }

    init();
  }, [recover]);

  // Retry pending photo uploads whenever the app returns to foreground.
  // Photos picked while offline (or that failed mid-upload) sit in SQLite
  // with upload_status='pending' or 'failed'; this drainer picks them up.
  useEffect(() => {
    const handleAppStateChange = (next: AppStateStatus) => {
      if (next === 'active') void processPendingPhotos();
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Download incoming changes from other devices on the same account. The pull
  // is delta-based and cheap once warm, so we run it on every foreground and on
  // a light interval while foregrounded — this is what makes a change made on
  // one phone show up on the other without a reinstall. Guarded on authenticated
  // + a known active child; fire-and-forget (never throws).
  useEffect(() => {
    const PULL_INTERVAL_MS = 60_000;
    let interval: ReturnType<typeof setInterval> | null = null;

    const pullNow = () => {
      if (authStateRef.current !== 'authenticated') return;
      const { childId } = useActiveChildStore.getState();
      if (childId) pullChildDataSafe(childId, queryClient);
    };

    const startInterval = () => {
      if (interval == null) interval = setInterval(pullNow, PULL_INTERVAL_MS);
    };
    const stopInterval = () => {
      if (interval != null) { clearInterval(interval); interval = null; }
    };

    const handleChange = (next: AppStateStatus) => {
      if (next === 'active') { pullNow(); startInterval(); }
      else stopInterval();
    };

    // Cover the launch case (app is already 'active' when this mounts).
    if (AppState.currentState === 'active') { pullNow(); startInterval(); }
    const subscription = AppState.addEventListener('change', handleChange);
    return () => { stopInterval(); subscription.remove(); };
  }, []);

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

  // Absolute startup backstop. No matter what stalls (a wedged font load or any
  // unforeseen hang), force the app to render and lift the native splash after
  // LAUNCH_WATCHDOG_MS, so the user can never be left on a frozen splash or blank
  // screen. On a healthy launch everything resolves first and this is a no-op.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (appReadyRef.current && authStateRef.current !== 'loading') return;
      Sentry.captureMessage('launch-watchdog: forced app-ready after startup stall', 'error');
      if (authStateRef.current === 'loading') setAuthState('auth-error');
      setBootTimedOut(true);
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, LAUNCH_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, []);

  // Hide splash only after the navigator has actually COMMITTED to the target
  // route group — not merely after router.replace() is called. replace() renders
  // on a later tick, so hiding on navReady alone reveals the navigator's first
  // (restored) frame for an instant — the "settings flash". Waiting for segments
  // to reflect the target group keeps that frame behind the splash. A 2.5s
  // fallback guarantees the splash never sticks if navigation stalls.
  useEffect(() => {
    if (!navReady || (!fontsLoaded && !fontError)) return;
    const targetGroup = authState === 'authenticated' ? '(tabs)' : '(auth)';
    if (segments[0] === targetGroup) {
      SplashScreen.hideAsync();
      return;
    }
    const fallback = setTimeout(() => SplashScreen.hideAsync(), 2500);
    return () => clearTimeout(fallback);
  }, [navReady, segments, authState, fontsLoaded, fontError]);

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
      setNavReady(true);
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

  if (!bootTimedOut && (!appReady || (!fontsLoaded && !fontError))) {
    return <View style={styles.loading} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
    <KeyboardProvider>
    <AuthContext.Provider value={authContextValue}>
    <QueryClientProvider client={queryClient}>
    <BottomSheetModalProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
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
    </BottomSheetModalProvider>
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
