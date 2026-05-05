import { Stack } from 'expo-router';

import { GlobalToast } from '@/shared/components/GlobalToast';

export default function ModalsLayout() {
  return (
    <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="session/index" />
      <Stack.Screen name="session/[drillId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="session-summary" options={{ presentation: 'card' }} />
    </Stack>
    <GlobalToast />
    </>
  );
}
