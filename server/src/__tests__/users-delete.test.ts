import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as schema from '../db/schema.js';

const tmpDir = mkdtempSync(join(tmpdir(), 'gittinglish-users-delete-test-'));
const dbPath = join(tmpDir, 'test.db');
const testClient = createClient({ url: `file:${dbPath}` });
const testDb = drizzle(testClient, { schema });

// Importing app.js pulls in the real auth module, which would otherwise open
// ./local.db on disk. This route needs real tables (user, session, account
// and the four app tables) to prove all of them are cleared, so a temp file
// db is used instead of :memory:, matching api.test.ts.
vi.mock('../db/client.js', () => ({
  db: testDb,
}));

const mockGetSession = vi.fn();
const mockSignOut = vi.fn();

// The route under test calls auth.api.signOut directly to clear the session
// cookie, and authMiddleware calls auth.api.getSession — both come from this
// same module, so mocking it here controls both the session gate and the
// route's own call.
vi.mock('../auth/index.js', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
      signOut: mockSignOut,
    },
    handler: vi.fn(),
  },
}));

const { default: app } = await import('../app.js');

async function createTables() {
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    username TEXT UNIQUE,
    display_username TEXT
  )`);
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
  )`);
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at INTEGER,
    refresh_token_expires_at INTEGER,
    scope TEXT,
    password TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS session_writes (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    written_at INTEGER NOT NULL
  )`);
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS drill_progress (
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    drill_mode TEXT NOT NULL,
    ease REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 1,
    next_review INTEGER NOT NULL,
    reps INTEGER DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, item_id, drill_mode)
  )`);
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS answer_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    drill_mode TEXT NOT NULL,
    answer TEXT,
    is_correct INTEGER NOT NULL,
    quality INTEGER NOT NULL,
    answered_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS user_activities (
    user_id TEXT NOT NULL,
    activity_date TEXT NOT NULL,
    items_reviewed INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, activity_date)
  )`);
}

async function clearTables() {
  await testDb.run(sql`DELETE FROM answer_logs`);
  await testDb.run(sql`DELETE FROM user_activities`);
  await testDb.run(sql`DELETE FROM drill_progress`);
  await testDb.run(sql`DELETE FROM session_writes`);
  await testDb.run(sql`DELETE FROM account`);
  await testDb.run(sql`DELETE FROM session`);
  await testDb.run(sql`DELETE FROM user`);
}

async function seedUser(userId: string, username: string) {
  await testDb.run(
    sql`INSERT INTO user (id, name, email, username) VALUES (${userId}, ${'Someone'}, ${`${userId}@example.com`}, ${username})`
  );
  await testDb.run(
    sql`INSERT INTO session_writes (session_id, user_id, written_at) VALUES (${`sw-${userId}`}, ${userId}, ${1})`
  );
  await testDb.run(
    sql`INSERT INTO drill_progress (user_id, item_id, drill_mode, next_review) VALUES (${userId}, ${'item-1'}, ${'word_to_meaning'}, ${1})`
  );
  await testDb.run(
    sql`INSERT INTO answer_logs (user_id, session_id, item_id, drill_mode, is_correct, quality) VALUES (${userId}, ${`sw-${userId}`}, ${'item-1'}, ${'word_to_meaning'}, ${1}, ${4})`
  );
  await testDb.run(
    sql`INSERT INTO user_activities (user_id, activity_date, items_reviewed, correct_count) VALUES (${userId}, ${'2026-01-01'}, ${1}, ${1})`
  );
}

async function countRowsForUser(userId: string) {
  const [users, sessionWrites, drillProgress, answerLogs, userActivities] =
    await Promise.all([
      testDb
        .select()
        .from(schema.user)
        .where(sql`id = ${userId}`),
      testDb
        .select()
        .from(schema.sessionWrites)
        .where(sql`user_id = ${userId}`),
      testDb
        .select()
        .from(schema.drillProgress)
        .where(sql`user_id = ${userId}`),
      testDb
        .select()
        .from(schema.answerLogs)
        .where(sql`user_id = ${userId}`),
      testDb
        .select()
        .from(schema.userActivities)
        .where(sql`user_id = ${userId}`),
    ]);

  return {
    users: users.length,
    sessionWrites: sessionWrites.length,
    drillProgress: drillProgress.length,
    answerLogs: answerLogs.length,
    userActivities: userActivities.length,
  };
}

function req(body?: unknown) {
  return app.request('http://localhost/api/users/me', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('DELETE /api/users/me', () => {
  beforeAll(async () => {
    await createTables();
  });

  beforeEach(async () => {
    mockGetSession.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue({
      headers: new Headers(),
      response: { success: true },
    });
    await clearTables();
  });

  it('rejects an unauthenticated request', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await req({ confirmUsername: 'alice' });

    expect(response.status).toBe(401);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('UNAUTHORIZED');
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirmation and deletes nothing', async () => {
    await seedUser('user-1', 'alice');
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', username: 'alice' },
    });

    const response = await req({ confirmUsername: 'not-alice' });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('CONFIRMATION_MISMATCH');
    expect(mockSignOut).not.toHaveBeenCalled();

    const counts = await countRowsForUser('user-1');
    expect(counts).toEqual({
      users: 1,
      sessionWrites: 1,
      drillProgress: 1,
      answerLogs: 1,
      userActivities: 1,
    });
  });

  it('deletes the user and all four app tables on a matching confirmation', async () => {
    await seedUser('user-1', 'alice');
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', username: 'alice' },
    });

    const response = await req({ confirmUsername: 'alice' });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.success).toBe(true);

    const counts = await countRowsForUser('user-1');
    expect(counts).toEqual({
      users: 0,
      sessionWrites: 0,
      drillProgress: 0,
      answerLogs: 0,
      userActivities: 0,
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    const call = mockSignOut.mock.calls[0]![0];
    expect(call.headers).toBeInstanceOf(Headers);
    expect(call.returnHeaders).toBe(true);
  });

  it('does not delete a different user sharing the app tables', async () => {
    await seedUser('user-1', 'alice');
    await seedUser('user-2', 'bob');
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', username: 'alice' },
    });

    const response = await req({ confirmUsername: 'alice' });

    expect(response.status).toBe(200);
    const counts = await countRowsForUser('user-2');
    expect(counts).toEqual({
      users: 1,
      sessionWrites: 1,
      drillProgress: 1,
      answerLogs: 1,
      userActivities: 1,
    });
  });
});
