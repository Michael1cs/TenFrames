import 'react-native-gesture-handler';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ErrorBoundary} from './src/components/common/ErrorBoundary';
import {GameShell} from './src/components/layout/GameShell';
import './src/i18n';

function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      {/* Nothing in the app read safe-area insets until 1.7.0. The floating
          feedback sheet is anchored to the window bottom, which on Android
          is behind the navigation bar, so the provider has to exist. */}
      <SafeAreaProvider>
        <ErrorBoundary>
          <GameShell />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
