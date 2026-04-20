import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

interface DestructiveAlertOptions {
  title: string;
  message: string;
  destructiveLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Native iOS alert wrapper for destructive confirmations.
 * Uses bilingual labels from i18n when no custom labels provided.
 */
export function useDestructiveAlert() {
  const { t } = useTranslation();

  const showDestructiveAlert = ({
    title,
    message,
    destructiveLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }: DestructiveAlertOptions) => {
    Alert.alert(title, message, [
      {
        text: cancelLabel ?? t('cta.cancel'),
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: destructiveLabel ?? t('cta.delete'),
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  };

  return { showDestructiveAlert };
}
