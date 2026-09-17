import React, {useEffect, useCallback, useState, useRef, useMemo, useContext} from 'react';
import {View, StyleSheet, StatusBar, Pressable, ScrollView, ImageBackground} from 'react-native';
import {Text} from '../common/AppText';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  NavigationContainer,
  NavigationContainerRefWithCurrent,
  StackActions,
  useFocusEffect,
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
import {useRewards, Celebration} from '../../hooks/useRewards';
import {Emoji} from '../common/Emoji';
import {ModeSelector} from './ModeSelector';
import {BackgroundEmojis} from './BackgroundEmojis';
import {CountingMode} from '../game/CountingMode';
import {AdditionMode} from '../game/AdditionMode';
import {SubtractionMode} from '../game/SubtractionMode';
import {PuzzleMode} from '../game/PuzzleMode';
import {NumberAnswerMode} from '../game/NumberAnswerMode';
import {CompareMode} from '../game/CompareMode';
import {WorkshopMode} from '../game/WorkshopMode';
import {FarmShareMode} from '../game/FarmShareMode';
import {CorrectAnimation} from '../feedback/CorrectAnimation';
import {WrongFlash} from '../feedback/WrongFlash';
import {FeedbackSheet, EquationPart} from '../feedback/FeedbackSheet';
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
import {useVoice, VOICE_GROUPS, setVoiceEnabled, clearPendingVoiceQueue} from '../../hooks/useVoice';
import {useAgeProfile} from '../../hooks/useAgeProfile';
import {useIAPConnection} from '../../hooks/useIAP';
import {FREE_DAILY_LIMIT} from '../../config/limits';
import {IS_SCHOOL_EDITION} from '../../config/edition';
import {Language, GameMode, WorldId} from '../../types/game';
import {ADVENTURE_WORLDS, isLevelPremiumLocked} from '../../config/adventureWorlds';
import {useAdventure} from '../../hooks/useAdventure';
import {AdventureWorldsScreen} from '../adventure/AdventureWorldsScreen';
import {TapHint} from '../feedback/TapHint';
import {useStallNudge} from '../../hooks/useStallNudge';
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

// How long the counting frame must sit still before the running total is
// spoken. Long enough to swallow a burst of taps, short enough that a child
// placing counters one at a time still hears every number.
const COUNT_VOICE_SETTLE_MS = 250;

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
        if (!ctx.onboarded) ctx.game.setShowSetup(true);
        navigation.navigate('FreePlay');
      }}
      homeBar={{
        onDashboard: () => {
          ctx.voice.stop();
          ctx.setShowParentDash(true);
        },
        onSettings: () => {
          ctx.voice.stop();
          ctx.setShowSettings(true);
        },
      }}
    />
  );
}

function FreePlayScreen() {
  const ctx = useShell();
  // Track focus state so the shared post-correct setTimeout in useGameState
  // can't queue voice / advance problems while the user is on a different
  // screen. The setTimeout fires 5s after a correct answer; if the child
  // navigated away in the meantime, we DON'T want the next-problem
  // narration to play.
  useFocusEffect(
    useCallback(() => {
      ctx.freePlayFocusedRef.current = true;
      return () => {
        ctx.freePlayFocusedRef.current = false;
      };
    }, [ctx]),
  );
  return <FreePlayContent ctx={ctx} />;
}

