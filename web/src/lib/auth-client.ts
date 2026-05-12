// Better Auth クライアント。同一 origin 配信を前提に baseURL は省略。
// fetch 全てに `credentials: 'include'` を付与し、cookie session を自動送受信する。
import { usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  plugins: [usernameClient()],
  fetchOptions: {
    credentials: 'include',
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;
