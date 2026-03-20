import {useCallback, useState} from 'react';

// Placeholder IAP hook — real Google Play Billing will be added in a future update.
// The premium system works locally (upgradeToPremium sets the flag).
// When react-native-iap is properly integrated, this hook will connect to the store.

export interface IAPState {
  connected: boolean;
  product: null;
  purchasing: boolean;
  restoring: boolean;
  error: string | null;
  requestPurchase: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearError: () => void;
}

export function useIAPConnection(
  onPurchaseSuccess: () => void,
): IAPState {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder: directly triggers premium unlock (no real payment)
  const requestPurchase = useCallback(async () => {
    setPurchasing(true);
    setError(null);
    // Simulate purchase success
    setTimeout(() => {
      setPurchasing(false);
      onPurchaseSuccess();
    }, 500);
  }, [onPurchaseSuccess]);

  const restorePurchases = useCallback(async () => {
    setError('no_previous_purchase');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connected: true,
    product: null,
    purchasing,
    restoring: false,
    error,
    requestPurchase,
    restorePurchases,
    clearError,
  };
}
