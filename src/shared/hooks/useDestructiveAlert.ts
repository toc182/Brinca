import { Alert } from 'react-native';

interface DestructiveAlertOptions {
  title: string;
  message: string;
  destructiveLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useDestructiveAlert() {
  const showDestructiveAlert = ({
    title,
    message,
    destructiveLabel = 'Delete',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
  }: DestructiveAlertOptions) => {
    Alert.alert(title, message, [
      {
        text: cancelLabel,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: destructiveLabel,
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  };

  return { showDestructiveAlert };
}
