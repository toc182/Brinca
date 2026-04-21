import { Stack, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { colors } from '@/shared/theme';

export default function SettingsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary500,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: colors.primary500, fontSize: 16 }}>Close</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="activities/index" options={{ title: 'Activities' }} />
      <Stack.Screen name="activities/create" options={{ title: 'New Activity' }} />
      <Stack.Screen name="activities/[activityId]/index" options={{ title: 'Activity' }} />
      <Stack.Screen name="activities/[activityId]/[drillId]" options={{ title: 'Edit Drill' }} />
      <Stack.Screen name="child/edit-profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="child/measurements" options={{ title: 'Measurements' }} />
      <Stack.Screen name="child/external-activities" options={{ title: 'External Activities' }} />
      <Stack.Screen name="accounts-center/index" options={{ title: 'Accounts Center' }} />
    </Stack>
  );
}
