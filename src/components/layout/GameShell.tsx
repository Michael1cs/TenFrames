import React, {useEffect, useCallback, useState, useRef} from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, ScrollView, ImageBackground} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useGameState} from '../../hooks/useGameState';
import {useTheme} from '../../hooks/useTheme';
import {useLayout} from '../../hooks/useLayout';
import {usePersistence} from '../../hooks/usePersistence';
import {useRewards} from '../../hooks/useRewards';
import {Emoji} from '../common/Emoji';
import {ModeSelector} from './ModeSelector';
import {BackgroundEmojis} from './BackgroundEmojis';
import {LanguageSwitcher} from './LanguageSwitcher';
import {CountingMode} from '../game/CountingMode';
import {AdditionMode} from '../game/AdditionMode';
import {SubtractionMode} from '../game/SubtractionMode';
import {PuzzleMode} from '../game/PuzzleMode';
import {CorrectAnimation} from '../feedback/CorrectAnimation';
import {WrongAnimation} from '../feedback/WrongAnimation';
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
import {usePremium} from '../../hooks/usePremium';
import {useSound} from '../../hooks/useSound';
import {useVoice, VOICE_GROUPS} from '../../hooks/useVoice';
import {useAgeProfile} from '../../hooks/useAgeProfile';
import {useIAPConnection, withIAPContext} from '../../hooks/useIAP';
import {FREE_DAILY_LIMIT} from '../../config/limits';
import {Language, GameMode} from '../../types/game';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';
import {useAdventure} from '../../hooks/useAdventure';
import {AdventureMapScreen} from '../adventure/AdventureMapScreen';
import {AdventureLevelScreen} from '../adventure/AdventureLevelScreen';
import i18n from '../../i18n';

