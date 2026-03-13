import React from 'react';
import {StatusBar} from 'react-native';
import {GameShell} from './src/components/layout/GameShell';
import './src/i18n';

function App() {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <GameShell />
    </>
  );
}

export default App;
