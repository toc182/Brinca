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
      onSwipeableWillOpen={() => setRevealed(true)}
      onSwipeableClose={() => setRevealed(false)}
    >
      <View style={styles.row}>
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
  row: {
    backgroundColor: colors.surface,
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