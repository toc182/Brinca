import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { colors } from '@/shared/theme';
import { GlobalToast } from '@/shared/components/GlobalToast';

export default function SettingsLayout() {
  return (
    <BottomSheetModalProvider>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary500,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="menu"
        options={{ title: 'Settings', headerShown: false }}
      />
      <Stack.Screen name="activities/index" options={{ title: 'Activities', headerShown: false }} />
      <Stack.Screen name="activities/create" options={{ title: 'New Activity', presentation: 'modal' }} />
      <Stack.Screen name="activities/[activityId]/index" options={{ title: 'Activity', headerShown: false }} />
      <Stack.Screen
        name="activities/[activityId]/create-drill"
        options={{ title: 'New Drill', presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="activities/[activityId]/[drillId]" options={{ title: 'Edit Drill', headerShown: false }} />
      <Stack.Screen name="child/edit-profile" options={{ title: 'Edit Profile', presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="child/measurements" options={{ title: 'Measurements', headerShown: false }} />
      <Stack.Screen name="child/measurement-edit" options={{ title: 'Edit Measurement', presentation: 'modal' }} />
      <Stack.Screen name="child/external-activities" options={{ title: 'External Activities', headerShown: false }} />
      <Stack.Screen name="child/external-activity-edit" options={{ title: 'Edit Activity', presentation: 'modal' }} />
      <Stack.Screen name="accounts-center/index" options={{ title: 'Accounts Center', headerShown: false }} />
      <Stack.Screen name="accounts-center/[memberId]" options={{ title: 'Member', headerShown: false }} />
      <Stack.Screen name="add-child" options={{ title: 'Add child', presentation: 'modal', headerShown: false }} />
    </Stack>
    <GlobalToast />
    </BottomSheetModalProvider>
  );
}
