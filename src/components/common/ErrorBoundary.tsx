import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n';
import {Emoji} from './Emoji';
import {
  AppErrorRecord,
  reportAppError,
  subscribeToAppError,
} from '../../utils/installErrorHandler';

// Keys owned by this app. Wiping them is the last-ditch escape from a save
// file that crashes the app on every launch.
// Progress and state this screen may delete to get a crashing app running
// again. '@tenframes_premium' is deliberately NOT here: a purchase is not
// progress, and a parent whose child hit "Delete and restart" would have lost
// the paid content with no way back except Restore.
const APP_KEYS = [
  '@tenframes_player',
  '@tenframes_rewards',
  '@tenframes_adventure',
  '@tenframes_lasterror',
  '@tenframes_demos_seen',
];

// The boundary must render even if i18n itself is what broke, so every string
// falls back to a literal.
function tr(key: string, fallback: string): string {
  try {
    const value = i18n.t(key);
    return value && value !== key ? String(value) : fallback;
  } catch {
    return fallback;
  }
}

interface Props {
  children: React.ReactNode;
}

interface State {
  error: AppErrorRecord | null;
  /** Bumped on retry so the subtree remounts from scratch. */
  resetKey: number;
  /** Consecutive retries that landed back here — 2+ means it is not transient. */
  retries: number;
  /** Message the `retries` count belongs to; a different one starts over. */
  countedMessage: string | null;
  showDetail: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  private unsubscribe?: () => void;

  state: State = {
    error: null,
    resetKey: 0,
    retries: 0,
    countedMessage: null,
    showDetail: false,
  };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.slice(0, 2000) : undefined,
        when: new Date().toISOString(),
        source: 'render',
      },
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Prefer React's component stack — it names the component, which a
    // minified JS stack does not.
    const enriched = new Error(error.message);
    enriched.stack = `${error.stack ?? ''}\n--- component stack ---${
      info.componentStack ?? ''
    }`;
    reportAppError(enriched, 'render');
  }

  componentDidMount() {
    // Render errors arrive via getDerivedStateFromError; everything else
    // (event handlers, timers, promises, native callbacks) only ever reaches
    // the global handler, so surface those here too.
    this.unsubscribe = subscribeToAppError(record => {
      this.setState(prev => (prev.error ? prev : {...prev, error: record}));
    });
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  private handleRetry = () => {
    this.setState(prev => {
      const message = prev.error?.message ?? null;
      // Count CONSECUTIVE retries of the same failure. A plain running total
      // would carry across unrelated errors and offer the destructive wipe on
      // first sight of a later, possibly transient one.
      const sameFailure = prev.countedMessage === message;
      return {
        error: null,
        resetKey: prev.resetKey + 1,
        retries: sameFailure ? prev.retries + 1 : 1,
        countedMessage: message,
        showDetail: false,
      };
    });
  };

  private handleReset = () => {
    Alert.alert(
      tr('error.resetTitle', 'Reset saved progress?'),
      tr(
        'error.resetMessage',
        'This deletes stars, stickers and adventure progress on this device. Only do this if the app keeps crashing.',
      ),
      [
        {text: tr('error.cancel', 'Cancel'), style: 'cancel'},
        {
          text: tr('error.resetConfirm', 'Delete and restart'),
          style: 'destructive',
          onPress: () => {
            // v3 API: removeMany, not the v1/v2 multiRemove.
            AsyncStorage.removeMany(APP_KEYS)
              .catch(() => {})
              .finally(() => {
                this.setState(prev => ({
                  error: null,
                  resetKey: prev.resetKey + 1,
                  retries: 0,
                  countedMessage: null,
                  showDetail: false,
                }));
              });
          },
        },
      ],
    );
  };

  render() {
    const {error, resetKey, retries, countedMessage, showDetail} = this.state;

    if (!error) {
      return (
        <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>
      );
    }

    return (
      <View style={styles.container}>
        <Emoji size={72}>🐣</Emoji>

        <Text style={styles.title}>{tr('error.title', 'Oops!')}</Text>
        <Text style={styles.message}>
          {tr(
            'error.message',
            'Something went wrong. Tap the button to start again.',
          )}
        </Text>

        <Pressable
          style={({pressed}) => [styles.button, pressed && styles.buttonPressed]}
          onPress={this.handleRetry}>
          <Text style={styles.buttonText}>
            {tr('error.retry', 'Try again')}
          </Text>
        </Pressable>

        {/* Only after two retries of THIS SAME failure do we offer the
            nuclear option — a parent should never reach for it casually, and
            never for an error they have not yet tried to retry. */}
        {retries >= 2 && countedMessage === error.message && (
          <Pressable style={styles.resetButton} onPress={this.handleReset}>
            <Text style={styles.resetButtonText}>
              {tr('error.reset', 'Still broken? Reset saved progress')}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => this.setState({showDetail: !showDetail})}
          hitSlop={12}>
          <Text style={styles.detailToggle}>
            {tr('error.details', 'Technical details')}
          </Text>
        </Pressable>

        {showDetail && (
          <ScrollView style={styles.detailBox}>
            <Text style={styles.detailText} selectable>
              {error.source} · {error.when}
              {'\n\n'}
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </Text>
          </ScrollView>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#1E293B',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 16,
  },
  message: {
    fontSize: 18,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 28,
    lineHeight: 26,
  },
  button: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 28,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resetButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resetButtonText: {
    fontSize: 15,
    color: '#FCA5A5',
    textAlign: 'center',
  },
  detailToggle: {
    marginTop: 28,
    fontSize: 13,
    color: '#64748B',
  },
  detailBox: {
    maxHeight: 180,
    alignSelf: 'stretch',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
  detailText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
