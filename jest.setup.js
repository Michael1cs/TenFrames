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

jest.mock('react-native-iap', () => ({
  useIAP: jest.fn(() => ({
    connected: false,
    products: [],
    getProducts: jest.fn(async () => []),
    currentPurchase: null,
    currentPurchaseError: null,
    finishTransaction: jest.fn(async () => {}),
    requestPurchase: jest.fn(async () => {}),
    getAvailablePurchases: jest.fn(async () => []),
    availablePurchases: [],
  })),
  withIAPContext: component => component,
  getAvailablePurchases: jest.fn(async () => []),
  PurchaseStateAndroid: {PENDING: 2, PURCHASED: 1, UNSPECIFIED: 0},
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
