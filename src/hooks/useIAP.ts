import {useEffect, useCallback, useState} from 'react';
import {
  useIAP as useIAPHook,
  withIAPContext,
  getAvailablePurchases as iapGetAvailablePurchases,
  PurchaseStateAndroid,
  type Product,
  type Purchase,
} from 'react-native-iap';
import {PREMIUM_PRODUCT_ID} from '../config/iap';
import {IS_SCHOOL_EDITION} from '../config/edition';

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

/**
 * The School Edition is paid up front and sells nothing, so it must not touch
 * StoreKit at all. Hiding the purchase UI is not enough: the hook below opens
 * a billing connection and queries PREMIUM_PRODUCT_ID on mount, and that
 * product does not exist in the school app's record — so the school build
 * would spend launch time on a connection that can only fail, on devices
 * where MDM usually blocks in-app purchases anyway, while the App Review
 * notes claim the app contains no in-app purchases.
 */
const INERT_IAP: IAPState = {
  connected: false,
  product: null,
  purchasing: false,
  restoring: false,
  error: null,
  requestPurchase: async () => {},
  restorePurchases: async () => {},
  clearError: () => {},
};

export function useIAPConnection(onPurchaseSuccess: () => void): IAPState {
  // Conditional hook call, deliberately. IS_SCHOOL_EDITION is fixed for the
  // whole process — it is read once at module scope from a global the entry
  // file set before any app module loaded — so the branch cannot change
  // between renders and hook order is invariant. The alternative is calling
  // react-native-iap's hook in a build that has no IAP context (GameShell
  // skips withIAPContext for the School Edition), which would throw.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return IS_SCHOOL_EDITION ? INERT_IAP : useConsumerIAPConnection(onPurchaseSuccess);
}

function useConsumerIAPConnection(
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
      if (purchase.productId !== PREMIUM_PRODUCT_ID) return;

      // Google Play reports a purchase the parent still has to complete —
      // cash, carrier billing, or an approval request — as PENDING. No money
      // has moved, so no entitlement; but say so rather than leaving the
      // sheet spinning. iOS never sets the field: delivery there already
      // means purchased.
      const pending =
        purchase.purchaseStateAndroid === PurchaseStateAndroid.PENDING;

      try {
        if (!pending) {
          await finishTransaction({purchase, isConsumable: false});
        }
      } catch {
        // Acknowledging failed — Play service disconnected, offline, or the
        // purchase was already finished. The payment itself went through, so
        // the entitlement stands and Play replays the unacknowledged purchase
        // on the next launch for us to finish then.
        //
        // Before this catch existed, the rejection escaped and took both
        // setPurchasing(false) and the premium grant with it: the parent paid,
        // got nothing, and the upgrade sheet stayed disabled with a spinner
        // and no error for the rest of the session.
      } finally {
        setPurchasing(false);
        if (pending) {
          // A sentinel, not a sentence: UpgradeScreen maps it through t() at
          // render time, so it stays correct if the language changes while the
          // sheet is open — and matches the existing 'no_previous_purchase'
          // convention. Setting a rendered string here would be flattened to
          // the generic "Purchase failed" by getErrorMessage.
          setError('purchase_pending');
        } else {
          onPurchaseSuccess();
        }
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
