import { createContext, useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { colors, radii } from '../theme';

export const InBottomSheetContext = createContext(false);

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints: Array<string | number>;
  onDismiss?: () => void;
  keyboardBehavior?: 'extend' | 'fillParent' | 'interactive';
  keyboardBlurBehavior?: 'none' | 'restore';
  // Disable when nesting a non-BottomSheetScrollView scroll container
  // (e.g. KeyboardAwareScrollView) so the content drag gesture doesn't
  // fight the inner scroll. Drag-down-to-close still works on the handle.
  enableContentPanningGesture?: boolean;
}

/**
 * Bottom sheet with drag handle, swipe-down dismiss, and scrim overlay.
 * Wraps @gorhom/bottom-sheet v5.
 *
 * Scrim uses the `scrim` token (#0F0B1F @ 40% opacity) per UX conventions §2.1.
 *
 * Usage: the sheet opens immediately on mount (index 0).
 * To close programmatically, unmount this component or use the ref approach.
 */
export function BottomSheet({
  children,
  snapPoints,
  onDismiss,
  keyboardBehavior = 'interactive',
  keyboardBlurBehavior = 'restore',
  enableContentPanningGesture = true,
}: BottomSheetProps) {
  const sheetRef = useRef<GorhomBottomSheet>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        style={[props.style, styles.backdrop]}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onClose={onDismiss}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={keyboardBlurBehavior}
      enableContentPanningGesture={enableContentPanningGesture}
    >
      <InBottomSheetContext.Provider value={true}>
        {children}
      </InBottomSheetContext.Provider>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.scrim,
  },
  handle: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.borderDefault,
  },
  background: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
  },
});
