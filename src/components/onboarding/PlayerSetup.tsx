import React, {useEffect, useRef} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {Text} from '../common/AppText';
import {FREDOKA_FAMILY} from '../../utils/fonts';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {Theme, Language} from '../../types/game';
import {getAllThemes} from '../../hooks/useTheme';
import {useVoice} from '../../hooks/useVoice';
import {LanguageSwitcher} from '../layout/LanguageSwitcher';
import {Emoji} from '../common/Emoji';

interface PlayerSetupProps {
  visible: boolean;
  playerName: string;
  onNameChange: (name: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onComplete: () => void;
  // When true, modal is opened from header (returning user editing settings).
  // We don't show the big "Ten Frames" title and the CTA copy is "Save".
  isThemeChange?: boolean;
}

export function PlayerSetup({
  visible,
  theme,
  onThemeChange,
  language,
  onLanguageChange,
  onComplete,
  isThemeChange = false,
}: PlayerSetupProps) {
  const {t} = useTranslation();
  const themes = getAllThemes();
  const isSettings = isThemeChange;

  // Pulse animation on the start button — draws attention for non-readers.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isSettings) return; // calmer in settings mode
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.07, {duration: 700}),
        withTiming(1, {duration: 700}),
      ),
      -1,
      false,
    );
  }, [isSettings, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{scale: pulse.value}],
  }));

  // Voice cues on the setup screen.
  // - Welcome plays immediately when the modal opens (helps non-readers
  //   understand they reached the app).
  // - After 6s of inactivity, the press-play hint reinforces the CTA.
  // We hold voice in a ref so re-renders of parent don't reset the timers
  // (otherwise frequent re-renders cancel the timeouts before they fire).
  const voice = useVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  useEffect(() => {
    if (!visible) return;
    // Welcome already played on ModeChoice; here just the theme prompt, and
    // on first run a nudge towards Play if the child idles. Opened from the
    // 🎨 button there is no Play button — tapping a theme closes the picker —
    // so the nudge used to tell the child to press something that wasn't
    // there. The 3.5s "let's play!" is gone too: it fired before the child
    // could have chosen anything.
    const t1 = setTimeout(() => voiceRef.current.play('ask_theme'), 500);
    const t3 = isSettings
      ? null
      : setTimeout(() => voiceRef.current.play('press_play'), 12000);
    return () => {
      clearTimeout(t1);
      if (t3) clearTimeout(t3);
      // Kid picks a theme and taps Play before the narration finishes —
      // cut the audio so the next screen doesn't get talked over.
      voiceRef.current.stop();
    };
  }, [visible, isSettings]);

  // The card is capped at 420pt, which is most of a phone's width but barely
  // 40% of a 13" iPad — the modal ended up as a narrow strip with the theme
  // grid breaking 4 + 4 + 2 and leaving a ragged last row. Widen the card on
  // tablets and switch to five columns, which divides the ten themes into two
  // full rows exactly.
  const {width, height} = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const themeGradients: Record<Theme, string[]> = {
    space: ['#6366F1', '#8B5CF6'],
    forest: ['#22C55E', '#10B981'],
    ocean: ['#3B82F6', '#06B6D4'],
    farm: ['#EAB308', '#F97316'],
    candy: ['#EC4899', '#D946EF'],
    unicorn: ['#8B5CF6', '#A855F7'],
    pixel: ['#0D9488', '#06B6D4'],
    slime: ['#84CC16', '#A855F7'],
    kpop: ['#EC4899', '#8B5CF6'],
    monsters: ['#7C3AED', '#10B981'],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onComplete}>
      <View style={styles.overlay}>
        <View style={[styles.card, isTablet && styles.cardTablet]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}>
            {!isSettings && (
              <Text style={[styles.titleMain, isTablet && styles.titleMainTablet]}>
                Ten Frames
              </Text>
            )}
            <Text style={[styles.title, isTablet && styles.titleTablet]}>
              {isSettings ? (
                <><Emoji>🎨</Emoji>{` ${t('setup.themeLabel')}`}</>
              ) : (
                <><Emoji>🎮</Emoji>{` ${t('setup.welcome')} `}<Emoji>🌟</Emoji></>
              )}
            </Text>

            {/* Language only on first-time onboarding (parent setup). Name
                input was removed — child can't write yet, parents skip it,
                and the value was only used as a vanity greeting. */}
            {!isSettings && (
              <>
                <View style={styles.section}>
                  <Text style={[styles.label, isTablet && styles.labelTablet]}>
                    {t('setup.languageLabel')}
                  </Text>
                  <View style={styles.languageRow}>
                    <LanguageSwitcher
                      language={language}
                      onLanguageChange={onLanguageChange}
                      large={isTablet}
                      onLight
                    />
                  </View>
                </View>
              </>
            )}

            <View style={[styles.section, isTablet && styles.sectionTablet]}>
              {!isSettings && (
                <Text style={[styles.label, isTablet && styles.labelTablet]}>
                  {t('setup.themeLabel')}
                </Text>
              )}
              <View style={styles.themeGrid}>
                {themes.map(themeConfig => {
                  const isSelected = theme === themeConfig.id;
                  const gradientColor = themeGradients[themeConfig.id][0];
                  return (
                    <Pressable
                      key={themeConfig.id}
                      onPress={() => {
                        onThemeChange(themeConfig.id);
                        // Settings (theme-only) mode: apply + close on tap.
                        if (isSettings) onComplete();
                      }}
                      style={[
                        styles.themeButton,
                        isSettings && styles.themeButtonLarge,
                        isTablet &&
                          (isSettings
                            ? styles.themeButtonLargeTablet
                            : styles.themeButtonTablet),
                        {
                          backgroundColor: isSelected
                            ? gradientColor
                            : '#F3F4F6',
                          borderColor: isSelected
                            ? gradientColor
                            : '#E5E7EB',
                        },
                      ]}>
                      <Emoji
                        style={[
                          isSettings ? styles.themeEmojiLarge : styles.themeEmoji,
                          isTablet &&
                            (isSettings
                              ? styles.themeEmojiLargeTablet
                              : styles.themeEmojiTablet),
                        ]}>
                        {themeConfig.selectorEmoji}
                      </Emoji>
                      <Text
                        style={[
                          styles.themeName,
                          isSettings && styles.themeNameLarge,
                          isTablet && styles.themeNameTablet,
                          {color: isSelected ? '#FFFFFF' : '#374151'},
                        ]}>
                        {t(themeConfig.nameKey)} <Emoji>{themeConfig.emoji}</Emoji>
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

          </ScrollView>

          {/* Sticky bottom CTA. In settings (theme-only) mode, just a close X. */}
          <View style={styles.ctaContainer}>
            {isSettings ? (
              <Pressable
                onPress={onComplete}
                style={[
                  styles.closeSettingsBtn,
                  isTablet && styles.closeSettingsBtnTablet,
                ]}>
                <Text
                  style={[
                    styles.closeSettingsText,
                    isTablet && styles.closeSettingsTextTablet,
                  ]}>
                  ✕
                </Text>
              </Pressable>
            ) : (
              <Animated.View style={pulseStyle}>
                <Pressable
                  onPress={onComplete}
                  style={[
                    styles.startButton,
                    isTablet && styles.startButtonTablet,
                  ]}>
                  <View style={styles.startButtonContent}>
                    <Text
                      style={[
                        styles.startButtonIcon,
                        isTablet && styles.startButtonIconTablet,
                      ]}>
                      <Emoji>▶️</Emoji>
                    </Text>
                    <Text
                      style={[
                        styles.startButtonText,
                        isTablet && styles.startButtonTextTablet,
                      ]}>
                      {t('setup.play')}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 0,
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    elevation: 10,
  },
  cardTablet: {
    maxWidth: 860,
    paddingHorizontal: 48,
    paddingTop: 44,
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  ctaContainer: {
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  titleMain: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#4F46E5',
    marginBottom: 4,
  },
  titleMainTablet: {fontSize: 50, marginBottom: 10},
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 22,
    color: '#1F2937',
  },
  titleTablet: {fontSize: 33, marginBottom: 34},
  section: {
    marginBottom: 18,
  },
  sectionTablet: {marginBottom: 30},
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#374151',
  },
  labelTablet: {fontSize: 24, marginBottom: 18},
  input: {
    fontFamily: FREDOKA_FAMILY,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: '#1F2937',
  },
  languageRow: {
    alignItems: 'flex-start',
  },
  ageButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    gap: 4,
  },
  ageButtonActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  ageEmoji: {
    fontSize: 36,
  },
  ageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  ageLabelActive: {
    color: '#5B21B6',
    fontWeight: '700',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  themeButton: {
    width: '22%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  // Five across: the ten themes fill two rows with no orphans.
  themeButtonTablet: {
    width: '18%',
    padding: 20,
    borderRadius: 22,
    borderWidth: 3,
  },
  themeButtonLargeTablet: {
    width: '22%',
    padding: 18,
  },
  // Bigger theme cards in settings (theme-only) mode — kid-friendly tap target
  themeButtonLarge: {
    width: '30%',
    padding: 14,
    borderRadius: 18,
  },
  themeEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  themeEmojiTablet: {fontSize: 48, marginBottom: 10},
  themeEmojiLargeTablet: {fontSize: 60, marginBottom: 12},
  themeEmojiLarge: {
    fontSize: 40,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeNameTablet: {fontSize: 19, fontWeight: '700'},
  themeNameLarge: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeSettingsBtn: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSettingsBtnTablet: {width: 80, height: 80, borderRadius: 40},
  closeSettingsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeSettingsTextTablet: {fontSize: 36},
  startButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
    marginTop: 12,
    elevation: 5,
    shadowColor: '#8B5CF6',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonTablet: {paddingVertical: 28, borderRadius: 24},
  startButtonIcon: {
    fontSize: 32,
  },
  startButtonIconTablet: {fontSize: 44},
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  startButtonTextTablet: {fontSize: 31},
});
