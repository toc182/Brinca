import { requireNativeView } from 'expo';
import * as React from 'react';

import type { GradientBlurViewProps } from './MyModule.types';

const NativeView: React.ComponentType<GradientBlurViewProps> =
  requireNativeView('GradientBlurView');

export default function GradientBlurView(props: GradientBlurViewProps) {
  return <NativeView {...props} />;
}
