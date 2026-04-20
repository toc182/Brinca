import { Stack } from 'expo-router';
import { colors } from '@/shared/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary500,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="activities/index" options={{ title: 'Activities' }} />
      <Stack.Screen name="activities/[activityId]" options={{ title: 'Activity' }} />
      <Stack.Screen name="activities/[activityId]/[drillId]" options={{ title: 'Edit Drill' }} />
    </Stack>
  );
}
