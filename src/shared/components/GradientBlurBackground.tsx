import { Platform, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Platform-conditional gradient blur background. Absolute-positioned, used as
 * a background on top-anchored headers (ModalHeader, CollapsibleHeader,
 * SessionHeader) and bottom-anchored footers (SessionFooter). On iOS uses the
 * native GradientBlurView module; on Android falls back to expo-blur (solid
 * blur, no gradient fade — direction ignored).
 *
 * `fadeStart` controls how far along the direction axis the blur stays fully
 * opaque before fading to clear (0..1). `fadeDirection` flips the axis: 'down'
 * is opaque at top, 'up' is opaque at bottom. Both only honored on iOS.
 */
interface Props {
  style: ViewStyle | ViewStyle[];
  fadeStart?: number;
  fadeDirection?: 'up' | 'down';
}

let GradientBlurBackgroundImpl: React.ComponentType<Props>;

if (Platform.OS === 'ios') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GradientBlurView } = require('../../../modules/GradientBlurView') as {
    GradientBlurView: React.ComponentType<Props>;
  };
  GradientBlurBackgroundImpl = GradientBlurView;
} else {
  GradientBlurBackgroundImpl = ({ style }: Props) => (
    <BlurView intensity={30} tint="light" style={style} />
  );
}

export const GradientBlurBackground = GradientBlurBackgroundImpl;
