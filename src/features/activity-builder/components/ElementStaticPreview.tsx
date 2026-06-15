import { View } from 'react-native';

import { ElementRenderer } from '@/features/session-logging/components/elements/ElementRenderer';
import type { ElementType } from '@/shared/tracking-elements/types/element-types';
import { getDefaultValue } from '@/shared/tracking-elements/validation';

interface ElementStaticPreviewProps {
  type: ElementType;
  /** Parsed element config (callers holding a JSON string must parse first). */
  config: Record<string, unknown>;
}

const noop = () => {};

/**
 * Renders a tracking element exactly as it appears in a live session, but inert:
 * full session size, seeded with the element's resting value, and wrapped in a
 * `pointerEvents="none"` view so it can't be operated. Used on the builder
 * canvas (CreateDrillScreen) and the edit list (DrillEditScreen) so parents see
 * the real element instead of a thumbnail. No `elementId` is passed, so timers
 * sit at their resting state rather than reading persisted MMKV startTimes.
 */
export function ElementStaticPreview({ type, config }: ElementStaticPreviewProps) {
  return (
    <View pointerEvents="none">
      <ElementRenderer
        type={type}
        config={config}
        value={getDefaultValue(type)}
        onValueChange={noop}
      />
    </View>
  );
}
