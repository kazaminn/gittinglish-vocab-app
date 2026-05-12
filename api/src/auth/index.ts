// Better Auth 初期化。Phase C (この PR) で導入。
// - emailAndPassword: enabled (verification なし、reset なし)
// - username plugin: ID + Password 認証の中核
// - email は表向き保存しない: Better Auth 必須の `user.email` には dummy (`${username}@local.invalid`) を入れる
// - OAuth (Phase D) で取得した email は HMAC_SHA256 で hash 化して `user.emailHash` に保存
//
// 必要な環境変数:
//   BETTER_AUTH_URL       例: https://gittinglish.kazamitte.com
//   BETTER_AUTH_SECRET    openssl rand -base64 32 で生成
//   EMAIL_HASH_SECRET     openssl rand -base64 32 で生成（OAuth Phase D で必須）
//   GOOGLE_CLIENT_ID      Phase D で必須
//   GOOGLE_CLIENT_SECRET  Phase D で必須
//   GITHUB_CLIENT_ID      Phase D で必須
//   GITHUB_CLIENT_SECRET  Phase D で必須
import { createHmac } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import * as authSchema from '../db/auth-schema.js';
import { db } from '../db/client.js';

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001';
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

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [BETTER_AUTH_URL],

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
          // OAuth 経由で実 email が来た場合: emailHash を立てて email を dummy 化
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
