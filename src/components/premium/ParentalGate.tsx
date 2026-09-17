import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Text} from '../common/AppText';
import {FREDOKA_FAMILY} from '../../utils/fonts';
import {useTranslation} from 'react-i18next';
import {ThemeColors} from '../../types/game';

interface ParentalGateProps {
  visible: boolean;
  colors: ThemeColors;
  onSuccess: () => void;
  onCancel: () => void;
}

function generateProblem() {
  const a = Math.floor(Math.random() * 20) + 11; // 11-30
  const b = Math.floor(Math.random() * 15) + 11; // 11-25
  return {question: `${a} × ${b}`, answer: a * b};
}

export function ParentalGate({
  visible,
  colors,
  onSuccess,
  onCancel,
}: ParentalGateProps) {
  const {t} = useTranslation();
  const [problem, setProblem] = useState(generateProblem);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (visible) {
      setProblem(generateProblem());
      setInput('');
      setError(false);
    }
  }, [visible]);

  // An Arabic/Persian/Hindi IME sends its own digit glyphs (٠-٩, ۰-۹, ०-९) for
  // a number-pad field, and RN's ReactEditText deliberately strips the native
  // KeyListener's filtering, so the JS regex below is the only filter there is.
  // Without this the parent types a digit, sees nothing appear, and can never
  // get past the gate.
  const toAsciiDigits = (text: string) =>
    text
      .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[\u0966-\u096F]/g, d => String(d.charCodeAt(0) - 0x0966));

  const handleSubmit = () => {
    if (parseInt(input, 10) === problem.answer) {
      onSuccess();
    } else {
      setError(true);
      setInput('');
      setProblem(generateProblem());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
        <View style={[styles.card, {borderColor: colors.accent}]}>
          {/* A way out that the keyboard can never cover. On an iPhone SE the
              keyboard pushed Cancel off the screen, leaving a child who had
              tapped a crown stuck on a multiplication with no exit. */}
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('premium.parentalGateCancel')}
            style={styles.closeCorner}>
            <Text style={styles.closeCornerText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>{t('premium.parentalGateTitle')}</Text>
          <Text style={styles.message}>
            {t('premium.parentalGateMessage')}
          </Text>

          <Text style={styles.problem}>{problem.question} = ?</Text>

          <TextInput
            value={input}
            onChangeText={text => {
              setInput(toAsciiDigits(text).replace(/[^0-9]/g, ''));
              setError(false);
            }}
            placeholder={t('premium.parentalGatePlaceholder')}
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error && (
            <Text style={styles.errorText}>
              {t('premium.parentalGateWrong')}
            </Text>
          )}

          <Pressable
            onPress={handleSubmit}
            style={[styles.submitButton, {backgroundColor: colors.primaryButton}]}>
            <Text style={styles.submitText}>
              {t('premium.parentalGateSubmit')}
            </Text>
          </Pressable>

          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={[styles.cancelText, {color: colors.accent}]}>
              {t('premium.parentalGateCancel')}
            </Text>
          </Pressable>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  closeCorner: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  closeCornerText: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 24,
    borderWidth: 2,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  problem: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  input: {
    fontFamily: FREDOKA_FAMILY,
    backgroundColor: '#2D2D3F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
