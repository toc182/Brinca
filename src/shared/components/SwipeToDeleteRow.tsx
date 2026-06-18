import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { colors, spacing, typography } from '../theme';
import { useDestructiveAlert } from '../hooks/useDestructiveAlert';

interface SwipeToDeleteRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  confirmTitle: string;
  confirmMessage: string;
  /**
   * Rounded-card mode. Pass the child card's corner radius when the child is a
   * rounded card on a tinted page (not an edge-to-edge list row): the white row
   * backing is dropped (the card brings its own) and the container is rounded to
   * this radius and painted red, so the red delete shows flush through the
   * card's own rounded corners as it slides — no square corner clash, no notch.
   */
  borderRadius?: number;
}

/**
 * Swipe-left-to-reveal-delete row.
 * Shows a red "Delete" button on swipe; tapping it shows a destructive
 * native iOS alert before executing onDelete.
 *
 * While the Delete button is revealed, a transparent overlay sits on top of
 * the row content so a tap closes the actions instead of triggering the
 * row's own onPress (iOS Mail behavior). Note for callers: a pressable row
 * inside this component must use the gesture-handler Pressable, not RN's —
 * RN's isn't cancelled when the swipe pan activates, so a swipe would also
 * fire the row press.
 *
 * Per UX conventions §1 (native iOS alerts for destructive confirmations).
 */
export function SwipeToDeleteRow({
  children,
  onDelete,
  confirmTitle,
  confirmMessage,
  borderRadius,
}: SwipeToDeleteRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const [revealed, setRevealed] = useState(false);
  const { showDestructiveAlert } = useDestructiveAlert();

  function handleDeletePress() {
    swipeableRef.current?.close();
    showDestructiveAlert({
      title: confirmTitle,
      message: confirmMessage,
      onConfirm: onDelete,
    });
  }

  function renderRightActions() {
    return (
      <Pressable
        onPress={handleDeletePress}
        style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}
      >
        <Text style={styles.deleteLabel}>Delete</Text>
      </Pressable>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={[
        styles.swipeContainer,
        borderRadius != null && [styles.swipeContainerCard, { borderRadius }],
      ]}
      childrenContainerStyle={styles.childrenContainer}
      onSwipeableWillOpen={() => setRevealed(true)}
      onSwipeableClose={() => setRevealed(false)}
    >
      <View style={[styles.row, borderRadius != null && styles.rowTransparent]}>
        {children}
        {revealed && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => swipeableRef.current?.close()}
            accessibilityLabel="Close delete action"
          />
        )}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // Let the swipeable inherit its slot's width (e.g. a half-width grid cell)
  // instead of sizing to the content's intrinsic width.
  swipeContainer: {
    alignSelf: 'stretch',
    minWidth: 0,
  },
  // Rounded-card mode: round the container (it already clips its children) and
  // paint it red, so when the card slides the red shows through the card's own
  // rounded corners — flush, no notch — while the card keeps its full rounding.
  swipeContainerCard: {
    backgroundColor: colors.error500,
    overflow: 'hidden',
  },
  childrenContainer: {
    width: '100%',
    minWidth: 0,
  },
  row: {
    width: '100%',
    minWidth: 0,
    backgroundColor: colors.surface,
  },
  // In rounded mode the child card brings its own background; drop the white
  // backing so the red delete action shows through the card's rounded corners
  // instead of a white sliver.
  rowTransparent: {
    backgroundColor: 'transparent',
  },
  deleteAction: {
    backgroundColor: colors.error500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  deleteActionPressed: {
    backgroundColor: colors.error600,
  },
  deleteLabel: {
    ...typography.buttonSmall,
    color: colors.textOnPrimary,
  },
});