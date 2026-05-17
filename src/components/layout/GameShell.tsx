import React, {useEffect, useCallback, useState, useRef, useMemo, useContext} from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, ScrollView, ImageBackground} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  NavigationContainer,
  NavigationContainerRefWithCurrent,
  useNavigation,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {useGameState} from '../../hooks/useGameState';
import {useTheme} from '../../hooks/useTheme';
import {useLayout} from '../../hooks/useLayout';
import {usePersistence} from '../../hooks/usePersistence';
import {useRewards} from '../../hooks/useRewards';
import {Emoji} from '../common/Emoji';
import {ModeSelector} from './ModeSelector';
import {BackgroundEmojis} from './BackgroundEmojis';
import {CountingMode} from '../game/CountingMode';
import {AdditionMode} from '../game/AdditionMode';
import {SubtractionMode} from '../game/SubtractionMode';
import {PuzzleMode} from '../game/PuzzleMode';
import {WorkshopMode} from '../game/WorkshopMode';
import {FarmShareMode} from '../game/FarmShareMode';
import {CorrectAnimation} from '../feedback/CorrectAnimation';
import {WrongAnimation} from '../feedback/WrongAnimation';
import {WrongFlash} from '../feedback/WrongFlash';
import {StarsDisplay} from '../feedback/StarsDisplay';
import {MilestoneAnimation} from '../feedback/MilestoneAnimation';
import {NewStickerPopup} from '../feedback/NewStickerPopup';
import {AchievementPopup} from '../feedback/AchievementPopup';
import {StickerBook} from '../rewards/StickerBook';
import {AchievementsScreen} from '../rewards/AchievementsScreen';
import {DailyLimitModal} from '../premium/DailyLimitModal';
import {UpgradeScreen} from '../premium/UpgradeScreen';
import {PlayerSetup} from '../onboarding/PlayerSetup';
import {ModeChoice} from '../onboarding/ModeChoice';
import {AboutTenFrames} from '../info/AboutTenFrames';
import {ParentDashboard} from '../info/ParentDashboard';
import {SettingsModal} from '../info/SettingsModal';
import {usePremium} from '../../hooks/usePremium';
import {useSound} from '../../hooks/useSound';
import {useVoice, VOICE_GROUPS, setVoiceEnabled} from '../../hooks/useVoice';
import {useAgeProfile} from '../../hooks/useAgeProfile';
import {useIAPConnection, withIAPContext} from '../../hooks/useIAP';
import {FREE_DAILY_LIMIT} from '../../config/limits';
import {Language, GameMode, WorldId} from '../../types/game';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';
import {useAdventure} from '../../hooks/useAdventure';
import {AdventureWorldsScreen} from '../adventure/AdventureWorldsScreen';
import {AdventureLevelsScreen} from '../adventure/AdventureLevelsScreen';
import {AdventureLevelScreen} from '../adventure/AdventureLevelScreen';
import i18n from '../../i18n';

type RootStackParamList = {
  Home: undefined;
  FreePlay: undefined;
  AdventureWorlds: undefined;
  AdventureLevels: {worldId: WorldId};
  AdventureLevel: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// All of GameShell's state + handlers piped through a single context so the
// stack's screen components can read them without prop-drilling. The screen
// components are defined at module level so Stack.Navigator references stay
// stable across GameShellInner re-renders (no remount-on-render churn).
type ShellCtxValue = ReturnType<typeof useShellState>;
const ShellCtx = React.createContext<ShellCtxValue | null>(null);
const useShell = () => {
  const v = useContext(ShellCtx);
  if (!v) throw new Error('ShellCtx missing');
  return v;
};

function HomeScreen() {
  const ctx = useShell();
  const navigation = useNavigation<NavProp>();
  return (
    <ModeChoice
      language={ctx.game.language}
      onLanguageChange={ctx.handleLanguageChange}
      onAdventure={() => {
        ctx.savePlayerData({lastMode: 'adventure'});
        navigation.navigate('AdventureWorlds');
      }}
      onFreeplay={() => {
        ctx.savePlayerData({lastMode: 'freeplay'});
        if (!ctx.game.playerName) ctx.game.setShowSetup(true);
        navigation.navigate('FreePlay');
      }}
      homeBar={{
        onDashboard: () => ctx.setShowParentDash(true),
        onSettings: () => ctx.setShowSettings(true),
      }}
    />
  );
}

function FreePlayScreen() {
  const ctx = useShell();
  return <FreePlayContent ctx={ctx} />;
}

function AdventureWorldsRoute() {
  const ctx = useShell();
  const navigation = useNavigation<NavProp>();
  return (
    <AdventureWorldsScreen
      progress={ctx.adventure.progress}
      onSelectWorld={worldId => {
        ctx.adventure.setSelectedWorld(worldId);
        navigation.navigate('AdventureLevels', {worldId});
      }}
      onClose={() => navigation.popToTop()}
    />
  );
}

function AdventureLevelsRoute({
  route,
}: {
  route: {params: {worldId: WorldId}};
}) {
  const ctx = useShell();
  const navigation = useNavigation<NavProp>();
  return (
    <AdventureLevelsScreen
      worldId={route.params.worldId}
      progress={ctx.adventure.progress}
      fallbackColors={ctx.colors}
      onLevelPress={levelId => {
        if (ctx.handleAdventureLevelPress(levelId)) {
          navigation.navigate('AdventureLevel');
        }
      }}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.popToTop()}
    />
  );
}

