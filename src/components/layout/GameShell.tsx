import React, {useEffect, useCallback, useState} from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, ScrollView, ImageBackground} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useGameState} from '../../hooks/useGameState';
import {useTheme} from '../../hooks/useTheme';
import {useLayout} from '../../hooks/useLayout';
import {usePersistence} from '../../hooks/usePersistence';
import {useRewards} from '../../hooks/useRewards';
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
import {AboutTenFrames} from '../info/AboutTenFrames';
import {usePremium} from '../../hooks/usePremium';
import {FREE_DAILY_LIMIT} from '../../config/limits';
import {Language, GameMode} from '../../types/game';
import i18n from '../../i18n';

export function GameShell() {
  const {t} = useTranslation();
  const game = useGameState();
  const themeConfig = useTheme(game.theme);
  const {colors} = themeConfig;
  const {
    loadPlayerData, savePlayerData,
    loadRewardData, saveRewardData,
    loadPremiumData, savePremiumData,
  } = usePersistence();
  const {isLandscape, isTablet, fontScale} = useLayout();
  const rewardSystem = useRewards();
  const premium = usePremium();

  // UI state for reward screens
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [lastStarsAwarded, setLastStarsAwarded] = useState(0);
  const [showStarsDisplay, setShowStarsDisplay] = useState(false);
  const [showDailyLimit, setShowDailyLimit] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    (async () => {
      const data = await loadPlayerData();
      if (data.name) {
        game.setPlayerName(data.name);
        game.setTheme(data.theme);
        game.setLanguage(data.language);
        game.setShowSetup(false);
        i18n.changeLanguage(data.language);
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
      const wasFirstTry = game.streak > 0;
      const stars = rewardSystem.awardStars(game.gameMode, wasFirstTry);
      setLastStarsAwarded(stars);
      setShowStarsDisplay(true);
      setTimeout(() => setShowStarsDisplay(false), 3000);
      const updatedUsage = premium.recordExercise(game.gameMode);
      if (!premium.isPremium && premium.isModeLimited(game.gameMode)) {
        const used = updatedUsage.counts[game.gameMode] || 0;
        if (used >= FREE_DAILY_LIMIT) {
          setTimeout(() => setShowDailyLimit(true), 2500);
        }
      }
    }
    prevIsCorrect.current = game.isCorrect;
  }, [game.isCorrect]);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      game.setLanguage(lang);
      i18n.changeLanguage(lang);
      savePlayerData({language: lang});
    },
    [game, savePlayerData],
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
    premium.upgradeToPremium();
    setShowUpgrade(false);
    setShowDailyLimit(false);
  }, [premium]);

  const handleSetupComplete = useCallback(() => {
    game.setShowSetup(false);
    game.setIsThemeChange(false);
    savePlayerData({
      name: game.playerName,
      theme: game.theme,
      language: game.language,
    });
  }, [game, savePlayerData]);

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
            onCellClick={game.handleCellClick}
            onReset={game.resetGame}
            filledCount={game.filledCount}
            colors={colors}
            emoji={themeConfig.emoji}
            tokenImage={themeConfig.tokenImage}
          />
        );
      case 'addition':
        return (
          <AdditionMode
            cells={game.cells}
            onCellClick={game.handleCellClick}
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
          />
        );
      case 'subtraction':
        return (
          <SubtractionMode
            cells={game.cells}
            onCellClick={game.handleCellClick}
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
          />
        );
      case 'puzzle':
        return (
          <PuzzleMode
            cells={game.cells}
            onCellClick={game.handleCellClick}
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

  // Row 1: title + info button + language flags
  const renderTitleBar = () => (
    <View style={styles.titleBar}>
      <Text style={[styles.title, {color: colors.text}]}>
        {mascotEmoji} {t('app.title')}
      </Text>
      <View style={styles.titleRight}>
        <Pressable
          onPress={() => setShowAbout(true)}
          style={styles.infoButton}>
          <Text style={styles.infoButtonText}>ℹ️</Text>
        </Pressable>
        <LanguageSwitcher
          language={game.language}
          onLanguageChange={handleLanguageChange}
        />
      </View>
    </View>
  );

  // Row 2: stats badges + theme button on dark strip
  const renderStatsBar = () => (
    <View style={styles.statsBar}>
      <View style={styles.statsLeft}>
        <View style={[styles.statBadge, {borderColor: '#F59E0B'}]}>
          <Text style={[styles.statBadgeText, {color: colors.text}]}>
            ⭐ {rewardSystem.rewards.totalStars}
          </Text>
        </View>
        {game.streak > 0 && (
          <View style={[styles.statBadge, styles.streakBadge]}>
            <Text style={[styles.statBadgeText, {color: colors.text}]}>
              {game.streak} 🔥
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => setShowStickerBook(true)}
          style={[styles.statBadge, {borderColor: '#A855F7'}]}>
          <Text style={styles.statBadgeText}>
            🎨 {rewardSystem.rewards.stickers.length}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowAchievements(true)}
          style={[styles.statBadge, {borderColor: '#EAB308'}]}>
          <Text style={styles.statBadgeText}>
            🏆 {rewardSystem.rewards.achievements.length}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => {
          game.setIsThemeChange(true);
          game.setShowSetup(true);
        }}
        style={[styles.themeButton, {backgroundColor: colors.accentButton}]}>
        <Text style={styles.themeButtonText}>🎨 {t('game.changeTheme')}</Text>
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
          onComplete={handleSetupComplete}
          isThemeChange={game.isThemeChange}
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
            />
          </View>
        )}
      </ImageBackground>
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
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flexShrink: 1,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  themeButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 6,
  },
  themeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
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
