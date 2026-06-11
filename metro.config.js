const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const escape = require('escape-string-regexp');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// Native build artifacts in node_modules AND in the Android project churn
// during Gradle native compilation (CMake creates + deletes scratch dirs
// under .cxx, Gradle rewrites build/classes/, etc.). Metro's FallbackWatcher
// crashes with ENOENT when one disappears mid-watch. Exclude every `build`,
// `.cxx`, and `.gradle` dir anywhere under the project — none ships JS.
const projectRoot = escape(__dirname);
const blockedNativeBuildDirs = new RegExp(
  '^' +
    projectRoot +
    String.raw`[\\/].*[\\/](?:\.cxx|\.gradle|build)([\\/]|$).*`,
);

const config = {
  resolver: {
    blockList: blockedNativeBuildDirs,
  },
  watcher: {
    additionalExts: [],
    healthCheck: {enabled: false},
    watchman: {deferStates: []},
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