function AdventureLevelRoute() {
  const ctx = useShell();
  const navigation = useNavigation<NavProp>();
  if (!ctx.adventure.activeLevel) return null;
  return (
    <AdventureLevelScreen
      key={
        ctx.adventure.activeLevel.level.id +
        '-' +
        ctx.adventure.activeLevel.level.order
      }
      levelState={ctx.adventure.activeLevel}
      colors={ctx.colors}
      stars={ctx.adventureStars}
      isNewBest={ctx.adventureIsNewBest}
      hasNextLevel={
        !!ctx.adventure.getNextPlayableLevel(ctx.adventure.selectedWorld)
      }
      onRecordResult={ctx.adventure.recordProblemResult}
      onComplete={ctx.handleAdventureLevelComplete}
      onNextLevel={ctx.handleAdventureNextLevel}
      onReplay={ctx.handleAdventureReplay}
      onBackToMap={() => {
        ctx.handleAdventureExitLevel();
        navigation.goBack();
      }}
    />
  );
}

// ── The big free-play UI, extracted here so the FreePlay route can render
// the existing GameShell content without restructuring the JSX.
function FreePlayContent({ctx}: {ctx: ShellCtxValue}) {
  const {t} = useTranslation();
  const {
    game,
    colors,
    themeConfig,
    isLandscape,
    ageProfile,
    premium,
    rewardSystem,
    iap,
    handleCellClick,
    handleModeChange,
    handleAdventurePress,
    lastStarsAwarded,
    showStarsDisplay,
    setShowAbout,
    setShowUpgrade,
    setShowStickerBook,
    setShowParentDash,
    mascotEmoji,
  } = ctx;

  // Mode renderer (originally renderGameMode in GameShell)
  const renderGameMode = () => {
    switch (game.gameMode) {
      case 'counting':
        return (
          <CountingMode
            cells={game.cells}
            onCellClick={handleCellClick}
            onReset={game.resetGame}
            filledCount={game.filledCount}
            colors={colors}
            emoji={themeConfig.emoji}
            tokenImage={themeConfig.tokenImage}
            ageGroup={game.ageGroup}
            ageProfile={ageProfile}
            onCelebrate={() => ctx.playSound('star')}
          />
        );
      case 'addition':
        return (
          <AdditionMode
            cells={game.cells}
            onCellClick={handleCellClick}
            onSubmit={game.handleSubmit}
            onReset={game.resetGame}
            currentProblem={game.currentProblem}
            userAnswer={game.userAnswer}
            isCorrect={game.isCorrect}
            hasSubmitted={game.hasSubmitted}
            feedback={game.feedback}
            colors={colors}
            emoji={themeConfig.emoji}
            tokenImage={themeConfig.tokenImage}
            level={game.additionLevel}
            ageGroup={game.ageGroup}
            ageProfile={ageProfile}
          />
        );
      case 'subtraction':
        return (
          <SubtractionMode
            cells={game.cells}
            onCellClick={handleCellClick}
            onSubmit={game.handleSubmit}
            onReset={game.resetGame}
            currentProblem={game.currentProblem}
            userAnswer={game.userAnswer}
            isCorrect={game.isCorrect}
            hasSubmitted={game.hasSubmitted}
            feedback={game.feedback}
            colors={colors}
            emoji={themeConfig.emoji}
            tokenImage={themeConfig.tokenImage}
            level={game.subtractionLevel}
            ageGroup={game.ageGroup}
            ageProfile={ageProfile}
          />
        );
      case 'puzzle':
        return (
          <PuzzleMode
            cells={game.cells}
            onCellClick={handleCellClick}
            onSubmit={game.handlePuzzleSubmit}
            onNewPuzzle={game.newPuzzle}
            puzzleAnswer={game.puzzleAnswer}
            filledCount={game.filledCount}
            showPuzzleAnswer={game.showPuzzleAnswer}
            colors={colors}
            emoji={themeConfig.emoji}
            tokenImage={themeConfig.tokenImage}
          />
        );
      case 'workshop':
        return (
          <WorkshopMode
            paletteEmojis={themeConfig.backgroundEmojis}
            colors={colors}
            ageGroup={game.ageGroup}
          />
        );
      case 'share':
        return (
          <FarmShareMode
            problem={game.shareProblem}
            foodEmoji="🥕"
            animalEmoji="🐰"
            colors={colors}
            ageGroup={game.ageGroup}
            onMatch={() => {
              ctx.playSound('correct');
              ctx.voice.playRandom(VOICE_GROUPS.correct);
              setTimeout(() => game.newShareProblem(), 1200);
            }}
            onUnfair={() => ctx.voice.play('share_unfair')}
          />
        );
    }
  };

  const renderTitleBar = () => (
    <View style={styles.titleBar}>
      <View style={styles.titleLeft}>
        <Text style={[styles.title, {color: colors.text}]}>
          <Emoji>{mascotEmoji}</Emoji> Ten Frames
        </Text>
        <Text style={[styles.subtitle, {color: colors.accent}]}>
          {t('app.title')}
        </Text>
      </View>
      <View style={styles.titleRight}>
        <Pressable
          onPress={() => setShowAbout(true)}
          style={styles.infoButton}>
          <Text style={styles.infoButtonText}><Emoji>ℹ️</Emoji></Text>
        </Pressable>
        {!premium.isPremium && (
          <Pressable
            onPress={() => setShowUpgrade(true)}
            style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}><Emoji>👑</Emoji></Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            game.setIsThemeChange(true);
            game.setShowSetup(true);
          }}
          style={[styles.themeButton, {backgroundColor: colors.accentButton}]}>
          <Text style={styles.themeButtonText}><Emoji>🎨</Emoji></Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStatsBar = () => (
    <View style={styles.statsBar}>
      <View style={[styles.statBadge, {borderColor: '#F59E0B'}]}>
        <Text style={[styles.statBadgeText, {color: colors.text}]}>
          <Emoji>⭐</Emoji> {rewardSystem.rewards.totalStars}
        </Text>
      </View>
      {game.streak > 0 && (
        <View style={[styles.statBadge, styles.streakBadge]}>
          <Text style={[styles.statBadgeText, {color: colors.text}]}>
            {game.streak} <Emoji>🔥</Emoji>
          </Text>
        </View>
      )}
      <Pressable
        onPress={() => setShowStickerBook(true)}
        style={[styles.statBadge, {borderColor: '#A855F7'}]}>
        <Text style={styles.statBadgeText}>
          <Emoji>🎨</Emoji> {rewardSystem.rewards.stickers.length}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setShowParentDash(true)}
        style={[styles.statBadge, {borderColor: '#EAB308'}]}>
        <Text style={styles.statBadgeText}>
          <Emoji>🏆</Emoji> {rewardSystem.rewards.achievements.length}
        </Text>
      </Pressable>
    </View>
  );

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {renderTitleBar()}
      {renderStatsBar()}
      <ModeSelector
        activeMode={game.gameMode}
        onModeChange={handleModeChange}
        colors={colors}
        vertical
        getRemainingExercises={premium.getRemainingExercises}
        isPremium={premium.isPremium}
        availableModes={ageProfile.availableModes}
      />
    </View>
  );

  return (
    <ImageBackground
      source={isLandscape ? themeConfig.backgroundLandscape : themeConfig.backgroundPortrait}
      style={styles.background}
      resizeMode="cover">
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.45)',
          'rgba(0,0,0,0.15)',
          'rgba(0,0,0,0.15)',
          'rgba(0,0,0,0.40)',
        ]}
        locations={[0, 0.25, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundEmojis emojis={themeConfig.backgroundEmojis} />
      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          <ScrollView
            style={styles.sidebarScroll}
            contentContainerStyle={styles.sidebarScrollContent}
            showsVerticalScrollIndicator={false}>
            {renderSidebar()}
          </ScrollView>
          <ScrollView
            style={styles.gameAreaLandscape}
            contentContainerStyle={styles.gameAreaLandscapeContent}
            showsVerticalScrollIndicator={false}>
            {renderGameMode()}
            <StarsDisplay stars={lastStarsAwarded} visible={showStarsDisplay} />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.portraitContainer}>
          {renderTitleBar()}
          {renderStatsBar()}
          <ScrollView
            style={styles.gameArea}
            contentContainerStyle={styles.gameAreaContent}
            showsVerticalScrollIndicator={false}>
            {renderGameMode()}
            <StarsDisplay stars={lastStarsAwarded} visible={showStarsDisplay} />
          </ScrollView>
          <ModeSelector
            activeMode={game.gameMode}
            onModeChange={handleModeChange}
            colors={colors}
            getRemainingExercises={premium.getRemainingExercises}
            isPremium={premium.isPremium}
            onAdventurePress={handleAdventurePress}
            availableModes={ageProfile.availableModes}
          />
        </View>
      )}
    </ImageBackground>
  );
}