function GameShellInner() {
  const {t} = useTranslation();
  const game = useGameState();
  const themeConfig = useTheme(game.theme);
  const {colors} = themeConfig;
  const {
    loadPlayerData, savePlayerData,
    loadRewardData, saveRewardData,
    loadPremiumData, savePremiumData,
  } = usePersistence();
  const {isLandscape, isTablet, fontScale} = useLayout(game.ageGroup);
  const rewardSystem = useRewards();
  const premium = usePremium();
  const {play: playSound} = useSound();
  const ageProfile = useAgeProfile(game.ageGroup);
  const voice = useVoice();

  const handleIAPSuccess = useCallback(() => {
    premium.upgradeToPremium();
    setShowUpgrade(false);
    setShowDailyLimit(false);
  }, [premium]);

  const iap = useIAPConnection(handleIAPSuccess);

  // UI state for reward screens
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [lastStarsAwarded, setLastStarsAwarded] = useState(0);
  const [showStarsDisplay, setShowStarsDisplay] = useState(false);
  const [showDailyLimit, setShowDailyLimit] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [gameFlow, setGameFlow] = useState<'choice' | 'adventure' | 'freeplay'>('freeplay');
  const [showModeChoice, setShowModeChoice] = useState(false);
  const [showAdventureMap, setShowAdventureMap] = useState(false);
  const [showAdventureLevel, setShowAdventureLevel] = useState(false);
  const [adventureStars, setAdventureStars] = useState<number | null>(null);
  const [adventureIsNewBest, setAdventureIsNewBest] = useState(false);
  const adventure = useAdventure();

  // Load saved data on mount
  useEffect(() => {
    (async () => {
      const data = await loadPlayerData();
      if (data.name) {
        game.setPlayerName(data.name);
        game.setTheme(data.theme);
        game.setLanguage(data.language);
        game.setAgeGroup(data.ageGroup);
        game.setShowSetup(false);
        i18n.changeLanguage(data.language);
        isFirstSetupRef.current = false;
        // Restore last mode
        if (data.lastMode) {
          setGameFlow(data.lastMode);
          if (data.lastMode === 'adventure') {
            setShowAdventureMap(true);
          }
        }
      }
      const rewards = await loadRewardData();
      rewardSystem.loadRewards(rewards);
      rewardSystem.updateDailyStreak();
      const premiumData = await loadPremiumData();
      premium.loadPremiumData(premiumData);
    })();
  }, []);

  // Save rewards when they change
  useEffect(() => {
    if (rewardSystem.rewards.totalStars > 0) {
      saveRewardData(rewardSystem.rewards);
    }
  }, [rewardSystem.rewards, saveRewardData]);

  // Save score changes
  useEffect(() => {
    if (game.score > 0) {
      savePlayerData({highScore: game.score, level: game.level});
    }
  }, [game.score, game.level]);

  // Save premium data when usage changes
  useEffect(() => {
    savePremiumData(premium.getPremiumData());
  }, [premium.dailyUsage, premium.isPremium]);

  // Track correct answers for reward system + record exercise for daily limit
  const prevIsCorrect = React.useRef<boolean | null>(null);
  useEffect(() => {
    if (game.isCorrect === true && prevIsCorrect.current !== true) {
      playSound('correct');
      voice.playRandom(VOICE_GROUPS.correct);
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
      voice.playRandom(VOICE_GROUPS.tryAgain);
    }
    prevIsCorrect.current = game.isCorrect;
  }, [game.isCorrect]);

  // Young profile: speak the number whenever it changes in counting mode.
  const prevFilledCount = useRef(game.filledCount);
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

  // Young profile: themed addition/subtraction prompt when a new problem appears.
  // Triggered when problem identity changes (num1+num2 fingerprint), not on every
  // re-render. Subtraction uses instr_sub_*, addition uses instr_add_*.
  const lastProblemKey = useRef<string | null>(null);
  useEffect(() => {
    if (game.ageGroup !== 'young' || !game.currentProblem) return;
    const key = `${game.gameMode}-${game.currentProblem.num1}-${game.currentProblem.num2}`;
    if (key === lastProblemKey.current) return;
    lastProblemKey.current = key;
    if (game.gameMode === 'addition') {
      voice.play(`instr_add_${game.theme}`);
    } else if (game.gameMode === 'subtraction') {
      voice.play(`instr_sub_${game.theme}`);
    }
  }, [game.currentProblem, game.gameMode, game.ageGroup, game.theme, voice]);

  // Sound on level-up
  const prevAddLevel = useRef(game.additionLevel);
  const prevSubLevel = useRef(game.subtractionLevel);
  useEffect(() => {
    if (game.additionLevel > prevAddLevel.current || game.subtractionLevel > prevSubLevel.current) {
      playSound('levelup');
    }
    prevAddLevel.current = game.additionLevel;
    prevSubLevel.current = game.subtractionLevel;
  }, [game.additionLevel, game.subtractionLevel]);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      game.setLanguage(lang);
      i18n.changeLanguage(lang);
      savePlayerData({language: lang});
    },
    [game, savePlayerData],
  );

  // If active mode falls outside the age profile (e.g. user switched to young
  // while playing addition), drop back to counting.
  useEffect(() => {
    if (!ageProfile.availableModes.includes(game.gameMode)) {
      game.setGameMode('counting');
    }
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

  // Track if this is the very first setup (no name was saved before)
  const isFirstSetupRef = useRef(true);

  const handleSetupComplete = useCallback(() => {
    const isFirstTime = isFirstSetupRef.current && !game.isThemeChange;
    game.setShowSetup(false);
    game.setIsThemeChange(false);
    savePlayerData({
      name: game.playerName,
      theme: game.theme,
      language: game.language,
      ageGroup: game.ageGroup,
    });
    // Show mode choice only on first setup, not theme changes
    if (isFirstTime) {
      isFirstSetupRef.current = false;
      setShowModeChoice(true);
      // Mascot greeting (silent fallback if voice asset missing).
      voice.play('zee_greeting');
    }
  }, [game, savePlayerData, voice]);

  const handleModeChoice = useCallback((mode: 'adventure' | 'freeplay') => {
    setShowModeChoice(false);
    setGameFlow(mode);
    savePlayerData({lastMode: mode});
    if (mode === 'adventure') {
      setShowAdventureMap(true);
    }
  }, [savePlayerData]);

  const handleSwitchMode = useCallback(() => {
    if (gameFlow === 'adventure') {
      setGameFlow('freeplay');
      setShowAdventureMap(false);
      savePlayerData({lastMode: 'freeplay'});
    } else {
      setGameFlow('adventure');
      setShowAdventureMap(true);
      savePlayerData({lastMode: 'adventure'});
    }
  }, [gameFlow, savePlayerData]);

  const mascotEmoji =
    game.mascotMood === 'happy'
      ? '😄'
      : game.mascotMood === 'excited'
      ? '🤗'
      : game.mascotMood === 'thinking'
      ? '🧐'
      : '🎊';

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
            onCelebrate={() => playSound('star')}
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
    }
  };

  // Adventure handlers
  const handleAdventurePress = useCallback(() => {
    setGameFlow('adventure');
    setShowAdventureMap(true);
    savePlayerData({lastMode: 'adventure'});
  }, [savePlayerData]);

  const handleAdventureLevelPress = useCallback(
    (levelId: string) => {
      const world = ADVENTURE_WORLDS.find(
        w => w.id === adventure.selectedWorld,
      );
      const level = world?.levels.find(l => l.id === levelId);
      if (!level) return;

      // Check premium: levels beyond freeLevels require premium
      const freeLevels = world?.freeLevels ?? 2;
      if (level.order > freeLevels && !level.isBonus && !premium.isPremium) {
        setShowAdventureMap(false);
        setShowUpgrade(true);
        return;
      }
      // Bonus levels always require premium
      if (level.isBonus && !premium.isPremium) {
        setShowAdventureMap(false);
        setShowUpgrade(true);
        return;
      }

      adventure.startLevel(level);
      setAdventureStars(null);
      setAdventureIsNewBest(false);
      setShowAdventureMap(false);
      setShowAdventureLevel(true);
    },
    [adventure, premium.isPremium],
  );

  const handleAdventureLevelComplete = useCallback(() => {
    const result = adventure.completeLevel();
    setAdventureStars(result.stars);
    setAdventureIsNewBest(result.isNewBest);
    // Award stars to global reward system for each problem result
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

  const handleAdventureBackToMap = useCallback(() => {
    adventure.exitLevel();
    setShowAdventureLevel(false);
    setShowAdventureMap(true);
    setAdventureStars(null);
  }, [adventure]);

  // Row 1: title + info + flags + crown + theme
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
        <Pressable
          onPress={handleSwitchMode}
          style={[styles.infoButton, {backgroundColor: 'rgba(139, 92, 246, 0.3)'}]}>
          <Text style={styles.infoButtonText}>
            <Emoji>{gameFlow === 'adventure' ? '🎮' : '🗺️'}</Emoji>
          </Text>
        </Pressable>
        <LanguageSwitcher
          language={game.language}
          onLanguageChange={handleLanguageChange}
        />
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
          <Text style={styles.themeButtonText}><Emoji>⚙️</Emoji> {t('game.changeTheme')}</Text>
        </Pressable>
      </View>
    </View>
  );

  // Row 2: stats badges only
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
        onPress={() => setShowAchievements(true)}
        style={[styles.statBadge, {borderColor: '#EAB308'}]}>
        <Text style={styles.statBadgeText}>
          <Emoji>🏆</Emoji> {rewardSystem.rewards.achievements.length}
        </Text>
      </Pressable>
    </View>
  );

  // Landscape sidebar
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
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
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
        <CorrectAnimation visible={game.showConfetti} />
        <WrongAnimation visible={game.isCorrect === false} />

        {/* Reward popups */}
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

        {/* Reward screens */}
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

        {/* Premium modals */}
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
          onClose={() => setShowAbout(false)}
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

        <ModeChoice
          visible={showModeChoice}
          onAdventure={() => handleModeChoice('adventure')}
          onFreeplay={() => handleModeChoice('freeplay')}
        />

        {isLandscape ? (
          /* LANDSCAPE: sidebar left, game right */
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
              <StarsDisplay
                stars={lastStarsAwarded}
                visible={showStarsDisplay}
              />
            </ScrollView>
          </View>
        ) : (
          /* PORTRAIT: title → stats → game content → bottom tab bar */
          <View style={styles.portraitContainer}>
            {renderTitleBar()}
            {renderStatsBar()}
            <ScrollView
              style={styles.gameArea}
              contentContainerStyle={styles.gameAreaContent}
              showsVerticalScrollIndicator={false}>
              {renderGameMode()}
              <StarsDisplay
                stars={lastStarsAwarded}
                visible={showStarsDisplay}
              />
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

      {/* Adventure Map */}
      <AdventureMapScreen
        visible={showAdventureMap}
        progress={adventure.progress}
        selectedWorld={adventure.selectedWorld}
        colors={colors}
        isPremium={premium.isPremium}
        onSelectWorld={adventure.setSelectedWorld}
        onLevelPress={handleAdventureLevelPress}
        onClose={() => {
          setShowAdventureMap(false);
          setGameFlow('freeplay');
          savePlayerData({lastMode: 'freeplay'});
        }}
      />

      {/* Adventure Level */}
      {showAdventureLevel && adventure.activeLevel && (
        <AdventureLevelScreen
          key={adventure.activeLevel.level.id + '-' + adventure.activeLevel.level.order}
          levelState={adventure.activeLevel}
          colors={colors}
          stars={adventureStars}
          isNewBest={adventureIsNewBest}
          hasNextLevel={
            !!adventure.getNextPlayableLevel(adventure.selectedWorld)
          }
          onRecordResult={adventure.recordProblemResult}
          onComplete={handleAdventureLevelComplete}
          onNextLevel={handleAdventureNextLevel}
          onReplay={handleAdventureReplay}
          onBackToMap={handleAdventureBackToMap}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },

  /* ── Portrait layout ── */
  portraitContainer: {
    flex: 1,
    paddingTop: 36,
    zIndex: 10,
  },
  /* Row 1: title bar */
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  titleLeft: {
    flexShrink: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.85,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 16,
  },
  /* Row 2: stats bar */
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
  statBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumButton: {
    backgroundColor: 'rgba(245,158,11,0.3)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  premiumButtonText: {
    fontSize: 16,
  },
  themeButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  themeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
  },
  gameAreaContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 8,
  },

  /* ── Landscape layout ── */
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  sidebarScroll: {
    width: '30%',
    maxWidth: 260,
  },
  sidebarScrollContent: {
    paddingBottom: 20,
  },
  sidebar: {
    paddingRight: 12,
  },
  gameAreaLandscape: {
    flex: 1,
  },
  gameAreaLandscapeContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
});

export const GameShell = withIAPContext(GameShellInner);
