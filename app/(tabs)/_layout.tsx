import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { House, Lightning, ChartBar, User, GearSix } from 'phosphor-react-native';

import { MiniPlayerBar } from '@/features/session-logging/components/MiniPlayerBar';
import { colors, spacing } from '@/shared/theme';

function SettingsButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.navigate('/(settings)' as never)} style={{ paddingRight: spacing.md }}>
      <GearSix color={colors.textSecondary} size={24} />
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary500,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.background },
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <House color={color} size={size} weight="fill" />,
            headerRight: () => <SettingsButton />,
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarLabel: 'Activity',
            tabBarIcon: ({ color, size }) => <Lightning color={color} size={size} weight="fill" />,
          }}
        />
        <Tabs.Screen
          name="stats/index"
          options={{
            title: 'Stats',
            tabBarLabel: 'Stats',
            tabBarIcon: ({ color, size }) => <ChartBar color={color} size={size} weight="fill" />,
          }}
        />
        <Tabs.Screen
          name="stats/[sessionId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} weight="fill" />,
          }}
        />
      </Tabs>
      <MiniPlayerBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
