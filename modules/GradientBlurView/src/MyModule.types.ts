import type { ViewProps } from 'react-native';

export interface GradientBlurViewProps extends ViewProps {
  /** Where the blur starts fading (0 = top, 1 = bottom). Default: 0.7 */
  fadeStart?: number;
}