// Heavy state + handlers, packaged for the context. Extracted so the
// ShellCtxValue type is automatically derived from the return type.
function useShellState(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
) {
  const {t: _t} = useTranslation(); // keep i18n active for any descendants
  const game = useGameState();
  const themeConfig = useTheme(game.theme);
  const {colors} = themeConfig;
  const {
    loadPlayerData, savePlayerData,
    loadRewardData, saveRewardData,
    loadPremiumData, savePremiumData,
  } = usePersistence();
  const {isLandscape, isTablet: _isTablet, fontScale: _fontScale} = useLayout(game.ageGroup);
  const rewardSystem = useRewards();
  const premium = usePremium();
  const {play: playSound} = useSound();
  const ageProfile = useAgeProfile(game.ageGroup);
  const voice = useVoice({enabled: voiceEnabled});

  const [showStickerBook, setShowStickerBook] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [lastStarsAwarded, setLastStarsAwarded] = useState(0);
  const [showStarsDisplay, setShowStarsDisplay] = useState(false);
  const [showDailyLimit, setShowDailyLimit] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParentDash, setShowParentDash] = useState(false);
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const [bootLoaded, setBootLoaded] = useState(false);
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>('Home');
  const [adventureStars, setAdventureStars] = useState<number | null>(null);
  const [adventureIsNewBest, setAdventureIsNewBest] = useState(false);
  const adventure = useAdventure();

  const handleIAPSuccess = useCallback(() => {
    premium.upgradeToPremium();
    setShowUpgrade(false);
    setShowDailyLimit(false);
  }, [premium]);

  const iap = useIAPConnection(handleIAPSuccess);

  // Track first-setup state for any future use; the boot effect references it.
  const isFirstSetupRef = useRef(true);

  // Load saved data on mount; decide the initial route.
  useEffect(() => {
    (async () => {
      const data = await loadPlayerData();
      let target: keyof RootStackParamList = 'Home';
      if (data.name) {
        game.setPlayerName(data.name);
        game.setTheme(data.theme);
        game.setLanguage(data.language);
        game.setAgeGroup(data.ageGroup);
        game.setShowSetup(false);
        i18n.changeLanguage(data.language);
        isFirstSetupRef.current = false;
        if (data.lastMode === 'adventure') target = 'AdventureWorlds';
        else if (data.lastMode === 'freeplay') target = 'FreePlay';
        // Brief acknowledgement on cold start for returning users — the mode
        // narration on Home does this for first-timers.
        setTimeout(() => voice.play('welcome'), 800);
      }
      // Voice on/off lives in PlayerData. Default true.
      const voiceOn = data.voiceEnabled !== false;
      setVoiceEnabledState(voiceOn);
      setVoiceEnabled(voiceOn);
      setInitialRoute(target);
      const rewards = await loadRewardData();
      rewardSystem.loadRewards(rewards);
      rewardSystem.updateDailyStreak();
      const premiumData = await loadPremiumData();
      premium.loadPremiumData(premiumData);
      setBootLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rewardSystem.rewards.totalStars > 0) {
      saveRewardData(rewardSystem.rewards);
    }
  }, [rewardSystem.rewards, saveRewardData]);

  useEffect(() => {
    if (game.score > 0) {
      savePlayerData({highScore: game.score, level: game.level});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.score, game.level]);

  useEffect(() => {
    savePremiumData(premium.getPremiumData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premium.dailyUsage, premium.isPremium]);

  // The queueing layer lives in useVoice now — every voice.play() goes
  // through a module-level FIFO so calls from different screens never
  // overlap. Local alias keeps the existing call sites readable.
  const queueVoice = useCallback((id: string) => voice.play(id), [voice]);

  // Reward voices + post-correct logic.
  const prevIsCorrect = useRef<boolean | null>(null);
  useEffect(() => {
    if (game.isCorrect === true && prevIsCorrect.current !== true) {
      playSound('correct');
      if (
        game.ageGroup === 'young' &&
        game.currentProblem &&
        (game.gameMode === 'addition' || game.gameMode === 'subtraction')
      ) {
        queueVoice(`post_great_${game.theme}_${game.currentProblem.answer}`);
      } else {
        const ids = VOICE_GROUPS.correct;
        queueVoice(ids[Math.floor(Math.random() * ids.length)]);
      }
      const wasFirstTry = game.streak > 0;
      const stars = rewardSystem.awardStars(game.gameMode, wasFirstTry);
      setLastStarsAwarded(stars);
      setShowStarsDisplay(true);
      setTimeout(() => {
        setShowStarsDisplay(false);
        playSound('star');
      }, 3000);
      const updatedUsage = premium.recordExercise(game.gameMode);
      if (!premium.isPremium && premium.isModeLimited(game.gameMode)) {
        const used = updatedUsage.counts[game.gameMode] || 0;
        if (used >= FREE_DAILY_LIMIT) {
          setTimeout(() => setShowDailyLimit(true), 2500);
        }
      }
    } else if (game.isCorrect === false && prevIsCorrect.current !== false) {
      playSound('wrong');
      // Route through the queue so this never overlaps the praise/reward
      // chain that fires when the child gets it right on the retry.
      const ids = VOICE_GROUPS.tryAgain;
      queueVoice(ids[Math.floor(Math.random() * ids.length)]);
    }
    prevIsCorrect.current = game.isCorrect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.isCorrect]);

  const prevFilledCount = useRef(game.filledCount);
  const lastProblemKey = useRef<string | null>(null);

  useEffect(() => {
    voice.stop(); // clears the module-level queue + stops in-flight clip
    lastProblemKey.current = null;
    prevFilledCount.current = game.filledCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameMode]);

  useEffect(() => {
    if (game.ageGroup !== 'young') {
      prevFilledCount.current = game.filledCount;
      return;
    }
    if (game.gameMode === 'counting' && game.filledCount !== prevFilledCount.current) {
      voice.play(`num_${game.filledCount}`);
    }
    prevFilledCount.current = game.filledCount;
  }, [game.filledCount, game.ageGroup, game.gameMode, voice]);

  useEffect(() => {
    if (game.gameMode !== 'addition' && game.gameMode !== 'subtraction') return;
    if (game.ageGroup !== 'young' || !game.currentProblem) return;
    const key = `${game.gameMode}-${game.currentProblem.num1}-${game.currentProblem.num2}`;
    if (key === lastProblemKey.current) return;
    lastProblemKey.current = key;
    const n1 = game.currentProblem.num1;
    const n2 = game.currentProblem.num2;
    const action = game.gameMode === 'addition' ? 'add' : 'sub';
    queueVoice(`pre_have_${game.theme}_${n1}`);
    queueVoice(`instr_${action}_${game.theme}_${n2}`);
  }, [game.currentProblem, game.gameMode, game.ageGroup, game.theme, queueVoice]);

  const prevStickerCount = useRef(0);
  useEffect(() => {
    if (rewardSystem.newStickers.length > prevStickerCount.current) {
      queueVoice('reward_sticker');
    }
    prevStickerCount.current = rewardSystem.newStickers.length;
  }, [rewardSystem.newStickers.length, queueVoice]);

  const prevAchievement = useRef<string | null>(null);
  useEffect(() => {
    if (rewardSystem.newAchievement && rewardSystem.newAchievement !== prevAchievement.current) {
      queueVoice('reward_achievement');
    }
    prevAchievement.current = rewardSystem.newAchievement;
  }, [rewardSystem.newAchievement, queueVoice]);

  const prevMilestone = useRef<string | null>(null);
  useEffect(() => {
    if (rewardSystem.showMilestone && rewardSystem.showMilestone !== prevMilestone.current) {
      const id = rewardSystem.showMilestone;
      if (id.includes('100')) queueVoice('reward_milestone_100');
      else if (id.includes('50')) queueVoice('reward_milestone_50');
      else if (id.includes('25')) queueVoice('reward_milestone_25');
      else queueVoice('reward_milestone_10');
    }
    prevMilestone.current = rewardSystem.showMilestone;
  }, [rewardSystem.showMilestone, queueVoice]);

  const prevAdventureStars = useRef<number | null>(null);
  useEffect(() => {
    if (adventureStars !== null && adventureStars !== prevAdventureStars.current) {
      if (adventureStars === 3) queueVoice('reward_level_perfect');
      else if (adventureStars === 2) queueVoice('reward_level_great');
      else if (adventureStars === 1) queueVoice('reward_level_good');
    }
    prevAdventureStars.current = adventureStars;
  }, [adventureStars, queueVoice]);

  const prevAddLevel = useRef(game.additionLevel);
  const prevSubLevel = useRef(game.subtractionLevel);
  useEffect(() => {
    if (game.additionLevel > prevAddLevel.current || game.subtractionLevel > prevSubLevel.current) {
      playSound('levelup');
    }
    prevAddLevel.current = game.additionLevel;
    prevSubLevel.current = game.subtractionLevel;
  }, [game.additionLevel, game.subtractionLevel, playSound]);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      game.setLanguage(lang);
      i18n.changeLanguage(lang);
      savePlayerData({language: lang});
    },
    [game, savePlayerData],
  );

  const handleToggleVoice = useCallback(
    (enabled: boolean) => {
      setVoiceEnabledState(enabled);
      setVoiceEnabled(enabled);
      savePlayerData({voiceEnabled: enabled});
    },
    [savePlayerData],
  );

  useEffect(() => {
    if (!ageProfile.availableModes.includes(game.gameMode)) {
      game.setGameMode('counting');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageProfile.availableModes, game.gameMode]);

  const handleCellClick = useCallback(
    (index: number) => {
      playSound('tap');
      game.handleCellClick(index);
    },
    [game, playSound],
  );

  const handleModeChange = useCallback(
    (mode: GameMode) => {
      if (!premium.canPlayMode(mode)) {
        setShowDailyLimit(true);
        return;
      }
      game.setGameMode(mode);
    },
    [game, premium],
  );

  const handleUpgrade = useCallback(() => {
    iap.requestPurchase();
  }, [iap]);

  const handleSetupComplete = useCallback(() => {
    game.setShowSetup(false);
    game.setIsThemeChange(false);
    isFirstSetupRef.current = false;
    savePlayerData({
      name: game.playerName,
      theme: game.theme,
      language: game.language,
      ageGroup: game.ageGroup,
    });
  }, [game, savePlayerData]);

  // Adventure entry from the in-game tab bar — jump into the Adventure stack.
  const handleAdventurePress = useCallback(() => {
    savePlayerData({lastMode: 'adventure'});
    navigationRef.current?.navigate('AdventureWorlds');
  }, [savePlayerData, navigationRef]);

  const handleAdventureLevelPress = useCallback(
    (levelId: string): boolean => {
      const world = ADVENTURE_WORLDS.find(
        w => w.id === adventure.selectedWorld,
      );
      const level = world?.levels.find(l => l.id === levelId);
      if (!level) return false;

      const freeLevels = world?.freeLevels ?? 2;
      const premiumLocked =
        (level.order > freeLevels && !level.isBonus && !premium.isPremium) ||
        (level.isBonus && !premium.isPremium);
      if (premiumLocked) {
        // Bounce out of the Adventure stack so the upgrade screen owns focus.
        navigationRef.current?.popToTop();
        setShowUpgrade(true);
        return false;
      }

      adventure.startLevel(level);
      setAdventureStars(null);
      setAdventureIsNewBest(false);
      return true;
    },
    [adventure, premium.isPremium, navigationRef],
  );

  const handleAdventureLevelComplete = useCallback(() => {
    const result = adventure.completeLevel();
    setAdventureStars(result.stars);
    setAdventureIsNewBest(result.isNewBest);
    if (adventure.activeLevel) {
      const {level, results} = adventure.activeLevel;
      for (const wasFirstTry of results) {
        rewardSystem.awardStars(level.gameMode, wasFirstTry);
      }
    }
    return result;
  }, [adventure, rewardSystem]);

  const handleAdventureNextLevel = useCallback(() => {
    const nextLevel = adventure.getNextPlayableLevel(adventure.selectedWorld);
    if (nextLevel) {
      adventure.startLevel(nextLevel);
      setAdventureStars(null);
      setAdventureIsNewBest(false);
    }
  }, [adventure]);

  const handleAdventureReplay = useCallback(() => {
    if (adventure.activeLevel) {
      adventure.startLevel(adventure.activeLevel.level);
      setAdventureStars(null);
      setAdventureIsNewBest(false);
    }
  }, [adventure]);

  const handleAdventureExitLevel = useCallback(() => {
    adventure.exitLevel();
    setAdventureStars(null);
  }, [adventure]);

  const mascotEmoji =
    game.mascotMood === 'happy'
      ? '😄'
      : game.mascotMood === 'excited'
      ? '🤗'
      : game.mascotMood === 'thinking'
      ? '🧐'
      : '🎊';

  return {
    game,
    themeConfig,
    colors,
    isLandscape,
    ageProfile,
    premium,
    rewardSystem,
    iap,
    voice,
    playSound,
    showStickerBook, setShowStickerBook,
    showAchievements, setShowAchievements,
    lastStarsAwarded,
    showStarsDisplay,
    showDailyLimit, setShowDailyLimit,
    showUpgrade, setShowUpgrade,
    showAbout, setShowAbout,
    showSettings, setShowSettings,
    showParentDash, setShowParentDash,
    voiceEnabled,
    handleToggleVoice,
    bootLoaded,
    initialRoute,
    adventure,
    adventureStars,
    adventureIsNewBest,
    handleLanguageChange,
    handleCellClick,
    handleModeChange,
    handleUpgrade,
    handleSetupComplete,
    handleAdventurePress,
    handleAdventureLevelPress,
    handleAdventureLevelComplete,
    handleAdventureNextLevel,
    handleAdventureReplay,
    handleAdventureExitLevel,
    mascotEmoji,
    savePlayerData,
  };
}

function GameShellInner() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const shell = useShellState(navigationRef);
  const {
    game,
    colors,
    rewardSystem,
    iap,
    bootLoaded,
    initialRoute,
    showStickerBook, setShowStickerBook,
    showAchievements, setShowAchievements,
    showDailyLimit, setShowDailyLimit,
    showUpgrade, setShowUpgrade,
    showAbout, setShowAbout,
    showSettings, setShowSettings,
    showParentDash, setShowParentDash,
    voiceEnabled,
    adventure,
    handleLanguageChange,
    handleUpgrade,
    handleSetupComplete,
    handleToggleVoice,
  } = shell;

  // Hold splash until persistence finishes — otherwise we can't pick the
  // correct initial route (Home vs FreePlay vs AdventureWorlds).
  if (!bootLoaded) {
    return (
      <View style={[styles.container, styles.adventureBackdrop]}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ShellCtx.Provider value={shell}>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="FreePlay" component={FreePlayScreen} />
            <Stack.Screen
              name="AdventureWorlds"
              component={AdventureWorldsRoute}
            />
            <Stack.Screen
              name="AdventureLevels"
              component={AdventureLevelsRoute}
            />
            <Stack.Screen
              name="AdventureLevel"
              component={AdventureLevelRoute}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ShellCtx.Provider>

      {/* Persistent global overlays — these sit OUTSIDE the stack so they
          float above whichever screen the user is on. */}
      <CorrectAnimation visible={game.showConfetti} />
      <WrongAnimation visible={game.isCorrect === false} />
      <WrongFlash visible={game.isCorrect === false} />
      <NewStickerPopup
        stickerIds={rewardSystem.newStickers}
        visible={rewardSystem.newStickers.length > 0}
      />
      <AchievementPopup
        achievementId={rewardSystem.newAchievement}
        visible={rewardSystem.newAchievement !== null}
      />
      <MilestoneAnimation
        visible={rewardSystem.showMilestone !== null}
        milestoneId={rewardSystem.showMilestone}
        onDismiss={rewardSystem.dismissMilestone}
      />

      <StickerBook
        visible={showStickerBook}
        unlockedStickers={rewardSystem.rewards.stickers}
        totalStars={rewardSystem.rewards.totalStars}
        colors={colors}
        onClose={() => setShowStickerBook(false)}
      />
      <AchievementsScreen
        visible={showAchievements}
        unlockedAchievements={rewardSystem.rewards.achievements}
        colors={colors}
        onClose={() => setShowAchievements(false)}
      />
      <DailyLimitModal
        visible={showDailyLimit}
        colors={colors}
        onDismiss={() => setShowDailyLimit(false)}
        onUpgrade={() => {
          setShowDailyLimit(false);
          setShowUpgrade(true);
        }}
      />
      <UpgradeScreen
        visible={showUpgrade}
        colors={colors}
        onClose={() => setShowUpgrade(false)}
        onPurchase={handleUpgrade}
        onRestore={iap.restorePurchases}
        product={iap.product}
        purchasing={iap.purchasing}
        restoring={iap.restoring}
        error={iap.error}
        onClearError={iap.clearError}
      />
      <AboutTenFrames
        visible={showAbout}
        colors={colors}
        language={game.language}
        onLanguageChange={handleLanguageChange}
        onClose={() => setShowAbout(false)}
      />
      <SettingsModal
        visible={showSettings}
        voiceEnabled={voiceEnabled}
        isPremium={shell.premium.isPremium}
        onToggleVoice={handleToggleVoice}
        onUpgrade={() => {
          setShowSettings(false);
          setTimeout(() => setShowUpgrade(true), 200);
        }}
        onOpenAbout={() => setShowAbout(true)}
        onClose={() => setShowSettings(false)}
      />
      <ParentDashboard
        visible={showParentDash}
        colors={colors}
        rewards={rewardSystem.rewards}
        adventure={adventure.progress}
        playerName={game.playerName}
        isPremium={shell.premium.isPremium}
        onClose={() => setShowParentDash(false)}
        onUpgrade={() => setShowUpgrade(true)}
      />
      <PlayerSetup
        visible={game.showSetup}
        playerName={game.playerName}
        onNameChange={game.setPlayerName}
        theme={game.theme}
        onThemeChange={game.setTheme}
        language={game.language}
        onLanguageChange={handleLanguageChange}
        ageGroup={game.ageGroup}
        onAgeGroupChange={game.setAgeGroup}
        onComplete={handleSetupComplete}
        isThemeChange={game.isThemeChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  background: {flex: 1},
  adventureBackdrop: {flex: 1, backgroundColor: '#1E1B4B'},

  portraitContainer: {flex: 1, paddingTop: 36, zIndex: 10},
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  titleLeft: {flexShrink: 1},
  title: {fontSize: 17, fontWeight: '800'},
  subtitle: {fontSize: 12, fontWeight: '600', opacity: 0.85},
  titleRight: {flexDirection: 'row', alignItems: 'center', gap: 6},
  infoButton: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  infoButtonText: {fontSize: 16},
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    gap: 6,
  },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakBadge: {
    backgroundColor: 'rgba(245,158,11,0.3)',
    borderColor: '#F59E0B',
  },
  statBadgeText: {fontSize: 15, fontWeight: '700', color: '#FFFFFF'},
  premiumButton: {
    backgroundColor: 'rgba(245,158,11,0.3)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  premiumButtonText: {fontSize: 16},
  themeButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  themeButtonText: {fontSize: 22},
  gameArea: {flex: 1},
  gameAreaContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 8,
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  sidebarScroll: {width: '30%', maxWidth: 260},
  sidebarScrollContent: {paddingBottom: 20},
  sidebar: {paddingRight: 12},
  gameAreaLandscape: {flex: 1},
  gameAreaLandscapeContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
});

export const GameShell = withIAPContext(GameShellInner);
