import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { updateSessionPhoto } from '../repositories/session.repository';

interface SessionNotesProps {
  value: string;
  onChangeText: (text: string) => void;
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
  sessionId?: string;
}

export function SessionNotes({ value, onChangeText, photoUri, onPhotoChange, sessionId }: SessionNotesProps) {
  const handlePickPhoto = () => {
    Alert.alert('Add photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            onPhotoChange(uri);
            if (sessionId) await updateSessionPhoto(sessionId, uri);
          }
        },
      },
      {
        text: 'Photo library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            onPhotoChange(uri);
            if (sessionId) await updateSessionPhoto(sessionId, uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemovePhoto = async () => {
    onPhotoChange(null);
    if (sessionId) await updateSessionPhoto(sessionId, null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Session notes</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Session notes..."
        placeholderTextColor={colors.textPlaceholder}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          <Pressable onPress={handleRemovePhoto} style={styles.removePhotoButton}>
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={handlePickPhoto} style={styles.addPhotoButton}>
          <Text style={styles.addPhotoText}>+ Add photo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    minHeight: 80,
    marginBottom: spacing.sm,
  },
  photoContainer: { marginTop: spacing.xs },
  photo: { width: '100%', height: 160, borderRadius: radii.md, marginBottom: spacing.xs },
  removePhotoButton: { alignSelf: 'flex-start' },
  removePhotoText: { ...typography.caption, color: colors.error500 },
  addPhotoButton: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  addPhotoText: { ...typography.bodySmall, color: colors.textSecondary },
});
