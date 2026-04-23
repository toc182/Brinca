import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
  Extrapolation,
} from 'react-native-reanimated';

import { colors } from '../theme';

// Use native gradient blur on iOS, fallback to expo-blur on Android
let GradientBlurBackground: React.ComponentType<{ style: object; fadeStart?: number }>;

if (Platform.OS === 'ios') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GradientBlurView } = require('../../../modules/GradientBlurView') as { GradientBlurView: React.ComponentType<{ style: object; fadeStart?: number }> };
  GradientBlurBackground = GradientBlurView;
} else {
  GradientBlurBackground = ({ style }: { style: object }) => (
    <BlurView intensity={30} tint="light" style={style} />
  );
}

const TITLE_LARGE = 34;
const TITLE_SMALL = 17;
const HEADER_CONTENT = 52;
const HEADER_CONTENT_COLLAPSED = 44;
const FADE_ZONE = 30;
const SCROLL_DISTANCE = 40;

interface CollapsibleHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  rightContent?: React.ReactNode;
}

export function CollapsibleHeader({ title, scrollY, rightContent }: CollapsibleHeaderProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = useAnimatedStyle(() => {
    const contentH = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [HEADER_CONTENT, HEADER_CONTENT_COLLAPSED],
      Extrapolation.CLAMP
    );
    return { height: insets.top + contentH + FADE_ZONE };
  });

  const titleStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [TITLE_LARGE, TITLE_SMALL],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Animated.View style={[styles.outerContainer, containerStyle]} pointerEvents="box-none">
      <GradientBlurBackground style={StyleSheet.absoluteFill} fadeStart={0.55} />
      <View style={[styles.row, { top: insets.top }]} pointerEvents="box-none">
        <Animated.Text style={[styles.title, titleStyle]} numberOfLines={1}>
          {title}
        </Animated.Text>
        {rightContent}
      </View>
    </Animated.View>
  );
}

export function useCollapsibleHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_CONTENT;
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_CONTENT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.textPrimary,
    flex: 1,
  },
});
