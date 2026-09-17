/**
 * Native-module mocks so component tests can load the full App tree.
 *
 * AsyncStorage v3 (the KMP build) no longer ships its jest mock, so we keep a
 * small in-memory implementation here with the same async surface.
 */
const mockAsyncStore = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async key =>
      mockAsyncStore.has(key) ? mockAsyncStore.get(key) : null,
    ),
    setItem: jest.fn(async (key, value) => {
      mockAsyncStore.set(key, value);
    }),
    removeItem: jest.fn(async key => {
      mockAsyncStore.delete(key);
    }),
    mergeItem: jest.fn(async (key, value) => {
      mockAsyncStore.set(key, value);
    }),
    clear: jest.fn(async () => {
      mockAsyncStore.clear();
    }),
    getAllKeys: jest.fn(async () => [...mockAsyncStore.keys()]),
    multiGet: jest.fn(async keys =>
      keys.map(key => [key, mockAsyncStore.get(key) ?? null]),
    ),
    multiSet: jest.fn(async pairs => {
      pairs.forEach(([key, value]) => mockAsyncStore.set(key, value));
    }),
    multiRemove: jest.fn(async keys => {
      keys.forEach(key => mockAsyncStore.delete(key));
    }),
  },
}));

jest.mock('react-native-localize', () =>
  require('react-native-localize/mock'),
);

// Worklets needs a real native runtime; its mock must be in place BEFORE
// reanimated loads (even reanimated's own mock imports it).
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('react-native-sound', () => {
  class MockSound {
    constructor(_file, _basePath, onLoad) {
      if (onLoad) setTimeout(() => onLoad(null), 0);
    }
    play(onEnd) {
      if (onEnd) setTimeout(() => onEnd(true), 0);
    }
    stop(cb) {
      if (cb) cb();
    }
    pause() {}
    release() {}
    setVolume() {}
    setCurrentTime() {}
    setNumberOfLoops() {}
    setSpeed() {}
    getDuration() {
      return 0;
    }
    isLoaded() {
      return true;
    }
    isPlaying() {
      return false;
    }
  }
  MockSound.setCategory = jest.fn();
  MockSound.MAIN_BUNDLE = '';
  return MockSound;
});

// react-native-iap 15 (NitroIap). The previous mock imitated the removed
// v12 API (getProducts, currentPurchase, withIAPContext), so nothing the app
// actually calls was covered and any error path threw on ErrorCode. Tests
// drive the store through global.mockIap: flip `connected`, seed
// `availablePurchases`, make `finishTransaction` reject, and call the
// callbacks the hook registered via `lastOptions`.
const mockIap = {
  connected: true,
  products: [{id: 'com.tenframes.premium_unlock', displayPrice: '4,99 €'}],
  availablePurchases: [],
  lastOptions: null,
  fetchProducts: jest.fn(async () => {}),
  finishTransaction: jest.fn(async () => {}),
  requestPurchase: jest.fn(async () => {}),
  reset() {
    this.connected = true;
    this.availablePurchases = [];
    this.lastOptions = null;
    this.fetchProducts.mockReset().mockImplementation(async () => {});
    this.finishTransaction.mockReset().mockImplementation(async () => {});
    this.requestPurchase.mockReset().mockImplementation(async () => {});
  },
};
global.mockIap = mockIap;

jest.mock('react-native-iap', () => ({
  useIAP: jest.fn(options => {
    mockIap.lastOptions = options;
    return {
      connected: mockIap.connected,
      products: mockIap.products,
      fetchProducts: mockIap.fetchProducts,
      finishTransaction: mockIap.finishTransaction,
      requestPurchase: mockIap.requestPurchase,
    };
  }),
  getAvailablePurchases: jest.fn(async () => mockIap.availablePurchases),
  ErrorCode: {
    UserCancelled: 'user-cancelled',
    DeferredPayment: 'deferred-payment',
    Unknown: 'unknown',
  },
}));

// Haptics are a no-op under test; the enum is mirrored so useSound's map
// builds without the native module.
jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: {trigger: jest.fn()},
  HapticFeedbackTypes: {
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
    selection: 'selection',
  },
}));

// Without this the provider never receives insets in tests and renders
// nothing, so mounting <App /> produced an empty tree — which is how a
// premium-wipe bug lived behind a green suite.
jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});
