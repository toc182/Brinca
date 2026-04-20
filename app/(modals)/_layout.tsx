import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'fullScreenModal' }}>
      <Stack.Screen name="session/index" />
      <Stack.Screen name="session/[drillId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="session-summary" />
    </Stack>
  );
}
