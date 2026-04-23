import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { X } from 'phosphor-react-native';

import { useActiveChildStore } from '@/stores/active-child.store';
import { EmptyState } from '@/shared/components/EmptyState';
import { colors, typography, spacing, radii } from '@/shared/theme';

import { profileKeys } from '../queries/keys';
import { getPhotosByChild, type PhotoRow } from '../repositories/photo.repository';

const MAX_GRID_PHOTOS = 6;

export function PhotosSection() {
  const childId = useActiveChildStore((s) => s.childId);
  const [viewerPhoto, setViewerPhoto] = useState<PhotoRow | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const { data: photos = [] } = useQuery({
    queryKey: profileKeys.photos(childId ?? ''),
    queryFn: () => getPhotosByChild(childId!),
    enabled: !!childId,
  });

  const gridPhotos = photos.slice(0, MAX_GRID_PHOTOS);
  const hasMore = photos.length > MAX_GRID_PHOTOS;

  const handlePhotoPress = useCallback((photo: PhotoRow) => {
    setViewerPhoto(photo);
  }, []);

  if (photos.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <EmptyState
          title="No photos yet"
          body="Photos taken during sessions will appear here."
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Photos</Text>
        {hasMore ? (
          <Pressable
            onPress={() => setShowGallery(true)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.grid}>
        {gridPhotos.map((photo, index) => (
          <Pressable
            key={`${photo.url}-${index}`}
            onPress={() => handlePhotoPress(photo)}
            style={({ pressed }) => [styles.gridItem, pressed && styles.pressed]}
          >
            <Image source={{ uri: photo.url }} style={styles.gridImage} />
          </Pressable>
        ))}
      </View>

      {/* Full-screen photo viewer */}
      <Modal
        visible={viewerPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerPhoto(null)}
      >
        <View style={styles.viewerContainer}>
          <Pressable
            onPress={() => setViewerPhoto(null)}
            style={styles.viewerClose}
          >
            <X size={28} color={colors.textOnPrimary} weight="bold" />
          </Pressable>
          {viewerPhoto ? (
            <Image
              source={{ uri: viewerPhoto.url }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>

      {/* Full gallery modal */}
      <Modal
        visible={showGallery}
        animationType="slide"
        onRequestClose={() => setShowGallery(false)}
      >
        <View style={styles.galleryContainer}>
          <View style={styles.galleryHeader}>
            <Text style={styles.galleryTitle}>All Photos</Text>
            <Pressable
              onPress={() => setShowGallery(false)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <X size={24} color={colors.textPrimary} weight="bold" />
            </Pressable>
          </View>
          <View style={styles.galleryGrid}>
            {photos.map((photo, index) => (
              <Pressable
                key={`gallery-${photo.url}-${index}`}
                onPress={() => {
                  setShowGallery(false);
                  setViewerPhoto(photo);
                }}
                style={({ pressed }) => [styles.galleryItem, pressed && styles.pressed]}
              >
                <Image source={{ uri: photo.url }} style={styles.galleryImage} />
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary500,
  },
  pressed: {
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  gridItem: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 56,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xxl,
    backgroundColor: colors.background,
  },
  galleryTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    padding: spacing.md,
  },
  galleryItem: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
});