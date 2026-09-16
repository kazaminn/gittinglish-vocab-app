import { createHmac, randomUUID } from 'node:crypto';
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
const EMAIL_HASH_SECRET =
  process.env.EMAIL_HASH_SECRET ?? 'dev-email-hash-secret-do-not-use-in-prod';

export function hashEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHmac('sha256', EMAIL_HASH_SECRET)
    .update(normalized)
    .digest('hex');
}

const hasGoogle =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const hasGithub =
  !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

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
                scopes: ['openid', 'profile', 'email'],
                pkce: true,
                // kazamitte-auth registers clients as client_secret_basic and
                // rejects credentials in the body, which is what this plugin
                // sends by default.
                authentication: 'basic',
              },
            ],
          }),
        ]
      : []),
  ],

  socialProviders: {
    ...(hasGoogle && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }),
    ...(hasGithub && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    }),
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github'],
      // Every user.email is rewritten to <username>@local.invalid below, so it
      // can never equal the real address kazamitte-auth returns. Linking is
      // therefore always explicit (POST /oauth2/link from a signed-in
      // session), and that endpoint refuses a mismatched address unless this
      // is set. Being signed in is what proves the local account is the
      // user's; kazamitte stays out of trustedProviders so no link is ever
      // made implicitly on sign-in.
      allowDifferentEmails: true,
    },
  },

  user: {
    additionalFields: {
      emailHash: { type: 'string', required: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (rawUser) => {
          // Real emails from OAuth are never stored: hash them into emailHash
          // and replace user.email with a dummy so plaintext doesn't persist.
          const incoming = rawUser as Record<string, unknown> & {
            email?: string;
            username?: string;
            id?: string;
          };
          const email =
            typeof incoming.email === 'string' ? incoming.email : '';
          if (email && !email.endsWith('@local.invalid')) {
            // Only SSO reaches here — password signup already submits a
            // @local.invalid address. Those users have no username, and the
            // id is assigned after this hook, so the placeholder has to carry
            // its own uniqueness or every SSO user would collide on the
            // unique email column.
            const localPart = incoming.username ?? randomUUID();
            return {
              data: {
                ...incoming,
                emailHash: hashEmail(email),
                email: `${localPart}@local.invalid`,
                // The provider also hands over the account's display name and
                // avatar URL. Neither is needed to run a drill and both
                // identify the person, so they are dropped on the same
                // principle as the address. The user picks a name at setup.
                name: localPart,
                image: null,
              },
            };
          }
          return { data: incoming };
        },
      },
    },
  },
});

export type Auth = typeof auth;
