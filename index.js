/**
 * @format
 */

import { AppRegistry, I18nManager } from 'react-native';
import { installFredoka } from './src/utils/installFredoka';
import App from './App';
import { name as appName } from './app.json';

// Force LTR globally — supported languages (ro/en/de) are all LTR, and
// system-locale-driven RTL on Hebrew/Arabic Android devices crashes
// Reanimated 4 transforms on the New Architecture. Reported via Google
// Play review (Sterny, 8 Jun 2026, S20 FE 5G + Hebrew + Android 13).
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

installFredoka();

AppRegistry.registerComponent(appName, () => App);
