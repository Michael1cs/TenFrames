import {useEffect, useCallback, useState} from 'react';
import {
  useIAP as useIAPHook,
  withIAPContext,
  getAvailablePurchases as iapGetAvailablePurchases,
  type Product,
  type Purchase,
} from 'react-native-iap';
import {PREMIUM_PRODUCT_ID} from '../config/iap';

export interface IAPState {
  connected: boolean;
  product: Product | null;
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
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    connected,
    products,
    getProducts,
    currentPurchase,
    currentPurchaseError,
    finishTransaction,
    requestPurchase: iapRequestPurchase,
    getAvailablePurchases,
    availablePurchases,
  } = useIAPHook({
    onPurchaseSuccess: async (purchase: Purchase) => {
      // Acknowledge/finish the transaction
      if (purchase.productId === PREMIUM_PRODUCT_ID) {
        await finishTransaction({purchase, isConsumable: false});
        setPurchasing(false);
        onPurchaseSuccess();
      }
    },
    onPurchaseError: (err) => {
      setPurchasing(false);
      if (err.code === 'E_USER_CANCELLED') {
        return;
      }
      setError(err.message || 'Purchase failed');
    },
  });

  // Fetch products when connected
  useEffect(() => {
    if (connected) {
      getProducts({skus: [PREMIUM_PRODUCT_ID]});
    }
  }, [connected, getProducts]);

  const product = products.find(
    p => p.productId === PREMIUM_PRODUCT_ID,
  ) || null;

  const requestPurchase = useCallback(async () => {
    if (!connected) {
      setError('Store not connected');
      return;
    }
    setPurchasing(true);
    setError(null);
    try {
      await iapRequestPurchase({sku: PREMIUM_PRODUCT_ID});
    } catch (err: any) {
      setPurchasing(false);
      if (err?.code !== 'E_USER_CANCELLED') {
        setError(err?.message || 'Purchase failed');
      }
    }
  }, [connected, iapRequestPurchase]);

  const restorePurchases = useCallback(async () => {
    if (!connected) {
      setError('Store not connected');
      return;
    }
    setRestoring(true);
    setError(null);
    try {
      const purchases = await iapGetAvailablePurchases();
      const hasPremium = purchases.some(
        (p: Purchase) => p.productId === PREMIUM_PRODUCT_ID,
      );
      if (hasPremium) {
        onPurchaseSuccess();
      } else {
        setError('no_previous_purchase');
      }
    } catch (err: any) {
      setError(err?.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  }, [connected, onPurchaseSuccess]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connected,
    product,
    purchasing,
    restoring,
    error,
    requestPurchase,
    restorePurchases,
    clearError,
  };
}

// Re-export withIAPContext for wrapping the root component
export {withIAPContext};
