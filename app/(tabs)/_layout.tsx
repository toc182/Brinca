import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { MiniPlayerBar } from '@/features/session-logging/components/MiniPlayerBar';
import { colors } from '@/shared/theme';
import { useActiveSessionStore } from '@/stores/active-session.store';

export default function TabLayout() {
  const sessionStatus = useActiveSessionStore((s) => s.status);
  const showMiniPlayer = sessionStatus !== 'idle' && sessionStatus !== 'complete';

  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={colors.primary500}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="activity">
        <NativeTabs.Trigger.Icon sf={{ default: 'bolt', selected: 'bolt.fill' }} />
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {showMiniPlayer && (
        <NativeTabs.BottomAccessory>
          <MiniPlayerBar />
        </NativeTabs.BottomAccessory>
      )}
    </NativeTabs>
  );
}
