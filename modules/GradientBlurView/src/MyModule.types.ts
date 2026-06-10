import type { ViewProps } from 'react-native';

export interface GradientBlurViewProps extends ViewProps {
  /** Where the blur starts fading along the direction axis (0 = start edge, 1 = end edge). Default: 0.7 */
  fadeStart?: number;
  /** Direction the blur fades. 'down' (default): opaque at top, fades clear at bottom. 'up': opaque at bottom, fades clear at top. */
  fadeDirection?: 'up' | 'down';
}
