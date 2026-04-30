// Better Auth `useSession` をラップして既存コンポーネントに薄いインタフェースを提供する。
// 旧 Firebase 用の signInAsGuest / signInWithGoogle は廃止。
// サインインは Signup/Login ページから authClient を直接呼ぶ方針。

import { useCallback } from 'react';
import { authClient, useSession } from '../lib/auth-client.js';

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

  const sessionUser = data?.user;
  const user: AuthUser | undefined = sessionUser
    ? {
        id: sessionUser.id,
        displayName: sessionUser.name ?? sessionUser.username ?? 'User',
        username: sessionUser.username ?? undefined,
      }
    : undefined;

  const signOut = useCallback(async () => {
    await authClient.signOut();
  }, []);

  return {
    isLoading: isPending,
    user,
    signOut,
  };
}
