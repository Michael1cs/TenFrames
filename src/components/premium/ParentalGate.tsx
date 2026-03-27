import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
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
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, {borderColor: colors.accent}]}>
          <Text style={styles.title}>{t('premium.parentalGateTitle')}</Text>
          <Text style={styles.message}>
            {t('premium.parentalGateMessage')}
          </Text>

          <Text style={styles.problem}>{problem.question} = ?</Text>

          <TextInput
            value={input}
            onChangeText={text => {
              setInput(text.replace(/[^0-9]/g, ''));
              setError(false);
            }}
            placeholder={t('premium.parentalGatePlaceholder')}
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            style={styles.input}
            autoFocus
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
    fontSize: 13,
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