function AdventureWorldsRoute() {
  const ctx = useShell();
  const navigation = useNavigation<NavProp>();
  return (
    <AdventureWorldsScreen
      progress={ctx.adventure.progress}
      isPremium={ctx.premium.isPremium}
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
      isPremium={ctx.premium.isPremium}
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
    setShowAbout,
    setShowUpgrade,
    setShowStickerBook,
    setShowParentDash,
    mascotEmoji,
  } = ctx;

  // The answer sheet slides over the bottom of the play area — completed
  // equation on correct, gentle "try again" on wrong. It is an overlay, so
  // the frame above never reflows.
  const FEEDBACK_MODES: GameMode[] = ['addition', 'subtraction', 'puzzle', 'answer', 'compare'];
  const showAnswerFeedback =
    game.isCorrect !== null && FEEDBACK_MODES.includes(game.gameMode);
  const eqDark = '#1E1B4B';
  const eqGreen = '#16A34A';
  const feedbackEquation: EquationPart[] | null = (() => {
    if (game.isCorrect !== true) return null;
    if (
      (game.gameMode === 'addition' || game.gameMode === 'subtraction') &&
      game.currentProblem
    ) {
      const p = game.currentProblem;
      return [
        {text: String(p.num1), color: colors.cellColor1},
        {text: game.gameMode === 'addition' ? ' + ' : ' − ', color: eqDark},
        {text: String(p.num2), color: colors.cellColor2},
        {text: ' = ', color: eqDark},
        {text: String(p.answer), color: eqGreen},
      ];
    }
    if (game.gameMode === 'answer' && game.answerProblem) {
      const p = game.answerProblem;
      return [
        {text: String(p.num1), color: colors.cellColor1},
        {text: ' + ', color: eqDark},
        {text: String(p.num2), color: p.slot === 'addend' ? eqGreen : colors.cellColor2},
        {text: ' = ', color: eqDark},
        {text: String(p.answer), color: p.slot === 'sum' ? eqGreen : colors.cellColor2},
      ];
    }
    if (game.gameMode === 'puzzle') {
      return [
        {text: String(game.puzzleAnswer), color: colors.cellColor1},
        {text: ' + ', color: eqDark},
        {text: String(10 - game.puzzleAnswer), color: eqGreen},
        {text: ' = 10', color: eqDark},
      ];
    }
    return null; // compare: stars + praise carry the moment
  })();

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
      case 'answer':
        return (
          <NumberAnswerMode
            cells={game.cells}
            onCellClick={handleCellClick}
            onNumberPick={game.handleNumberPick}
            onReset={game.resetGame}
            problem={game.answerProblem}
            isCorrect={game.isCorrect}
            hasSubmitted={game.hasSubmitted}
            feedback={game.feedback}
            wrongPick={game.wrongPick}
            colors={colors}
            emoji={themeConfig.emoji}
            tokenImage={themeConfig.tokenImage}
            level={game.answerLevel}
            ageProfile={ageProfile}
          />
        );
      case 'compare':
        return (
          <CompareMode
            problem={game.compareProblem}
            onPick={game.handleComparePick}
            onReset={game.resetGame}
            isCorrect={game.isCorrect}
            hasSubmitted={game.hasSubmitted}
            feedback={game.feedback}
            colors={colors}
            level={game.compareLevel}
            ageProfile={ageProfile}
          />
        );
      case 'workshop':
        return (
          <WorkshopMode
            paletteEmojis={themeConfig.backgroundEmojis}
            colors={colors}
          />
        );
      case 'share':
        return (
          <FarmShareMode
            problem={game.shareProblem}
            foodEmoji="🥕"
            animalEmoji="🐰"
            colors={colors}
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
          <Emoji>{mascotEmoji}</Emoji>{' '}
          {IS_SCHOOL_EDITION ? 'Ten Frames School' : 'Ten Frames'}
        </Text>
        <Text style={[styles.subtitle, {color: colors.accent}]}>
          {t('app.title')}
        </Text>
      </View>
      <View style={styles.titleRight}>
        <Pressable
          onPress={() => {
            ctx.voice.stop();
            setShowAbout(true);
          }}
          style={styles.infoButton}>
          <Text style={styles.infoButtonText}><Emoji>ℹ️</Emoji></Text>
        </Pressable>
        {!premium.isPremium && (
          <Pressable
            onPress={() => {
              ctx.voice.stop();
              setShowUpgrade(true);
            }}
            style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}><Emoji>👑</Emoji></Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            ctx.voice.stop();
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
        onPress={() => {
          ctx.voice.stop();
          setShowStickerBook(true);
        }}
        style={[styles.statBadge, {borderColor: '#A855F7'}]}>
        <Text style={styles.statBadgeText}>
          <Emoji>🎨</Emoji> {rewardSystem.rewards.stickers.length}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          ctx.voice.stop();
          setShowParentDash(true);
        }}
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
        compact={ageProfile.compact}
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
          <View style={styles.gameAreaWrap}>
            <ScrollView
              style={styles.gameAreaLandscape}
              contentContainerStyle={styles.gameAreaLandscapeContent}
              showsVerticalScrollIndicator={false}>
              {renderGameMode()}
            </ScrollView>
            <View style={styles.stallHint} pointerEvents="none">
              <TapHint visible={ctx.showTapHint} />
            </View>
            <FeedbackSheet
              visible={showAnswerFeedback}
              isCorrect={game.isCorrect}
              stars={lastStarsAwarded}
              equationParts={feedbackEquation}
            />
          </View>
        </View>
      ) : (
        <View style={styles.portraitContainer}>
          {renderTitleBar()}
          {renderStatsBar()}
          <View style={styles.gameAreaWrap}>
            <ScrollView
              style={styles.gameArea}
              contentContainerStyle={styles.gameAreaContent}
              showsVerticalScrollIndicator={false}>
              {renderGameMode()}
            </ScrollView>
            <View style={styles.stallHint} pointerEvents="none">
              <TapHint visible={ctx.showTapHint} />
            </View>
            <FeedbackSheet
              visible={showAnswerFeedback}
              isCorrect={game.isCorrect}
              stars={lastStarsAwarded}
              equationParts={feedbackEquation}
            />
          </View>
          <ModeSelector
            activeMode={game.gameMode}
            onModeChange={handleModeChange}
            colors={colors}
            getRemainingExercises={premium.getRemainingExercises}
            isPremium={premium.isPremium}
            onAdventurePress={handleAdventurePress}
            availableModes={ageProfile.availableModes}
            compact={ageProfile.compact}
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
  // Flipped by FreePlayScreen's useFocusEffect. Used by the post-correct
  // voice useEffect below to suppress queueing when the child has
  // navigated to Adventure (the setTimeout in useGameState still fires
  // and generates the next problem, but we don't want to narrate it).
  const freePlayFocusedRef = useRef(false);

  // A child who stalls on an addition or subtraction problem gets the same
  // two nudges as in Adventure: the hand at 4s, the instruction again at 10s.
  const {
    showHint: showTapHint,
    arm: armStallNudge,
    cancel: cancelStallNudge,
  } = useStallNudge({canReplay: () => freePlayFocusedRef.current});
  const game = useGameState();
  const themeConfig = useTheme(game.theme);
  const {colors} = themeConfig;
  const {
    loadPlayerData, savePlayerData,
    loadRewardData, saveRewardData,
    loadPremiumData, savePremiumData,
  } = usePersistence();
  const {isLandscape, isTablet: _isTablet, fontScale: _fontScale} = useLayout();
  const rewardSystem = useRewards();
  const premium = usePremium();
  const {play: playSound} = useSound();
  const ageProfile = useAgeProfile();

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
  const [onboarded, setOnboarded] = useState(false);
  // Declared after voiceEnabled on purpose: the babel preset downlevels const
  // to var, so calling this above the useState silently passed `undefined`
  // and the enabled option never took effect.
  const voice = useVoice({enabled: voiceEnabled});
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

      // Saves written before v1.6.1 have no `onboarded` flag; a non-empty
      // name means that user completed the old setup that still asked for one.
      const hasOnboarded = data.onboarded ?? data.name !== '';
      setOnboarded(hasOnboarded);

      // Theme and age group restore unconditionally: loadPlayerData spreads
      // defaults over whatever is stored, so they are always present and valid.
      game.setTheme(data.theme);
      if (data.name) game.setPlayerName(data.name);

      if (hasOnboarded) {
        // Language is the one preference that must NOT be taken from the
        // defaults: defaultPlayerData hard-codes 'ro', so applying it on a
        // fresh install would overwrite the device-locale choice that
        // src/i18n/index.ts and useGameState's initial state just made, and
        // hand a German or English child a Romanian app. Restore it only for
        // someone who actually picked one — for everyone else it must survive
        // every cold start, which is exactly what this used to get wrong in
        // the other direction.
        game.setLanguage(data.language);
        i18n.changeLanguage(data.language);
        game.setShowSetup(false);
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
  // One exercise is billed per PROBLEM, on the first submission whatever the
  // outcome. This used to live in the isCorrect === true branch, so the free
  // tier charged only for CORRECT answers: a child who got everything wrong
  // played all day, and a child doing well was the one who hit the wall.
  const billedProblemRef = useRef(false);
  // The wall is raised here but shown later — never on top of a celebration.
  const limitPendingRef = useRef(false);
  useEffect(() => {
    billedProblemRef.current = false;
    // answer/compare keep currentProblem null — their own problem objects
    // mark the problem boundary instead.
    // A new problem also ends the celebration window: pending toasts are
    // dropped rather than shown over the next challenge.
    rewardSystem.clearTransientCelebrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentProblem, game.answerProblem, game.compareProblem]);
  useEffect(() => {
    if (game.isCorrect !== null && !billedProblemRef.current) {
      billedProblemRef.current = true;
      const usage = premium.recordExercise(game.gameMode);
      if (!premium.isPremium && premium.isModeLimited(game.gameMode)) {
        const used = usage.counts[game.gameMode] || 0;
        // Raise the flag now, show the sheet once the child has left the
        // problem — see the currentProblem effect below.
        if (used >= FREE_DAILY_LIMIT) limitPendingRef.current = true;
      }
    }

    if (game.isCorrect === true && prevIsCorrect.current !== true) {
      playSound('correct');
      if (
        game.currentProblem &&
        game.currentProblem.answer <= 5 &&
        (game.gameMode === 'addition' || game.gameMode === 'subtraction')
      ) {
        // post_great_<theme>_N clips cover 1-5; bigger answers fall through
        // to the generic praise below.
        queueVoice(`post_great_${game.theme}_${game.currentProblem.answer}`);
      } else if (game.gameMode === 'answer' && game.answerProblem) {
        // Say the number the child just named, then praise.
        queueVoice(`num_${game.answerProblem.expected}`);
        const ids = VOICE_GROUPS.correct;
        queueVoice(ids[Math.floor(Math.random() * ids.length)]);
      } else if (
        (game.gameMode === 'addition' || game.gameMode === 'subtraction') &&
        Math.random() < 0.5
      ) {
        // Name the achievement rather than cheering generically.
        const pool =
          game.gameMode === 'addition'
            ? VOICE_GROUPS.okAddition
            : VOICE_GROUPS.okSubtraction;
        queueVoice(pool[Math.floor(Math.random() * pool.length)]);
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

  // Counting narrates the running total, but the voice queue is a FIFO with
  // a gap between clips: a child machine-gunning ten cells queued ten clips
  // and then heard "one… two… three…" long after the frame was full. The
  // count is now announced only once the tapping settles, and any count
  // still waiting its turn is dropped — so fast tapping ends on a single
  // "ten!" while deliberate tapping still counts along, one number per cell.
  useEffect(() => {
    if (game.gameMode !== 'counting') {
      prevFilledCount.current = game.filledCount;
      return;
    }
    if (game.filledCount === prevFilledCount.current) return;
    prevFilledCount.current = game.filledCount;
    const count = game.filledCount;
    const timer = setTimeout(() => {
      clearPendingVoiceQueue();
      voice.play(`num_${count}`);
    }, COUNT_VOICE_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [game.filledCount, game.gameMode, voice]);

  // The daily wall waits here. Raising it during the celebration and firing a
  // modal 2.5s later put "you're done for today" on top of a child's confetti;
  // showing it as the next problem arrives lets the reward finish first.
  useEffect(() => {
    if (!limitPendingRef.current) return;
    limitPendingRef.current = false;
    setShowDailyLimit(true);
  }, [game.currentProblem, game.answerProblem, game.compareProblem]);

  useEffect(() => {
    if (game.gameMode !== 'addition' && game.gameMode !== 'subtraction') return;
    if (!game.currentProblem) return;
    // If the child navigated away (e.g. into Adventure) the next-problem
    // setTimeout in useGameState still fires and mutates currentProblem —
    // but we must NOT narrate it because the FreePlay screen isn't on
    // screen anymore. Skip queuing in that case.
    if (!freePlayFocusedRef.current) return;
    const key = `${game.gameMode}-${game.currentProblem.num1}-${game.currentProblem.num2}`;
    if (key === lastProblemKey.current) return;
    const isFirst = lastProblemKey.current === null;
    lastProblemKey.current = key;
    const n1 = game.currentProblem.num1;
    const n2 = game.currentProblem.num2;
    const action = game.gameMode === 'addition' ? 'add' : 'sub';
    // Drop any leftover INSTRUCTION queued from the previous problem (the
    // child might have solved while it was still queued). Use the soft
    // variant so the currently-playing praise (post_great_…) finishes
    // naturally — cutting it mid-word was the previous complaint.
    if (!isFirst) clearPendingVoiceQueue();
    const instruction = () => {
      queueVoice(`pre_have_${game.theme}_${n1}`);
      queueVoice(`instr_${action}_${game.theme}_${n2}`);
    };
    instruction();
    // Roughly every other problem also restates the task as a question, so
    // a long Free Play session doesn't replay one sentence forever.
    if (Math.random() < 0.5) {
      const alt = game.gameMode === 'addition' ? 'add_alt' : 'sub_alt';
      queueVoice(`${alt}_${1 + Math.floor(Math.random() * 2)}`);
    }
    armStallNudge(instruction);
  }, [
    game.currentProblem,
    game.gameMode,
    game.theme,
    queueVoice,
    voice,
    armStallNudge,
  ]);

  // The answer landing, or a switch to another mode, ends the nudge.
  useEffect(() => {
    if (game.hasSubmitted) cancelStallNudge();
  }, [game.hasSubmitted, cancelStallNudge]);
  useEffect(() => {
    if (game.gameMode !== 'addition' && game.gameMode !== 'subtraction') {
      cancelStallNudge();
    }
  }, [game.gameMode, cancelStallNudge]);

  // One voice line per celebration, spoken as it takes the stage — the
  // queue guarantees they no longer pile onto the same instant.
  const prevCelebration = useRef<Celebration | null>(null);
  useEffect(() => {
    const cur = rewardSystem.currentCelebration;
    if (cur && cur !== prevCelebration.current) {
      if (cur.kind === 'sticker') {
        queueVoice('reward_sticker');
      } else if (cur.kind === 'achievement') {
        queueVoice('reward_achievement');
      } else if (cur.id.includes('100')) {
        queueVoice('reward_milestone_100');
      } else if (cur.id.includes('50')) {
        queueVoice('reward_milestone_50');
      } else if (cur.id.includes('25')) {
        queueVoice('reward_milestone_25');
      } else {
        queueVoice('reward_milestone_10');
      }
    }
    prevCelebration.current = cur;
  }, [rewardSystem.currentCelebration, queueVoice]);

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
  const prevAnswerLevel = useRef(game.answerLevel);
  const prevCompareLevel = useRef(game.compareLevel);
  useEffect(() => {
    if (
      game.additionLevel > prevAddLevel.current ||
      game.subtractionLevel > prevSubLevel.current ||
      game.answerLevel > prevAnswerLevel.current ||
      game.compareLevel > prevCompareLevel.current
    ) {
      playSound('levelup');
    }
    prevAddLevel.current = game.additionLevel;
    prevSubLevel.current = game.subtractionLevel;
    prevAnswerLevel.current = game.answerLevel;
    prevCompareLevel.current = game.compareLevel;
  }, [game.additionLevel, game.subtractionLevel, game.answerLevel, game.compareLevel, playSound]);

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
      cancelStallNudge();
      playSound('tap');
      game.handleCellClick(index);
    },
    [game, playSound, cancelStallNudge],
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
    setOnboarded(true);
    savePlayerData({
      name: game.playerName,
      theme: game.theme,
      language: game.language,
      onboarded: true,
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

      const premiumLocked = isLevelPremiumLocked(
        world!,
        level,
        adventure.progress.worlds[world!.id]?.levels[level.id],
        premium.isPremium,
      );
      if (premiumLocked) {
        // Bounce out of the Adventure stack so the upgrade screen owns focus.
        //
        // Must go through dispatch: createNavigationContainerRef only proxies
        // CommonActions (navigate/goBack/reset/...) plus a fixed helper list.
        // popToTop is a StackAction, so navigationRef.current.popToTop is
        // undefined and calling it directly threw a TypeError — which, in a
        // release build, is a hard crash the moment a free user taps a
        // premium-locked Adventure level.
        // Said to the child, who can't read the sheet that's about to open.
        voice.play('ask_parent');
        navigationRef.current?.dispatch(StackActions.popToTop());
        setShowUpgrade(true);
        return false;
      }

      adventure.startLevel(level);
      setAdventureStars(null);
      setAdventureIsNewBest(false);
      return true;
    },
    [adventure, premium.isPremium, navigationRef, voice],
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
      // "Next" is a way into a level like any other, so it goes through the
      // same premium rule as tapping the level on the map. It used to start
      // the next level directly, which let a free player walk an entire
      // world one "Next" at a time.
      const world = ADVENTURE_WORLDS.find(w => w.id === nextLevel.worldId);
      if (
        world &&
        isLevelPremiumLocked(
          world,
          nextLevel,
          adventure.progress.worlds[world.id]?.levels[nextLevel.id],
          premium.isPremium,
        )
      ) {
        adventure.exitLevel();
        setAdventureStars(null);
        // Said to the child, who can't read the sheet that's about to open.
        voice.play('ask_parent');
        navigationRef.current?.dispatch(StackActions.popToTop());
        setShowUpgrade(true);
        return;
      }
      // Fresh level, fresh stage — drop any toast still waiting its turn.
      rewardSystem.clearTransientCelebrations();
      adventure.startLevel(nextLevel);
      setAdventureStars(null);
      setAdventureIsNewBest(false);
    }
  }, [adventure, rewardSystem, premium.isPremium, navigationRef]);

  const handleAdventureReplay = useCallback(() => {
    if (adventure.activeLevel) {
      rewardSystem.clearTransientCelebrations();
      adventure.startLevel(adventure.activeLevel.level);
      setAdventureStars(null);
      setAdventureIsNewBest(false);
    }
  }, [adventure, rewardSystem]);

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
    freePlayFocusedRef,
    showTapHint,
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
    onboarded,
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
    premium,
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
        <NavigationContainer
          ref={navigationRef}
          // Restoring the last mode used to be done by making it the stack's
          // initialRouteName, which left it as the ONLY entry in the stack.
          // Every way back out of Adventure is a pop — the ✕ on the worlds and
          // levels screens, the level screen's back arrow, the watchdog's
          // StackActions.popToTop — and a pop with nothing beneath it is a
          // silent no-op, so a returning child whose last mode was Adventure
          // opened the app straight into the world list and could not leave it.
          // Seed the stack with Home underneath instead: the restored screen is
          // still what the child sees first, but now it has somewhere to go
          // back to and every existing exit works unchanged.
          initialState={
            initialRoute === 'Home'
              ? undefined
              : {
                  index: 1,
                  routes: [{name: 'Home' as const}, {name: initialRoute}],
                }
          }>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
            // Whenever any screen in the stack loses focus, cut any audio
            // currently playing. Kids navigate impatiently — without this,
            // the previous screen's narrator keeps talking over the new
            // screen for several seconds.
            screenListeners={{
              blur: () => shell.voice.stop(),
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
      <CorrectAnimation visible={game.showConfetti} colors={colors} />
      <WrongFlash visible={game.isCorrect === false} />
      {/* Celebration queue: exactly one on stage at a time. */}
      <NewStickerPopup
        stickerIds={
          rewardSystem.currentCelebration?.kind === 'sticker'
            ? rewardSystem.currentCelebration.ids
            : []
        }
        visible={rewardSystem.currentCelebration?.kind === 'sticker'}
        colors={colors}
      />
      <AchievementPopup
        achievementId={
          rewardSystem.currentCelebration?.kind === 'achievement'
            ? rewardSystem.currentCelebration.id
            : null
        }
        visible={rewardSystem.currentCelebration?.kind === 'achievement'}
        colors={colors}
      />
      <MilestoneAnimation
        visible={rewardSystem.currentCelebration?.kind === 'milestone'}
        milestoneId={
          rewardSystem.currentCelebration?.kind === 'milestone'
            ? rewardSystem.currentCelebration.id
            : null
        }
        onDismiss={rewardSystem.advanceCelebration}
        colors={colors}
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
        onDismiss={() => {
          setShowDailyLimit(false);
          // "See you tomorrow!" must actually end the session in a limited
          // mode — staying put kept generating problems and re-raising this
          // modal after every answer. Land the child in Counting, which is
          // free forever.
          if (!premium.canPlayMode(game.gameMode)) {
            game.setGameMode('counting');
          }
        }}
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
        onComplete={handleSetupComplete}
        isThemeChange={game.isThemeChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // The stall hand floats over the game area's bottom edge; absolute so its
  // arrival never shifts the frame above it.
  stallHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 4,
    alignItems: 'center',
  },
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
  // Wraps the game ScrollView so the FeedbackSheet can overlay its bottom
  // edge without touching the layout inside.
  gameAreaWrap: {flex: 1},
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

// react-native-iap 15.x dropped withIAPContext entirely — there is no context
// to establish, so there is nothing here to branch on. The School Edition's
// requirement (never open a store connection) still holds; it is now enforced
// one level down, in useIAPConnection, which returns an inert state for the
// school build and never calls the hook that connects.
export const GameShell = GameShellInner;
