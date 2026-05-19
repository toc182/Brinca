import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';

export function AppKeyboardToolbar() {
  return (
    <KeyboardToolbar opacity="00">
      <KeyboardToolbar.Background>
        <BlurView
          tint="systemUltraThinMaterial"
          intensity={100}
          style={StyleSheet.absoluteFill}
        />
      </KeyboardToolbar.Background>
      <KeyboardToolbar.Prev />
      <KeyboardToolbar.Next />
      <KeyboardToolbar.Done />
    </KeyboardToolbar>
  );
}
