import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_ERROR_KEY = '@tenframes_lasterror';

export type AppErrorSource = 'js-global' | 'promise' | 'render';

export interface AppErrorRecord {
  message: string;
  stack?: string;
  when: string;
  source: AppErrorSource;
}

type Listener = (error: AppErrorRecord) => void;

const listeners = new Set<Listener>();
// An error thrown at import time fires before any component can subscribe.
// Hold it here and hand it to the first subscriber instead of losing it.
let pending: AppErrorRecord | null = null;
let lastMessage = '';
let installed = false;

function toRecord(error: unknown, source: AppErrorSource): AppErrorRecord {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    message: err.message || 'Unknown error',
    // Stacks in a release bundle are minified but still pin down the frame,
    // and they survive into the screenshot a parent sends us.
    stack: typeof err.stack === 'string' ? err.stack.slice(0, 2000) : undefined,
    when: new Date().toISOString(),
    source,
  };
}

export function reportAppError(
  error: unknown,
  source: AppErrorSource,
): AppErrorRecord {
  const record = toRecord(error, source);

  // A crash loop re-throws the same error on every frame. Report it once so
  // we neither hammer AsyncStorage nor re-render the recovery screen forever.
  if (record.message === lastMessage) return record;
  lastMessage = record.message;

  AsyncStorage.setItem(LAST_ERROR_KEY, JSON.stringify(record)).catch(() => {});

  // An unhandled rejection does NOT terminate the process, so it must not
  // replace a 5-year-old's game with a full-screen "something went wrong".
  // Record it for diagnosis and stop there; only errors that would actually
  // have crashed the app reach the recovery screen.
  if (source === 'promise') return record;

  if (listeners.size === 0) {
    pending = record;
  } else {
    for (const listener of listeners) {
      try {
        listener(record);
      } catch {
        // A listener that throws must not take down the error path itself.
      }
    }
  }

  return record;
}

export function subscribeToAppError(listener: Listener): () => void {
  listeners.add(listener);

  if (pending) {
    const held = pending;
    pending = null;
    // Defer: the subscriber is almost certainly still inside its own mount
    // effect, and setState during mount would warn.
    setTimeout(() => listener(held), 0);
  }

  return () => {
    listeners.delete(listener);
  };
}

/** Last error this install recorded, for support / the parent dashboard. */
export async function readLastAppError(): Promise<AppErrorRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ERROR_KEY);
    return raw ? (JSON.parse(raw) as AppErrorRecord) : null;
  } catch {
    return null;
  }
}

export async function clearLastAppError(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_ERROR_KEY);
  } catch {
    // Nothing useful to do — the record is a diagnostic, not state.
  }
}

/**
 * Installs the process-wide JS error handlers. Call once, from index.js,
 * before the app is registered.
 *
 * Without this, an unhandled JS exception in a release build reaches RN's
 * default handler, which calls RCTFatal and terminates the process. A 5-year-old
 * cannot recover from that; ErrorBoundary's recovery screen can.
 */
export function installErrorHandler(): void {
  if (installed) return;
  installed = true;

  const globalAny = globalThis as any;
  const errorUtils = globalAny.ErrorUtils;

  if (errorUtils?.setGlobalHandler) {
    const previousHandler = errorUtils.getGlobalHandler?.();

    errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      reportAppError(error, 'js-global');

      if (__DEV__) {
        // Keep the red box in development — far more useful than our screen.
        previousHandler?.(error, isFatal);
      }
      // In release we deliberately do NOT delegate: the default handler is
      // exactly the thing that kills the process.
    });
  }

  if (!__DEV__) {
    const onUnhandled = (_id: number, error: unknown) =>
      reportAppError(error, 'promise');

    // Hermes ships its own Promise, and RN's polyfillPromise.js takes the
    // Hermes branch and never installs the `promise` npm polyfill. Patching
    // that polyfill's rejection tracker — which is what this used to do —
    // therefore instruments a class nothing in the app ever constructs.
    // Hermes exposes its own tracker instead.
    const hermes = (globalThis as any).HermesInternal;
    if (hermes?.hasPromise?.() && hermes?.enablePromiseRejectionTracker) {
      hermes.enablePromiseRejectionTracker({
        allRejections: true,
        onUnhandled,
        onHandled: () => {},
      });
      return;
    }

    try {
      // Non-Hermes fallback (JSC). RN enables this itself in development with
      // its own warning handler; in release nothing tracks rejections.
      const tracking = require('promise/setimmediate/rejection-tracking');
      tracking.enable({allRejections: true, onUnhandled, onHandled: () => {}});
    } catch {
      // Polyfill moved — rejections stay silent, which is no worse than before.
    }
  }
}
