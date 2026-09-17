import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth, username } from 'better-auth/plugins';
import * as authSchema from '../db/auth-schema.js';
import { db } from '../db/client.js';

// Vercel auto-injects the host (no protocol) per deployment, but the prod
// custom domain is never present in env — that one must be set explicitly.
const vercelHost = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
const vercelURL = vercelHost ? `https://${vercelHost}` : undefined;
const BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ?? vercelURL ?? 'http://localhost:3001';
const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? 'dev-secret-do-not-use-in-prod';

// kazamitte-auth is the shared SSO provider for kazamitte apps. Endpoints are
// discovered from the issuer rather than hardcoded, so a provider-side path
// change doesn't need a release here.
const KAZAMITTE_ISSUER =
  process.env.KAZAMITTE_AUTH_ISSUER ?? 'https://auth.kazamitte.com/api/auth';
const hasKazamitte =
  !!process.env.KAZAMITTE_AUTH_CLIENT_ID &&
  !!process.env.KAZAMITTE_AUTH_CLIENT_SECRET;

// Preview deployments send Origin as *.vercel.app, so accept the Vercel host
// in addition to the production domain.
const trustedOrigins = Array.from(
  new Set([BETTER_AUTH_URL, vercelURL].filter((v): v is string => !!v))
);

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins,

  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 32,
    }),
    ...(hasKazamitte
      ? [
          genericOAuth({
            config: [
              {
                providerId: 'kazamitte',
                discoveryUrl: `${KAZAMITTE_ISSUER}/.well-known/openid-configuration`,
                issuer: KAZAMITTE_ISSUER,
                requireIssuerValidation: true,
                clientId: process.env.KAZAMITTE_AUTH_CLIENT_ID!,
                clientSecret: process.env.KAZAMITTE_AUTH_CLIENT_SECRET!,
                // kazamitte-auth never puts email/profile claims in the ID
                // token or hands them back in a way this app would keep (see
                // mapProfileToUser below), so there is no reason to ask for
                // more than the identity itself.
                scopes: ['openid'],
                pkce: true,
                // kazamitte-auth registers clients as client_secret_basic and
                // rejects credentials in the body, which is what this plugin
                // sends by default.
                authentication: 'basic',
                // With only `openid` requested, UserInfo returns just the
                // subject. Better Auth still insists on an email and a name
                // to create a user (generic-oauth's callback rejects a
                // missing one of either), so synthesize both from the
                // subject instead of asking the provider for real ones we'd
                // only have to throw away. `profile.id` is generic-oauth's
                // own normalization of the UserInfo `sub` claim and is
                // always a string (falls back to "" rather than undefined);
                // `profile.sub` is the same value from the raw spread but
                // isn't guaranteed present on the type, so `id` is the safer
                // read.
                mapProfileToUser: (profile: Record<string, unknown>) => {
                  const id = String(profile.id ?? '');
                  // generic-oauth defaults the subject to "" when UserInfo
                  // carries none, and nothing downstream rejects that: the
                  // empty string would be written as this account's
                  // accountId, so the next subject-less sign-in would match
                  // that row and be let in as the first user. Fail closed —
                  // an error here is a failed login, which is recoverable.
                  if (!id) {
                    throw new Error(
                      'kazamitte: user info carried no subject; refusing to derive an identity'
                    );
                  }
                  return {
                    email: `${id}@local.invalid`,
                    name: id,
                  };
                },
              },
            ],
          }),
        ]
      : []),
  ],

  // No social providers. Google and GitHub sign-in belongs to Kazamitte ID,
  // one hop upstream; configuring them here as well would have this app
  // talking to them directly and receiving the real name, email and avatar
  // that everything below exists to avoid.

  account: {
    accountLinking: {
      enabled: true,
      // trustedProviders is left unset, which Better Auth reads as an empty
      // list, so no provider is ever linked implicitly on sign-in.
      //
      // user.email is always a synthesized <local-part>@local.invalid (see
      // the SSO mapProfileToUser above and the password signup form), so it
      // can never equal the real address a provider returns. Linking is
      // therefore always explicit (POST /oauth2/link from a signed-in
      // session), and that endpoint refuses a mismatched address unless this
      // is set. Being signed in is what proves the local account is the
      // user's.
      allowDifferentEmails: true,
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (rawUser) => {
          const incoming = rawUser as Record<string, unknown> & {
            email?: string;
          };
          const email =
            typeof incoming.email === 'string' ? incoming.email : '';
          // Every path that reaches here is expected to already carry a
          // synthesized placeholder: password signup submits
          // <username>@local.invalid directly, and kazamitte SSO's
          // mapProfileToUser (above) builds <subject>@local.invalid from the
          // subject alone. This branch is therefore unreachable today — it
          // exists so that a future `profile`/`email` scope, or a second
          // provider, can't slip a real address past this hook without
          // someone deliberately adding its own privacy transform first.
          if (email && !email.endsWith('@local.invalid')) {
            console.error(
              'auth: refusing to create a user with a non-placeholder email; the provider path needs its own privacy transform'
            );
            return false;
          }
          return {
            data: {
              ...incoming,
              // Only an OAuth provider ever hands over an avatar URL, and
              // nothing in this app displays one. Dropping it unconditionally
              // here — rather than only when rewriting a real email — means a
              // future `profile` scope or provider can't reintroduce one
              // without a deliberate change to this hook.
              image: null,
            },
          };
        },
      },
    },

    // kazamitte-auth's tokens are never used after sign-in — this app only
    // asks "who is this", never "act on their behalf" — so persisting them
    // is pure liability. Blank them at the hook rather than via
    // account.updateAccountOnSignIn: false, which would also stop `scope`
    // and any other useful field from refreshing on re-sign-in and would
    // leave whatever was already written in place.
    account: {
      create: {
        before: async (rawAccount) => ({
          data: {
            ...rawAccount,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
          },
        }),
      },
      update: {
        before: async (rawAccount) => ({
          data: {
            ...rawAccount,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
          },
        }),
      },
    },
  },
});

export type Auth = typeof auth;
