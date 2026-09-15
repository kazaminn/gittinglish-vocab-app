import { beforeEach, describe, expect, it } from 'vitest';
import { authClient } from '../../src/lib/auth-client';

/**
 * kazamitte-auth matches the redirect URI exactly, and that URI is derived from
 * the path the generic-oauth plugin serves its callback on. These pin the
 * request paths so an upgrade that moves them (1.7 folds them into
 * /sign-in/social and /callback/:id) fails here rather than in production with
 * a rejected authorization request.
 */
describe('auth client oauth contract', () => {
  let calls: { pathname: string; method: string }[];

  // Injected per call: the client resolves globalThis.fetch when it is created,
  // so stubbing the global after import would not be picked up.
  const customFetchImpl = (
    input: string | URL | Request,
    init?: RequestInit
  ) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    calls.push({
      pathname: new URL(url).pathname,
      method: init?.method ?? 'GET',
    });
    return Promise.resolve(
      new Response('[]', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
  };

  beforeEach(() => {
    calls = [];
  });

  it('signs in through the generic-oauth endpoint', async () => {
    await authClient.signIn.oauth2({
      providerId: 'kazamitte',
      callbackURL: '/app',
      errorCallbackURL: '/login?error=oauth',
      fetchOptions: { customFetchImpl },
    });

    expect(calls).toEqual([
      { pathname: '/api/auth/sign-in/oauth2', method: 'POST' },
    ]);
  });

  it('links an account through the generic-oauth link endpoint', async () => {
    await authClient.oauth2.link({
      providerId: 'kazamitte',
      callbackURL: '/app/settings',
      errorCallbackURL: '/app/settings?error=link',
      fetchOptions: { customFetchImpl },
    });

    expect(calls).toEqual([
      { pathname: '/api/auth/oauth2/link', method: 'POST' },
    ]);
  });

  it('lists linked accounts', async () => {
    await authClient.listAccounts({ fetchOptions: { customFetchImpl } });

    expect(calls).toEqual([
      { pathname: '/api/auth/list-accounts', method: 'GET' },
    ]);
  });
});
