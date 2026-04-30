// Phase A: Firebase 削除済み。Phase C で Better Auth (username plugin) ベースに置換予定。
// 現状はダミー実装で「常にローカルユーザーとしてログイン済み」とする。

import { useCallback, useSyncExternalStore } from 'react';

export interface AuthUser {
  id: string;
  displayName: string;
}

interface AuthSnapshot {
  isLoading: boolean;
  user: AuthUser | undefined;
}

interface UseAuthResult extends AuthSnapshot {
  signInAsGuest: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FALLBACK_USER: AuthUser = {
  id: 'local-user',
  displayName: 'Local User',
};

let authSnapshot: AuthSnapshot = {
  isLoading: false,
  user: FALLBACK_USER,
};

const listeners = new Set<() => void>();

function emitAuthSnapshot(nextSnapshot: AuthSnapshot) {
  authSnapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return authSnapshot;
}

export function useAuth(): UseAuthResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const signInAsGuest = useCallback(async () => {
    emitAuthSnapshot({ isLoading: false, user: FALLBACK_USER });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    emitAuthSnapshot({
      isLoading: false,
      user: { id: 'local-google-user', displayName: 'Google User' },
    });
  }, []);

  const signOut = useCallback(async () => {
    emitAuthSnapshot({ isLoading: false, user: undefined });
  }, []);

  return {
    ...snapshot,
    signInAsGuest,
    signInWithGoogle,
    signOut,
  };
}
