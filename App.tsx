import 'react-native-gesture-handler';
import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {GameShell} from './src/components/layout/GameShell';
import './src/i18n';

function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <GameShell />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
