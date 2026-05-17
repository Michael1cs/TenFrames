import React from 'react';
import {StyleSheet, View} from 'react-native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {
  AdventureProgress,
  ThemeColors,
  WorldId,
} from '../../types/game';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';
import {LevelPlayState} from '../../hooks/useAdventure';
import {AdventureWorldsScreen} from './AdventureWorldsScreen';
import {AdventureLevelsScreen} from './AdventureLevelsScreen';
import {AdventureLevelScreen} from './AdventureLevelScreen';

type AdventureStackParamList = {
  Worlds: undefined;
  Levels: {worldId: WorldId};
  Level: undefined;
};

const Stack = createNativeStackNavigator<AdventureStackParamList>();

interface AdventureFlowProps {
  visible: boolean;
  progress: AdventureProgress;
  selectedWorld: WorldId;
  colors: ThemeColors;
  isPremium: boolean;
  activeLevel: LevelPlayState | null;
  stars: number | null;
  isNewBest: boolean;
  hasNextLevel: boolean;
  // Bumped by parent on fresh-open so the stack resets to Worlds
  resetVersion: number;

  onSelectWorld: (worldId: WorldId) => void;
  onLevelPress: (levelId: string) => boolean;
  onRecordResult: (wasFirstTry: boolean) => void;
  onComplete: () => {stars: number; isNewBest: boolean};
  onNextLevel: () => void;
  onReplay: () => void;
  onExitLevel: () => void;
  onClose: () => void;
}

// Worlds route — pure UI, gets everything from outer props via React context
const AdventureCtx = React.createContext<AdventureFlowProps | null>(null);

function WorldsRoute() {
  const ctx = React.useContext(AdventureCtx)!;
  const navigation =
    useNavigation<NativeStackNavigationProp<AdventureStackParamList>>();
  return (
    <AdventureWorldsScreen
      progress={ctx.progress}
      onSelectWorld={worldId => {
        ctx.onSelectWorld(worldId);
        navigation.push('Levels', {worldId});
      }}
      onClose={ctx.onClose}
    />
  );
}

function LevelsRoute({
  route,
}: {
  route: {params: {worldId: WorldId}};
}) {
  const ctx = React.useContext(AdventureCtx)!;
  const navigation =
    useNavigation<NativeStackNavigationProp<AdventureStackParamList>>();
  return (
    <AdventureLevelsScreen
      worldId={route.params.worldId}
      progress={ctx.progress}
      fallbackColors={ctx.colors}
      onLevelPress={levelId => {
        if (ctx.onLevelPress(levelId)) navigation.push('Level');
      }}
      onBack={() => navigation.goBack()}
      onClose={ctx.onClose}
    />
  );
}

function LevelRoute() {
  const ctx = React.useContext(AdventureCtx)!;
  const navigation =
    useNavigation<NativeStackNavigationProp<AdventureStackParamList>>();
  if (!ctx.activeLevel) return null;
  return (
    <AdventureLevelScreen
      key={
        ctx.activeLevel.level.id + '-' + ctx.activeLevel.level.order
      }
      levelState={ctx.activeLevel}
      colors={ctx.colors}
      stars={ctx.stars}
      isNewBest={ctx.isNewBest}
      hasNextLevel={ctx.hasNextLevel}
      onRecordResult={ctx.onRecordResult}
      onComplete={ctx.onComplete}
      onNextLevel={ctx.onNextLevel}
      onReplay={ctx.onReplay}
      onBackToMap={() => {
        ctx.onExitLevel();
        navigation.goBack();
      }}
    />
  );
}

export function AdventureFlow(props: AdventureFlowProps) {
  if (!props.visible) return null;
  // Remount the entire navigator when resetVersion bumps. This guarantees a
  // fresh stack starting at Worlds; far simpler than imperatively resetting
  // via a NavigationContainerRef (and dodges Modal/nested-navigator quirks).
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <AdventureCtx.Provider value={props}>
        <Stack.Navigator
          key={props.resetVersion}
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="Worlds" component={WorldsRoute} />
          <Stack.Screen name="Levels" component={LevelsRoute} />
          <Stack.Screen name="Level" component={LevelRoute} />
        </Stack.Navigator>
      </AdventureCtx.Provider>
    </View>
  );
}
