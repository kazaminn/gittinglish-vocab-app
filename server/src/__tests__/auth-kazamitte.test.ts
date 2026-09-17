import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as schema from '../db/schema.js';

// Importing the auth module pulls in the real client, which would otherwise
// open ./local.db on disk. Nothing here queries, so memory is enough.
vi.mock('../db/client.js', () => ({
  db: drizzle(createClient({ url: ':memory:' }), { schema }),
}));

/**
 * The auth instance reads process.env at module load, so each case sets the
 * environment it wants and imports a fresh copy.
 */
async function loadAuth(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return (await import('../auth/index.js')).auth;
}

const KAZAMITTE_ENV = {
  KAZAMITTE_AUTH_CLIENT_ID: 'test-client-id',
  KAZAMITTE_AUTH_CLIENT_SECRET: 'test-client-secret',
  KAZAMITTE_AUTH_ISSUER: undefined,
};

describe('kazamitte SSO wiring', () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it('registers the generic-oauth endpoints when credentials are present', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);

    expect(auth.api.signInWithOAuth2).toBeTypeOf('function');
    expect(auth.api.oAuth2LinkAccount).toBeTypeOf('function');
    expect(auth.api.oAuth2Callback).toBeTypeOf('function');
  });

  it('stays off when credentials are absent, so a misconfigured deploy cannot half-enable it', async () => {
    const auth = await loadAuth({
      KAZAMITTE_AUTH_CLIENT_ID: undefined,
      KAZAMITTE_AUTH_CLIENT_SECRET: undefined,
    });

    expect(auth.api.signInWithOAuth2).toBeUndefined();
  });

  it('discovers endpoints from the issuer instead of hardcoding them', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);

    const plugin = auth.options.plugins?.find((p) => p.id === 'generic-oauth');
    const config = (
      plugin as unknown as {
        options: { config: Record<string, unknown>[] };
      }
    ).options.config[0]!;

    expect(config.providerId).toBe('kazamitte');
    expect(config.issuer).toBe('https://auth.kazamitte.com/api/auth');
    expect(config.discoveryUrl).toBe(
      'https://auth.kazamitte.com/api/auth/.well-known/openid-configuration'
    );
    expect(config.requireIssuerValidation).toBe(true);
    // kazamitte-auth registers clients as client_secret_basic and rejects
    // credentials sent in the body, which is this plugin's default.
    expect(config.authentication).toBe('basic');
    // kazamitte-auth rejects a plain code challenge.
    expect(config.pkce).toBe(true);
    // Only the identity itself is requested — email/profile claims would
    // just be discarded by mapProfileToUser below.
    expect(config.scopes).toEqual(['openid']);
  });

  it('never links implicitly: no provider is trusted', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const linking = auth.options.account?.accountLinking as
      | { trustedProviders?: string[]; allowDifferentEmails?: boolean }
      | undefined;

    // Better Auth reads an unset trustedProviders as an empty list, so an
    // absent key and an empty one mean the same thing: nothing is linked
    // without the user asking for it from a signed-in session.
    expect(linking?.trustedProviders ?? []).toEqual([]);
    // Required because a linked user's stored email is always a dummy.
    expect(linking?.allowDifferentEmails).toBe(true);
  });

  it('configures no social providers of its own', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);

    // Google and GitHub sign-in belongs to Kazamitte ID, one hop upstream.
    // Configuring them here too would bypass the generic-oauth mapping that
    // keeps the real name, email and avatar out of this database.
    // Cast because the inferred options type has no such key today — which
    // is itself the stronger guarantee. The assertion is what catches it
    // being added back.
    const options = auth.options as {
      socialProviders?: Record<string, unknown>;
    };
    expect(options.socialProviders ?? {}).toEqual({});
  });

  it('synthesizes a placeholder email and name from just the subject', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const plugin = auth.options.plugins?.find((p) => p.id === 'generic-oauth');
    const config = (
      plugin as unknown as {
        options: {
          config: {
            mapProfileToUser: (profile: Record<string, unknown>) => {
              email?: string;
              name?: string;
            };
          }[];
        };
      }
    ).options.config[0]!;

    // Only `openid` is requested (asserted above), so UserInfo carries
    // nothing but the subject — no real email or name is ever available
    // here. generic-oauth's callback rejects a missing email or name
    // regardless of scope, so both must be present without one.
    const mapped = config.mapProfileToUser({ id: 'kazamitte-user-1' });

    expect(mapped.email).toBe('kazamitte-user-1@local.invalid');
    expect(mapped.name).toBeTruthy();
  });

  it('refuses to derive an identity when the subject is missing', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const plugin = auth.options.plugins?.find((p) => p.id === 'generic-oauth');
    const config = (
      plugin as unknown as {
        options: {
          config: {
            mapProfileToUser: (profile: Record<string, unknown>) => unknown;
          }[];
        };
      }
    ).options.config[0]!;

    // generic-oauth defaults a missing `sub` to "" and writes it as the
    // accountId without complaint, so two subject-less sign-ins would land
    // on the same account row. Neither shape may produce a usable identity.
    expect(() => config.mapProfileToUser({})).toThrow();
    expect(() => config.mapProfileToUser({ id: '' })).toThrow();
  });

  it('gives each SSO user a distinct placeholder address', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const plugin = auth.options.plugins?.find((p) => p.id === 'generic-oauth');
    const config = (
      plugin as unknown as {
        options: {
          config: {
            mapProfileToUser: (profile: Record<string, unknown>) => {
              email?: string;
            };
          }[];
        };
      }
    ).options.config[0]!;

    expect(config.mapProfileToUser({ id: 'user-one' }).email).not.toBe(
      config.mapProfileToUser({ id: 'user-two' }).email
    );
  });

  it('keeps the provider avatar out of the database', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const before = auth.options.databaseHooks?.user?.create?.before;

    const result = await before!({
      name: 'kazamitte-user-1',
      email: 'kazamitte-user-1@local.invalid',
      image: 'https://lh3.googleusercontent.com/a/some-avatar-id',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Parameters<typeof before>[0]);

    const data = (result as { data: Record<string, unknown> }).data;
    expect(data.image).toBeNull();
    expect(JSON.stringify(data)).not.toContain('googleusercontent');
  });

  it('refuses to create a user carrying a real, non-placeholder email', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const before = auth.options.databaseHooks?.user?.create?.before;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await before!({
      name: 'Someone',
      email: 'person@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Parameters<typeof before>[0]);

    expect(result).toBe(false);
    errorSpy.mockRestore();
  });

  it('blanks OAuth tokens before an account row is created', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const before = auth.options.databaseHooks?.account?.create?.before;

    const result = await before!({
      id: 'account-1',
      accountId: 'kazamitte-user-1',
      providerId: 'kazamitte',
      userId: 'user-1',
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
      idToken: 'id-token-secret',
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
      scope: 'openid',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Parameters<typeof before>[0]);

    const data = (result as { data: Record<string, unknown> }).data;
    expect(data.accessToken).toBeNull();
    expect(data.refreshToken).toBeNull();
    expect(data.idToken).toBeNull();
    expect(data.accessTokenExpiresAt).toBeNull();
    expect(data.refreshTokenExpiresAt).toBeNull();
    // Non-token fields pass through untouched.
    expect(data.scope).toBe('openid');
  });

  it('blanks OAuth tokens before an account row is updated on re-sign-in', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const before = auth.options.databaseHooks?.account?.update?.before;

    const result = await before!({
      accessToken: 'new-access-secret',
      refreshToken: 'new-refresh-secret',
      idToken: 'new-id-token-secret',
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
      scope: 'openid',
    } as Parameters<typeof before>[0]);

    const data = (result as { data: Record<string, unknown> }).data;
    expect(data.accessToken).toBeNull();
    expect(data.refreshToken).toBeNull();
    expect(data.idToken).toBeNull();
    expect(data.accessTokenExpiresAt).toBeNull();
    expect(data.refreshTokenExpiresAt).toBeNull();
  });
});
