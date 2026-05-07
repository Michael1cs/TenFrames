/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { installFredoka } from './src/utils/installFredoka';
import App from './App';
import { name as appName } from './app.json';

installFredoka();

AppRegistry.registerComponent(appName, () => App);
