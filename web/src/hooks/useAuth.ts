import { useCallback } from 'react';
import { authClient, useSession } from '../lib/auth-client.js';
import { isDevAuthSkipActive, TEST_USER } from '../lib/dev-auth.js';

export interface AuthUser {
  id: string;
  displayName: string;
  username: string | undefined;
}

export interface UseAuthResult {
  isLoading: boolean;
  user: AuthUser | undefined;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const { data, isPending } = useSession();
  const skipActive = isDevAuthSkipActive();

  const sessionUser = data?.user;
  const user: AuthUser | undefined = skipActive
    ? TEST_USER
    : sessionUser
      ? {
          id: sessionUser.id,
          displayName: sessionUser.name ?? sessionUser.username ?? 'User',
          username: sessionUser.username ?? undefined,
        }
      : undefined;

  const signOut = useCallback(async () => {
    if (skipActive) return;
    await authClient.signOut();
  }, [skipActive]);

  return {
    isLoading: skipActive ? false : isPending,
    user,
    signOut,
  };
}
