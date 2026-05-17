import 'react-native-gesture-handler';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {GameShell} from './src/components/layout/GameShell';
import './src/i18n';

function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <GameShell />
    </GestureHandlerRootView>
  );
}

export default App;
