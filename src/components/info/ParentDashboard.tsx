import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, Pressable, ScrollView, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Emoji} from '../common/Emoji';
import {
  AdventureProgress,
  RewardData,
  ThemeColors,
} from '../../types/game';
import {ADVENTURE_WORLDS} from '../../config/adventureWorlds';

interface ParentDashboardProps {
  visible: boolean;
  colors: ThemeColors;
  rewards: RewardData;
  adventure: AdventureProgress;
  playerName: string;
  isPremium: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

// Per-mode display order + emoji + nameKey.
const MODE_ROW = [
  {mode: 'counting', emoji: '🔢', key: 'modes.counting'},
  {mode: 'addition', emoji: '➕', key: 'modes.addition'},
  {mode: 'subtraction', emoji: '➖', key: 'modes.subtraction'},
  {mode: 'puzzle', emoji: '🧩', key: 'modes.puzzle'},
  {mode: 'memory', emoji: '🧠', key: 'modes.memory'},
  {mode: 'share', emoji: '🐰', key: 'modes.share'},
] as const;

function daysSince(iso: string): number | null {
  if (!iso) return null;
  const last = new Date(iso + 'T00:00:00');
  if (isNaN(last.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - last.getTime()) / 86400000));
}

export function ParentDashboard({
  visible,
  colors,
  rewards,
  adventure,
  playerName,
  isPremium,
  onClose,
  onUpgrade,
}: ParentDashboardProps) {
  const {t} = useTranslation();
  // Dashboard is a premium feature — free users see a paywall card.
  const unlocked = isPremium;

  const ageDays = daysSince(rewards.streak.lastPlayedDate);
  const lastPlayedLabel = useMemo(() => {
    if (ageDays === null) return t('parentDash.never', {defaultValue: '—'});
    if (ageDays === 0) return t('parentDash.today', {defaultValue: 'today'});
    if (ageDays === 1) return t('parentDash.yesterday', {defaultValue: 'yesterday'});
    return t('parentDash.daysAgo', {count: ageDays, defaultValue: `${ageDays} days ago`});
  }, [ageDays, t]);

  // Compute strongest + weakest mode (only among modes the child has tried).
  const {strong, weak} = useMemo(() => {
    const stats = rewards.stats.byMode || {};
    const tried = MODE_ROW
      .map(m => {
        const s = stats[m.mode];
        if (!s || s.attempted === 0) return null;
        return {
          ...m,
          attempted: s.attempted,
          correct: s.correct,
          rate: s.correct / s.attempted,
        };
      })
      .filter(Boolean) as Array<{
        mode: string;
        emoji: string;
        key: string;
        attempted: number;
        correct: number;
        rate: number;
      }>;
    if (!tried.length) return {strong: null, weak: null};
    let strongest = tried[0];
    let weakest = tried[0];
    for (const m of tried) {
      if (m.rate > strongest.rate) strongest = m;
      if (m.rate < weakest.rate) weakest = m;
    }
    // Only call out weakest if there's a meaningful gap (else child is even)
    return {
      strong: strongest,
      weak: weakest === strongest || tried.length < 2 ? null : weakest,
    };
  }, [rewards.stats]);

  // Per-world Adventure summary (stars earned / total available).
  const worldRows = useMemo(() => {
    return ADVENTURE_WORLDS.map(w => {
      const wp = adventure.worlds[w.id];
      let earned = 0;
      const total = w.levels.length * 3;
      if (wp) {
        for (const lvl of w.levels) {
          earned += wp.levels[lvl.id]?.stars ?? 0;
        }
      }
      return {id: w.id, nameKey: w.nameKey, emoji: w.emoji, earned, total};
    });
  }, [adventure]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, {borderColor: colors.accent}]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, {color: colors.accent}]}>
              <Emoji>📊</Emoji> {t('parentDash.title', {defaultValue: 'Parent Progress'})}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {unlocked ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Top stats card */}
              <View style={[styles.topCard, {backgroundColor: 'rgba(255,255,255,0.08)'}]}>
                {!!playerName && (
                  <Text style={[styles.playerName, {color: colors.text}]}>
                    {playerName}
                  </Text>
                )}
                <View style={styles.topRow}>
                  <View style={styles.topStat}>
                    <Text style={styles.topStatBig}>⭐ {rewards.totalStars}</Text>
                    <Text style={styles.topStatLabel}>
                      {t('parentDash.totalStars', {defaultValue: 'total stars'})}
                    </Text>
                  </View>
                  <View style={styles.topStat}>
                    <Text style={styles.topStatBig}>🔥 {rewards.streak.current}</Text>
                    <Text style={styles.topStatLabel}>
                      {t('parentDash.streakDays', {defaultValue: 'day streak'})}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.topLastPlayed, {color: colors.text}]}>
                  {t('parentDash.lastActivity', {defaultValue: 'Last activity'})}: {lastPlayedLabel}
                </Text>
              </View>

              {/* Per-mode breakdown */}
              <Text style={[styles.sectionHeader, {color: colors.accent}]}>
                {t('parentDash.byMode', {defaultValue: 'By game mode'})}
              </Text>
              {MODE_ROW.map(m => {
                const s = rewards.stats.byMode?.[m.mode];
                const attempted = s?.attempted ?? 0;
                const correct = s?.correct ?? 0;
                const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
                return (
                  <View key={m.mode} style={styles.modeRow}>
                    <Text style={styles.modeEmoji}>
                      <Emoji>{m.emoji}</Emoji>
                    </Text>
                    <View style={styles.modeMiddle}>
                      <Text style={[styles.modeLabel, {color: colors.text}]}>
                        {t(m.key)}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: colors.accent,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.modeStats, {color: colors.text}]}>
                      {correct}/{attempted}
                    </Text>
                  </View>
                );
              })}

              {/* Coach prompt */}
              {(strong || weak) && (
                <View style={[styles.coachCard, {borderColor: colors.accent}]}>
                  {strong && (
                    <Text style={[styles.coachLine, {color: colors.text}]}>
                      <Emoji>✅</Emoji>{' '}
                      <Text style={styles.coachStrong}>
                        {t('parentDash.strongAt', {
                          defaultValue: 'Doing well at',
                        })}
                        :
                      </Text>{' '}
                      {t(strong.key)}
                    </Text>
                  )}
                  {weak && (
                    <Text style={[styles.coachLine, {color: colors.text}]}>
                      <Emoji>📌</Emoji>{' '}
                      <Text style={styles.coachStrong}>
                        {t('parentDash.practice', {
                          defaultValue: 'Practice more',
                        })}
                        :
                      </Text>{' '}
                      {t(weak.key)}
                    </Text>
                  )}
                </View>
              )}

              {/* Adventure summary */}
              <Text style={[styles.sectionHeader, {color: colors.accent}]}>
                {t('parentDash.adventureSummary', {defaultValue: 'Adventure'})}
              </Text>
              {worldRows.map(w => (
                <View key={w.id} style={styles.worldRow}>
                  <Text style={styles.worldEmoji}>
                    <Emoji>{w.emoji}</Emoji>
                  </Text>
                  <Text style={[styles.worldName, {color: colors.text}]}>
                    {t(w.nameKey)}
                  </Text>
                  <Text style={[styles.worldStars, {color: colors.text}]}>
                    ⭐ {w.earned}/{w.total}
                  </Text>
                </View>
              ))}

              <Text style={[styles.footnote, {color: colors.text}]}>
                {t('parentDash.privacy', {
                  defaultValue: 'All data stays on this device. Nothing is sent online.',
                })}
              </Text>
            </ScrollView>
          ) : (
            // Free users see a paywall — dashboard is a premium feature.
            <View style={styles.paywall}>
              <Text style={styles.paywallLock}>🔒</Text>
              <Text style={[styles.paywallTitle, {color: colors.text}]}>
                {t('parentDash.premiumOnly', {defaultValue: 'Premium feature'})}
              </Text>
              <Text style={[styles.paywallDesc, {color: colors.text}]}>
                {t('parentDash.premiumDesc', {
                  defaultValue:
                    'Track stars, streaks, and per-mode progress with the premium unlock.',
                })}
              </Text>
              <Pressable
                onPress={() => {
                  onClose();
                  setTimeout(() => onUpgrade(), 350);
                }}
                style={[styles.paywallBtn, {backgroundColor: colors.accent}]}>
                <Text style={styles.paywallBtnText}>
                  {t('parentDash.unlock', {defaultValue: 'Unlock premium'})}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 28,
    borderWidth: 2,
    width: '100%',
    maxWidth: 420,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paywall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  paywallLock: {
    fontSize: 64,
    opacity: 0.6,
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  paywallDesc: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 22,
  },
  paywallBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  paywallBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  topCard: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '700',
  },
  topRow: {
    flexDirection: 'row',
    gap: 24,
  },
  topStat: {
    alignItems: 'center',
  },
  topStatBig: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  topStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  topLastPlayed: {
    fontSize: 14,
    opacity: 0.85,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 4,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modeEmoji: {
    fontSize: 24,
    width: 28,
    textAlign: 'center',
  },
  modeMiddle: {
    flex: 1,
    gap: 6,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  modeStats: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'right',
  },
  coachCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  coachLine: {
    fontSize: 14,
  },
  coachStrong: {
    fontWeight: '700',
  },
  worldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  worldEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  worldName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  worldStars: {
    fontSize: 13,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
});
