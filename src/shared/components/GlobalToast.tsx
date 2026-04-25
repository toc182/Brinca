import { useCallback, useEffect, useState } from 'react';

import { Toast } from './Toast';
import { dismissToast, subscribeToast } from '../utils/toast';

export function GlobalToast() {
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeToast((state) => {
      setMessage(state.message);
      setVariant(state.variant);
      setVisible(state.visible);
    });
  }, []);

  const handleDismiss = useCallback(() => {
    dismissToast();
  }, []);

  return (
    <Toast
      message={message}
      variant={variant}
      visible={visible}
      onDismiss={handleDismiss}
    />
  );
}