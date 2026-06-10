import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { GlobalToast } from '@/shared/components/GlobalToast';

export default function ModalsLayout() {
  return (
    <BottomSheetModalProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="session/index" />
      <Stack.Screen name="session/[drillId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="session-summary" options={{ presentation: 'card' }} />
    </Stack>
    <GlobalToast />
    </BottomSheetModalProvider>
  );
}
