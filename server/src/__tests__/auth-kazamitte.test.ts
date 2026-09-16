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
    // kazamitte-auth rejects a plain code challenge.
    expect(config.pkce).toBe(true);
    expect(config.scopes).toEqual(['openid', 'profile', 'email']);
  });

  it('never links implicitly: kazamitte is not a trusted provider', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const linking = auth.options.account?.accountLinking;

    expect(linking?.trustedProviders).not.toContain('kazamitte');
    // Required because a linked user's stored email is always a dummy.
    expect(linking?.allowDifferentEmails).toBe(true);
  });

  it('keeps the real address out of the database for SSO-created users', async () => {
    const auth = await loadAuth(KAZAMITTE_ENV);
    const before = auth.options.databaseHooks?.user?.create?.before;

    const result = await before!({
      id: 'user-1',
      name: 'Someone',
      email: 'Person@Example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const data = (result as { data: Record<string, unknown> }).data;
    expect(data.email).toBe('user-1@local.invalid');
    expect(data.emailHash).toEqual(expect.stringMatching(/^[0-9a-f]{64}$/));
    expect(JSON.stringify(data)).not.toContain('Person@Example.com');
  });
});
