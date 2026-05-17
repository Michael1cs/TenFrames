import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Emoji} from '../common/Emoji';

interface Props {
  visible: boolean;
  voiceEnabled: boolean;
  isPremium: boolean;
  onToggleVoice: (enabled: boolean) => void;
  onUpgrade: () => void;
  onOpenAbout: () => void;
  onClose: () => void;
}

export function SettingsModal({
  visible,
  voiceEnabled,
  isPremium,
  onToggleVoice,
  onUpgrade,
  onOpenAbout,
  onClose,
}: Props) {
  const {t} = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>
            <Emoji>⚙️</Emoji> {t('settings.title')}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Voice toggle */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowEmoji}><Emoji>🔊</Emoji></Text>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t('settings.voice')}</Text>
                <Text style={styles.rowSub}>{t('settings.voiceSub')}</Text>
              </View>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={onToggleVoice}
              trackColor={{false: '#3F3F46', true: '#10B981'}}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Premium row — tapping always opens the upgrade screen so the
              purchase UI stays discoverable (handy in dev when isPremium is
              forced true). When premium is already active, the row shows a
              status badge but still lets the parent peek at the screen. */}
          <Pressable onPress={onUpgrade} style={styles.premiumCard}>
            <Text style={styles.premiumEmoji}>
              <Emoji>{isPremium ? '✅' : '👑'}</Emoji>
            </Text>
            <View style={styles.premiumText}>
              <Text style={styles.premiumTitle}>
                {isPremium
                  ? t('settings.premiumActive')
                  : t('settings.unlockTitle')}
              </Text>
              <Text style={styles.premiumSub}>
                {isPremium
                  ? t('settings.premiumActiveSub')
                  : t('settings.unlockSub')}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          {/* About link */}
          <Pressable
            onPress={() => {
              onClose();
              setTimeout(onOpenAbout, 200);
            }}
            style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowEmoji}><Emoji>📘</Emoji></Text>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t('settings.about')}</Text>
                <Text style={styles.rowSub}>{t('settings.aboutSub')}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {color: '#FFFFFF', fontSize: 18, fontWeight: '700'},
  body: {flex: 1},
  bodyContent: {padding: 16, gap: 12},
  row: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 1,
  },
  rowEmoji: {fontSize: 24},
  rowText: {flexShrink: 1},
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rowSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  premiumCard: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  premiumEmoji: {fontSize: 28},
  premiumText: {flex: 1},
  premiumTitle: {fontSize: 16, fontWeight: '800', color: '#FFFFFF'},
  premiumSub: {fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2},
  chevron: {fontSize: 22, color: 'rgba(255,255,255,0.4)', fontWeight: '600'},
});
