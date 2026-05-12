import { createHmac } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
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
            const usernameOrId = incoming.username ?? incoming.id ?? 'user';
            return {
              data: {
                ...incoming,
                emailHash: hashEmail(email),
                email: `${usernameOrId}@local.invalid`,
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
