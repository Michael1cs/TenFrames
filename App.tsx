import 'react-native-gesture-handler';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {ErrorBoundary} from './src/components/common/ErrorBoundary';
import {GameShell} from './src/components/layout/GameShell';
import './src/i18n';

function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ErrorBoundary>
        <GameShell />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default App;
