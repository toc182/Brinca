import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import ImageView from 'react-native-image-viewing';
import { ArrowClockwise, ImageBroken, X } from 'phosphor-react-native';

import { colors, radii, spacing } from '@/shared/theme';
import type { PhotoItem } from '../hooks/useDrillPhotos';

interface PhotoGalleryProps {
  photos: PhotoItem[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}

const TILE_SIZE = 80;

export function PhotoGallery({ photos, onRemove, onRetry }: PhotoGalleryProps) {
  // Lightbox state — viewing a photo opens an internal full-screen viewer
  // with pinch-zoom and swipe between siblings in the same gallery.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Build the viewer image list from any photos that have a renderable URI.
  // Pending/failed photos with a local_uri still display correctly in the
  // viewer (they're file:// URIs). The mapping back to the tap index uses
  // photo.id so reordering or removal doesn't shift indices.
  const viewerImages = useMemo(
    () => photos.filter((p) => !!p.uri).map((p) => ({ uri: p.uri, id: p.id })),
    [photos],
  );

  if (photos.length === 0) return null;

  const handleRemove = (id: string) => {
    if (!onRemove) return;
    Alert.alert('Remove photo', 'Remove this photo from the drill?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(id) },
    ]);
  };

  const handleView = (id: string) => {
    const idx = viewerImages.findIndex((img) => img.id === id);
    if (idx >= 0) setViewerIndex(idx);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {photos.map((photo) => (
          <PhotoTile
            key={photo.id}
            photo={photo}
            onRemove={onRemove ? handleRemove : undefined}
            onRetry={onRetry}
            onView={handleView}
          />
        ))}
      </ScrollView>
      <ImageView
        images={viewerImages.map(({ uri }) => ({ uri }))}
        imageIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onRequestClose={() => setViewerIndex(null)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />
    </>
  );
}

interface PhotoTileProps {
  photo: PhotoItem;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  onView: (id: string) => void;
}

function PhotoTile({ photo, onRemove, onRetry, onView }: PhotoTileProps) {
  const hasUri = !!photo.uri;
  // Image-load state — driven entirely by expo-image's lifecycle. Starts
  // false so memory-cache hits (which paint synchronously and never fire
  // onLoadStart / onLoad) don't leave the spinner stuck on. A real network
  // or disk fetch flips it true via onLoadStart, then back via onLoad.
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <View style={styles.tile}>
      <Pressable
        onPress={() => onView(photo.id)}
        disabled={!hasUri || imgError}
        style={styles.tileBody}
        accessibilityLabel="View photo"
      >
        {hasUri && !imgError && (
          <Image
            source={{ uri: photo.uri }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={photo.id}
            transition={150}
            onLoadStart={() => setImgLoading(true)}
            onLoad={() => setImgLoading(false)}
            onError={() => {
              setImgLoading(false);
              setImgError(true);
            }}
          />
        )}

        {imgLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary500} />
          </View>
        )}

        {imgError && (
          <View style={styles.errorOverlay}>
            <ImageBroken size={24} color={colors.textSecondary} weight="regular" />
          </View>
        )}

        {photo.status === 'pending' && (
          <View style={styles.statusBadge}>
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          </View>
        )}
        {photo.status === 'failed' && onRetry && (
          <Pressable
            onPress={() => onRetry(photo.id)}
            style={styles.retryBadge}
            accessibilityLabel="Retry upload"
          >
            <ArrowClockwise size={14} color={colors.textOnPrimary} weight="bold" />
          </Pressable>
        )}
      </Pressable>
      {onRemove && (
        <Pressable
          onPress={() => onRemove(photo.id)}
          style={styles.removeBadge}
          accessibilityLabel="Remove photo"
          hitSlop={spacing.xs}
        >
          <X size={12} color={colors.textOnPrimary} weight="bold" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tileBody: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDisabled,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDisabled,
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 11, 31, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
