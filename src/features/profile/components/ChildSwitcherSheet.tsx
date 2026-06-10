import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { GearSix } from 'phosphor-react-native';

import { Avatar } from '@/shared/components/Avatar';
import { colors, typography, spacing, radii } from '@/shared/theme';

interface ChildItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
}

interface ChildSwitcherSheetProps {
  sheetRef: React.RefObject<BottomSheetMethods | null>;
  children: ChildItem[];
  activeChildId: string | null;
  onSelectChild: (child: ChildItem) => void;
  onAddChild: () => void;
  onGoToAccountsCenter?: () => void;
}

function calculateAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '';
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return `${age} yrs`;
}

export function ChildSwitcherSheet({
  sheetRef,
  children: childrenList,
  activeChildId,
  onSelectChild,
  onAddChild,
  onGoToAccountsCenter,
}: ChildSwitcherSheetProps) {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['75%'], []);

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
  }, [sheetRef]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
      >
        {childrenList.map((child) => {
          const isActive = child.id === activeChildId;
          return (
            <Pressable
              key={child.id}
              style={({ pressed }) => [
                styles.childRow,
                isActive && styles.childRowActive,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                onSelectChild(child);
                handleClose();
              }}
            >
              <Avatar imageUrl={child.avatarUrl} name={child.name} size="medium" />
              <View style={styles.childInfo}>
                <Text style={styles.childName} numberOfLines={1}>
                  {child.name}
                </Text>
                {child.dateOfBirth ? (
                  <Text style={styles.childAge}>{calculateAge(child.dateOfBirth)}</Text>
                ) : null}
              </View>
              {isActive ? <Text style={styles.checkmark}>{'✓'}</Text> : null}
            </Pressable>
          );
        })}

        <Pressable
          style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
          onPress={() => {
            onAddChild();
            handleClose();
          }}
        >
          <View style={styles.addIcon}>
            <Text style={styles.addIconText}>+</Text>
          </View>
          <Text style={styles.addLabel}>Add child</Text>
        </Pressable>

        {onGoToAccountsCenter ? (
          <Pressable
            style={({ pressed }) => [styles.accountsRow, pressed && styles.pressed]}
            onPress={onGoToAccountsCenter}
          >
            <GearSix size={20} color={colors.textSecondary} />
            <Text style={styles.accountsLabel}>Go to Accounts Center</Text>
          </Pressable>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  indicator: {
    backgroundColor: colors.borderDefault,
    width: 40,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  childRowActive: {
    backgroundColor: colors.primary50,
  },
  pressed: {
    opacity: 0.7,
  },
  childInfo: {
    flex: 1,
    gap: spacing.xxxs,
  },
  childName: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  childAge: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  checkmark: {
    ...typography.titleSmall,
    color: colors.primary500,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 22,
    color: colors.primary500,
  },
  addLabel: {
    ...typography.titleSmall,
    color: colors.primary500,
  },
  accountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.xs,
  },
  accountsLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
