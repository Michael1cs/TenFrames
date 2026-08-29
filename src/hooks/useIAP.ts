import {useEffect, useCallback, useState} from 'react';
import {
  useIAP as useIAPHook,
  getAvailablePurchases as iapGetAvailablePurchases,
  ErrorCode,
  type Product,
  type Purchase,
  type PurchaseError,
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

// A purchase only counts as owned once Google reports it settled. A 'pending'
// state means the payment is still being approved (cash payments, family
// approval flows) — granting premium there would hand out the unlock for free.
function isOwned(purchase: Purchase): boolean {
  return (
    purchase.productId === PREMIUM_PRODUCT_ID &&
    purchase.purchaseState === 'purchased'
  );
}

export function useIAPConnection(
  onPurchaseSuccess: () => void,
): IAPState {
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchRequested, setFetchRequested] = useState(false);

  const {
    connected,
    products,
    fetchProducts,
    finishTransaction,
    requestPurchase: iapRequestPurchase,
  } = useIAPHook({
    onPurchaseSuccess: async (purchase: Purchase) => {
      if (!isOwned(purchase)) {
        return;
      }
      // Acknowledge the transaction — Google auto-refunds after 3 days otherwise.
      await finishTransaction({purchase, isConsumable: false});
      setPurchasing(false);
      onPurchaseSuccess();
    },
    onPurchaseError: (err: PurchaseError) => {
      setPurchasing(false);
      if (err.code === ErrorCode.UserCancelled) {
        return;
      }
      setError(err.message || 'Purchase failed');
    },
    // Non-purchase errors (fetchProducts, connection). Silent on purpose: the
    // store being unreachable should not throw an error at a 5-year-old.
    onError: () => {},
  });

  // Fetch the product once the store connects. Guarded because fetchProducts
  // changes identity as hook state updates, which would otherwise re-fire this.
  useEffect(() => {
    if (!connected || fetchRequested) {
      return;
    }
    setFetchRequested(true);
    fetchProducts({skus: [PREMIUM_PRODUCT_ID], type: 'in-app'});
  }, [connected, fetchRequested, fetchProducts]);

  // On Product the SKU is `id` (on Purchase it is `productId` — they differ).
  const product = products.find(p => p.id === PREMIUM_PRODUCT_ID) || null;

  const requestPurchase = useCallback(async () => {
    if (!connected) {
      setError('Store not connected');
      return;
    }
    setPurchasing(true);
    setError(null);
    try {
      await iapRequestPurchase({
        type: 'in-app',
        request: {
          google: {skus: [PREMIUM_PRODUCT_ID]},
          apple: {sku: PREMIUM_PRODUCT_ID},
        },
      });
    } catch (err: any) {
      setPurchasing(false);
      if (err?.code !== ErrorCode.UserCancelled) {
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
      // The hook's getAvailablePurchases returns void and fills hook state; the
      // standalone export returns the array, which is what this flow needs.
      const purchases = await iapGetAvailablePurchases();
      if (purchases.some(isOwned)) {
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
