import React, {useEffect, useCallback, useState} from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, ScrollView} from 'react-native';
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
import {PlayerSetup} from '../onboarding/PlayerSetup';
import {Language} from '../../types/game';
import i18n from '../../i18n';

export function GameShell() {
  const {t} = useTranslation();
  const game = useGameState();
  const themeConfig = useTheme(game.theme);
  const {colors} = themeConfig;
  const {loadPlayerData, savePlayerData, loadRewardData, saveRewardData} =
    usePersistence();
  const {isLandscape, isTablet, fontScale} = useLayout();
  const rewardSystem = useRewards();

  // UI state for reward screens
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [lastStarsAwarded, setLastStarsAwarded] = useState(0);
  const [showStarsDisplay, setShowStarsDisplay] = useState(false);

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

  // Track correct answers for reward system
  const prevIsCorrect = React.useRef<boolean | null>(null);
  useEffect(() => {
    if (game.isCorrect === true && prevIsCorrect.current !== true) {
      // Award stars — wasFirstTry if streak > 0 (no wrong before this)
      const wasFirstTry = game.streak > 0;
      const stars = rewardSystem.awardStars(game.gameMode, wasFirstTry);
      setLastStarsAwarded(stars);
      setShowStarsDisplay(true);
      setTimeout(() => setShowStarsDisplay(false), 3000);
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
          />
        );
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, isLandscape && styles.headerLandscape]}>
      <View style={styles.headerTop}>
        <View style={styles.titleRow}>
          <Text style={styles.bounceEmoji}>🎮</Text>
          <Text
            style={[
              styles.title,
              {color: colors.text, fontSize: 20 * fontScale},
            ]}>
            {t('app.title')}
          </Text>
          <Text style={styles.bounceEmoji}>🌟</Text>
        </View>
        <Pressable
          onPress={() => {
            game.setIsThemeChange(true);
            game.setShowSetup(true);
          }}
          style={styles.themeButton}>
          <Text style={styles.themeButtonText}>
            {themeConfig.selectorEmoji} ⚙️
          </Text>
        </Pressable>
        <LanguageSwitcher
          language={game.language}
          onLanguageChange={handleLanguageChange}
        />
      </View>
      <Text
        style={[
          styles.subtitle,
          {color: colors.accent, fontSize: 13 * fontScale},
        ]}>
        🎯{' '}
        {game.playerName
          ? `${t('app.subtitle')}, ${game.playerName}!`
          : t('app.subtitle')}{' '}
        🎈
      </Text>
    </View>
  );

  const renderStats = () => (
    <View style={[styles.statsRow, isLandscape && styles.statsRowLandscape]}>
      {/* Total Stars */}
      <View style={[styles.badge, {borderColor: '#F59E0B'}]}>
        <Text
          style={[
            styles.badgeText,
            {color: colors.text, fontSize: 12 * fontScale},
          ]}>
          ⭐ {rewardSystem.rewards.totalStars}
        </Text>
      </View>
      {/* Level */}
      <View style={[styles.badge, {borderColor: '#60A5FA'}]}>
        <Text
          style={[
            styles.badgeText,
            {color: colors.text, fontSize: 12 * fontScale},
          ]}>
          {t('stats.level')}: {game.level} 📈
        </Text>
      </View>
      {/* Game streak */}
      {game.streak > 0 && (
        <View style={[styles.badge, styles.streakBadge]}>
          <Text
            style={[
              styles.badgeText,
              {color: colors.text, fontSize: 12 * fontScale},
            ]}>
            {game.streak} 🔥
          </Text>
        </View>
      )}
      {/* Daily streak */}
      {rewardSystem.rewards.streak.current > 1 && (
        <View style={[styles.badge, {borderColor: '#F97316'}]}>
          <Text
            style={[
              styles.badgeText,
              {color: colors.text, fontSize: 12 * fontScale},
            ]}>
            {rewardSystem.rewards.streak.current} 📅
          </Text>
        </View>
      )}
      {/* Reward buttons row */}
      <Pressable
        onPress={() => setShowStickerBook(true)}
        style={[styles.badge, {borderColor: '#A855F7'}]}>
        <Text style={[styles.badgeText, {fontSize: 12 * fontScale}]}>
          🎨 {rewardSystem.rewards.stickers.length}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setShowAchievements(true)}
        style={[styles.badge, {borderColor: '#EAB308'}]}>
        <Text style={[styles.badgeText, {fontSize: 12 * fontScale}]}>
          🏆 {rewardSystem.rewards.achievements.length}
        </Text>
      </Pressable>
    </View>
  );

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {renderHeader()}
      {renderStats()}
      <Text style={[styles.mascot, {fontSize: 32 * fontScale}]}>
        {mascotEmoji}
      </Text>
      <ModeSelector
        activeMode={game.gameMode}
        onModeChange={game.setGameMode}
        colors={colors}
        vertical={isLandscape}
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
      <LinearGradient
        colors={[colors.backgroundFrom, colors.backgroundVia, colors.backgroundTo]}
        style={styles.gradient}>
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
          /* PORTRAIT: vertical stack */
          <View style={styles.content}>
            {renderHeader()}
            {renderStats()}
            <Text style={[styles.mascot, {fontSize: 32 * fontScale}]}>
              {mascotEmoji}
            </Text>
            <ModeSelector
              activeMode={game.gameMode}
              onModeChange={game.setGameMode}
              colors={colors}
            />
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
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  /* Portrait layout */
  content: {
    flex: 1,
    paddingTop: 44,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLandscape: {
    marginBottom: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  bounceEmoji: {
    fontSize: 16,
  },
  themeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 6,
  },
  themeButtonText: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  statsRowLandscape: {
    justifyContent: 'flex-start',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakBadge: {
    backgroundColor: 'rgba(245,158,11,0.3)',
    borderColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mascot: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 6,
  },
  gameArea: {
    flex: 1,
    marginTop: 8,
  },
  gameAreaContent: {
    paddingBottom: 20,
  },
  /* Landscape layout */
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  sidebarScroll: {
    width: '35%',
    maxWidth: 300,
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
    paddingBottom: 20,
    alignItems: 'center',
  },
});
