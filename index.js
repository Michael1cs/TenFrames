/**
 * @format
 */

import { AppRegistry, I18nManager } from 'react-native';
import { installErrorHandler } from './src/utils/installErrorHandler';
import App from './App';
import { name as appName } from './app.json';

// ── Lock the app to left-to-right ─────────────────────────────────────
// On a Hebrew/Arabic/Farsi device React Native auto-enables RTL, which
// mirrors every flexDirection:'row' layout. For this app that isn't just
// cosmetic — it reverses the ten-frame grid and the "3 + 2 = ?" math rows,
// i.e. it teaches the wrong thing. The app ships ro/en/de only, so RTL is
// never wanted.
//
// The authoritative fix is android:supportsRtl="false" in AndroidManifest.xml:
// I18nUtil.isRTL() short-circuits on that flag, so it applies on the very
// first launch with no restart. These calls persist the same intent in
// SharedPreferences (Android) / NSUserDefaults (iOS) as a second line of
// defence, and cover iOS should the app ever ship an RTL localization.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);
I18nManager.swapLeftAndRightInRTL(false);

installErrorHandler();

AppRegistry.registerComponent(appName, () => App);
