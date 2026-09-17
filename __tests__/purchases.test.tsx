/**
 * Money paths. A parent who pays must get premium — through every door the
 * store can deliver it — and a child must never be granted it for free.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {useIAPConnection} from '../src/hooks/useIAP';
import {usePremium} from '../src/hooks/usePremium';

declare const global: {mockIap: any; __DEV__: boolean};
const PREMIUM = 'com.tenframes.premium_unlock';

type Iap = ReturnType<typeof useIAPConnection>;

function renderIap() {
  const onSuccess = jest.fn();
  const ref: {current: Iap | null} = {current: null};
  function Probe() {
    ref.current = useIAPConnection(onSuccess);
    return null;
  }
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });
  return {iap: () => ref.current!, onSuccess};
}

const flush = () =>
  ReactTestRenderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

beforeEach(() => global.mockIap.reset());

describe('a purchase arriving from the store', () => {
  it('grants premium and finishes the transaction', async () => {
    const {onSuccess} = renderIap();
    await ReactTestRenderer.act(async () => {
      await global.mockIap.lastOptions.onPurchaseSuccess({productId: PREMIUM, purchaseState: 'purchased'});
    });
    expect(global.mockIap.finishTransaction).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('still grants premium when acknowledging fails (the payment went through)', async () => {
    global.mockIap.finishTransaction.mockImplementation(async () => {
      throw new Error('store disconnected');
    });
    const {iap, onSuccess} = renderIap();
    await ReactTestRenderer.act(async () => {
      await global.mockIap.lastOptions.onPurchaseSuccess({productId: PREMIUM, purchaseState: 'purchased'});
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(iap().purchasing).toBe(false);
  });

  it('does not grant a pending purchase, and says it is pending', async () => {
    const {iap, onSuccess} = renderIap();
    await ReactTestRenderer.act(async () => {
      await global.mockIap.lastOptions.onPurchaseSuccess({productId: PREMIUM, purchaseState: 'pending'});
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(global.mockIap.finishTransaction).not.toHaveBeenCalled();
    expect(iap().error).toBe('purchase_pending');
  });

  it('ignores a product that is not the premium unlock', async () => {
    const {onSuccess} = renderIap();
    await ReactTestRenderer.act(async () => {
      await global.mockIap.lastOptions.onPurchaseSuccess({productId: 'something.else', purchaseState: 'purchased'});
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe('purchase errors', () => {
  it('treats "Ask to Buy" as pending, not failed', () => {
    const {iap} = renderIap();
    ReactTestRenderer.act(() => {
      global.mockIap.lastOptions.onPurchaseError({code: 'deferred-payment', message: 'deferred'});
    });
    expect(iap().error).toBe('purchase_pending');
  });

  it('stays quiet when the parent cancels', () => {
    const {iap} = renderIap();
    ReactTestRenderer.act(() => {
      global.mockIap.lastOptions.onPurchaseError({code: 'user-cancelled', message: 'cancelled'});
    });
    expect(iap().error).toBeNull();
  });
});

describe('restore', () => {
  it('grants premium when the store has a finished purchase', async () => {
    global.mockIap.availablePurchases = [{productId: PREMIUM, purchaseState: 'purchased'}];
    const {iap, onSuccess} = renderIap();
    await flush(); // the silent re-check on connect already grants it
    expect(onSuccess).toHaveBeenCalled();
    onSuccess.mockClear();
    await ReactTestRenderer.act(async () => {
      await iap().restorePurchases();
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('reports nothing to restore', async () => {
    const {iap, onSuccess} = renderIap();
    await ReactTestRenderer.act(async () => {
      await iap().restorePurchases();
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(iap().error).toBe('no_previous_purchase');
  });

  it('does not restore a purchase that is only pending', async () => {
    global.mockIap.availablePurchases = [{productId: PREMIUM, purchaseState: 'pending'}];
    const {iap, onSuccess} = renderIap();
    await flush();
    await ReactTestRenderer.act(async () => {
      await iap().restorePurchases();
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(iap().error).toBe('no_previous_purchase');
  });
});

describe('entitlement re-check on connect', () => {
  it('grants a purchase this device did not know about, silently', async () => {
    global.mockIap.availablePurchases = [{productId: PREMIUM, purchaseState: 'purchased'}];
    const {iap, onSuccess} = renderIap();
    await flush();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(iap().error).toBeNull();
  });

  it('shows nothing when the store cannot be reached', async () => {
    const iapModule = require('react-native-iap');
    iapModule.getAvailablePurchases.mockImplementationOnce(async () => {
      throw new Error('offline');
    });
    const {iap, onSuccess} = renderIap();
    await flush();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(iap().error).toBeNull();
  });
});

describe('the free daily limit', () => {
  type Premium = ReturnType<typeof usePremium>;
  function renderPremium() {
    const ref: {current: Premium | null} = {current: null};
    function Probe() {
      ref.current = usePremium();
      return null;
    }
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });
    return () => ref.current!;
  }

  beforeEach(() => {
    global.__DEV__ = false; // usePremium starts premium in development
  });
  afterEach(() => {
    global.__DEV__ = true;
  });

  it('closes a limited mode after five exercises, and only that mode', () => {
    const premium = renderPremium();
    expect(premium().isPremium).toBe(false);
    for (let i = 0; i < 5; i++) {
      ReactTestRenderer.act(() => {
        premium().recordExercise('addition');
      });
    }
    expect(premium().getRemainingExercises('addition')).toBe(0);
    expect(premium().canPlayMode('addition')).toBe(false);
    expect(premium().canPlayMode('subtraction')).toBe(true);
    expect(premium().canPlayMode('counting')).toBe(true);
  });

  it('never limits a premium player', () => {
    const premium = renderPremium();
    ReactTestRenderer.act(() => premium().upgradeToPremium());
    for (let i = 0; i < 20; i++) {
      ReactTestRenderer.act(() => {
        premium().recordExercise('addition');
      });
    }
    expect(premium().canPlayMode('addition')).toBe(true);
  });

  it("starts a fresh count on a new day", () => {
    const premium = renderPremium();
    ReactTestRenderer.act(() => {
      premium().loadPremiumData({
        isPremium: false,
        dailyUsage: {date: '2000-01-01', counts: {addition: 5}},
      });
    });
    expect(premium().canPlayMode('addition')).toBe(true);
  });
});
