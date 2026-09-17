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
 * the store at all. Hiding the purchase UI is not enough: the hook below opens
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

function isPremium(purchase: Purchase): boolean {
  return purchase.productId === PREMIUM_PRODUCT_ID;
}

/**
 * A purchase the parent still has to complete — cash, carrier billing, or an
 * approval request — arrives as 'pending'. No money has moved, so no
 * entitlement. Only 'pending' blocks the grant: 'unknown' is treated as
 * delivered, because on iOS delivery already means purchased and refusing
 * anything that is not literally 'purchased' would strand paying customers.
 */
function isPending(purchase: Purchase): boolean {
  return purchase.purchaseState === 'pending';
}

export function useIAPConnection(onPurchaseSuccess: () => void): IAPState {
  // Conditional hook call, deliberately. IS_SCHOOL_EDITION is fixed for the
  // whole process — it is read once at module scope from a global the entry
  // file set before any app module loaded — so the branch cannot change
  // between renders and hook order is invariant. Since react-native-iap 15.x
  // there is no withIAPContext to skip at the root, so this is the only place
  // left that can keep the school build away from the store.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return IS_SCHOOL_EDITION ? INERT_IAP : useConsumerIAPConnection(onPurchaseSuccess);
}

function useConsumerIAPConnection(onPurchaseSuccess: () => void): IAPState {
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
      if (!isPremium(purchase)) {
        return;
      }

      const pending = isPending(purchase);

      try {
        if (!pending) {
          // Acknowledge it — Google auto-refunds an unacknowledged purchase
          // after three days.
          await finishTransaction({purchase, isConsumable: false});
        }
      } catch {
        // Acknowledging failed — store service disconnected, offline, or the
        // purchase was already finished. The payment itself went through, so
        // the entitlement stands and the store replays the unacknowledged
        // purchase on the next launch for us to finish then.
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
    onPurchaseError: (err: PurchaseError) => {
      setPurchasing(false);
      if (err.code === ErrorCode.UserCancelled) {
        return;
      }
      // "Ask to Buy": the child's request went to the family organiser and is
      // waiting for their approval. Nothing failed, so it must not say
      // "Purchase failed. Please try again" — a parent who tried again would
      // send a second request. Same sentinel as the pending purchase above.
      if (err.code === ErrorCode.DeferredPayment) {
        setError('purchase_pending');
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
      const hasPremium = purchases.some(
        (p: Purchase) => isPremium(p) && !isPending(p),
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

  // Silently re-check entitlement once the store connects. A purchase can
  // exist that this device does not know about — the family restored a
  // backup, reinstalled, or "Ask to Buy" was approved after the sheet was
  // closed — and a parent should never have to find the Restore button
  // behind a maths gate to get back what they paid for. Nothing is shown on
  // failure: an unreachable store must not put an error in front of a child.
  const [entitlementChecked, setEntitlementChecked] = useState(false);
  useEffect(() => {
    if (!connected || entitlementChecked) return;
    setEntitlementChecked(true);
    (async () => {
      try {
        const purchases = await iapGetAvailablePurchases();
        if (purchases.some((p: Purchase) => isPremium(p) && !isPending(p))) {
          onPurchaseSuccess();
        }
      } catch {
        // Offline or store unavailable: keep whatever is stored locally.
      }
    })();
  }, [connected, entitlementChecked, onPurchaseSuccess]);

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
