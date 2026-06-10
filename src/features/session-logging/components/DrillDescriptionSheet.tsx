import { forwardRef, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import { useDrillDescriptionPhotos } from '@/features/activity-builder/hooks/useDrillDescriptionPhotos';
import { colors, radii, spacing, typography } from '@/shared/theme';

import { PhotoGallery } from './PhotoGallery';

interface DrillDescriptionSheetProps {
  /**
   * Drill template id whose description + photos this sheet shows.
   * Photos are fetched lazily via `useDrillDescriptionPhotos`, signed-URL
   * cache is shared with any other consumer of the same hook.
   */
  drillId: string;
  description: string | null;
}

/**
 * Read-only viewer for a drill template's description. Opened from the
 * DrillScreen header info icon during a live session. Description text on
 * top, horizontal photo strip below — tapping a photo opens the existing
 * lightbox inside PhotoGallery.
 */
export const DrillDescriptionSheet = forwardRef<BottomSheetModal, DrillDescriptionSheetProps>(
  function DrillDescriptionSheet({ drillId, description }, ref) {
    const { photos } = useDrillDescriptionPhotos(drillId);
    const trimmedDescription = description?.trim() ?? '';

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
      <BottomSheetModal
        ref={ref}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        handleStyle={styles.handle}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>About this drill</Text>

          {trimmedDescription.length > 0 ? (
            <Text style={styles.descriptionText}>{trimmedDescription}</Text>
          ) : null}

          {photos.length > 0 ? (
            <View>
              <PhotoGallery photos={photos} />
            </View>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
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
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  sheetTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  descriptionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
});
