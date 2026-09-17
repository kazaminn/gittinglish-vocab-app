import { createClient } from '@libsql/client';
import { APIError } from 'better-auth';
import { drizzle } from 'drizzle-orm/libsql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as schema from '../db/schema.js';

// Importing app.js pulls in the real auth module, which would otherwise open
// ./local.db on disk. Nothing here queries it, so memory is enough.
vi.mock('../db/client.js', () => ({
  db: drizzle(createClient({ url: ':memory:' }), { schema }),
}));

const mockGetSession = vi.fn();
const mockSetPassword = vi.fn();

// The route under test calls auth.api.setPassword directly (Better Auth
// never mounts it over HTTP on this version), and authMiddleware calls
// auth.api.getSession — both come from this same module, so mocking it here
// controls both the session gate and the route's own call.
vi.mock('../auth/index.js', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
      setPassword: mockSetPassword,
    },
    handler: vi.fn(),
  },
}));

const { default: app } = await import('../app.js');

function req(body?: unknown) {
  return app.request('http://localhost/api/users/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('POST /api/users/password', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockSetPassword.mockReset();
  });

  it('rejects an unauthenticated request', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await req({ newPassword: 'password123' });

    expect(response.status).toBe(401);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('UNAUTHORIZED');
    expect(mockSetPassword).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 8 characters', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await req({ newPassword: 'short1' });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('INVALID_REQUEST');
    expect(mockSetPassword).not.toHaveBeenCalled();
  });

  it('sets the password for a signed-in user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockSetPassword.mockResolvedValue({ status: true });

    const response = await req({ newPassword: 'password123' });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.success).toBe(true);

    expect(mockSetPassword).toHaveBeenCalledTimes(1);
    const call = mockSetPassword.mock.calls[0]![0];
    expect(call.body).toEqual({ newPassword: 'password123' });
    // The caller's identity must come from the forwarded session, never from
    // the request body.
    expect(call.headers).toBeInstanceOf(Headers);
  });

  it('maps PASSWORD_ALREADY_SET to a non-500 error the client can branch on', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockSetPassword.mockRejectedValue(
      new APIError('BAD_REQUEST', {
        message: 'User already has a password set',
        code: 'PASSWORD_ALREADY_SET',
      })
    );

    const response = await req({ newPassword: 'password123' });

    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('PASSWORD_ALREADY_SET');
  });
});
