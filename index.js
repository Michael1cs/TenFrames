/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { setupFonts } from './src/utils/setupFonts';
import App from './App';
import { name as appName } from './app.json';

setupFonts();

AppRegistry.registerComponent(appName, () => App);
