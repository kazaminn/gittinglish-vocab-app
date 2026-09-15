// baseURL is omitted on purpose: the SPA and the API are served from the
// same origin, so a relative path is what we want.
import { genericOAuthClient, usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  plugins: [usernameClient(), genericOAuthClient()],
  fetchOptions: {
    credentials: 'include',
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;
