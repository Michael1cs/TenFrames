module.exports = {
  preset: 'react-native',
  setupFiles: ['react-native-gesture-handler/jestSetup', './jest.setup.js'],
  // linear-gradient v3 (and friends) ship untranspiled ESM — let Babel at them.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-.*|@react-navigation/.*)/)',
  ],
};
