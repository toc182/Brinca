import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { House, Lightning, ChartBar, User } from 'phosphor-react-native';

import { MiniPlayerBar } from '@/features/session-logging/components/MiniPlayerBar';
import { colors } from '@/shared/theme';

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
