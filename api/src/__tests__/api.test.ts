import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as schema from '../db/schema.js';

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set('userId', 'test-user-1');
    c.set('userEmail', 'test@example.com');
    c.set('userDisplayName', 'Test User');
    await next();
  }),
}));

const tmpDir = mkdtempSync(join(tmpdir(), 'gittinglish-api-test-'));
const dbPath = join(tmpDir, 'test.db');
const testClient = createClient({ url: `file:${dbPath}` });
const testDb = drizzle(testClient, { schema });

vi.mock('../db/client.js', () => ({
  db: testDb,
}));

const { default: app } = await import('../app.js');
const { getProblemsForQuery } = await import('../data/problem-loader.js');

const wordToMeaningProblem = getProblemsForQuery({
  dataset: 'gitverbs85',
  drillMode: 'word_to_meaning',
})[0]!;
const wordInputProblem = getProblemsForQuery({
  dataset: 'gitverbs85',
  drillMode: 'word_input',
})[0]!;

async function createTables() {
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    display_name TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
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
  await testDb.run(
    sql`CREATE INDEX IF NOT EXISTS idx_user_activities_user_date ON user_activities(user_id, activity_date)`
  );
  await testDb.run(
    sql`CREATE INDEX IF NOT EXISTS idx_progress_review ON drill_progress(user_id, drill_mode, next_review)`
  );
  await testDb.run(
    sql`CREATE INDEX IF NOT EXISTS idx_answer_logs_session ON answer_logs(session_id)`
  );
}

async function clearTables() {
  await testDb.run(sql`DROP TABLE IF EXISTS answer_logs`);
  await testDb.run(sql`DROP TABLE IF EXISTS user_activities`);
  await testDb.run(sql`DROP TABLE IF EXISTS drill_progress`);
  await testDb.run(sql`DROP TABLE IF EXISTS session_writes`);
  await testDb.run(sql`DROP TABLE IF EXISTS users`);
  await createTables();
}

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer fake-token',
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return app.request(`http://localhost/api${path}`, init);
}

describe('Phase 3 API', () => {
  beforeAll(async () => {
    await createTables();
  });

  beforeEach(async () => {
    await clearTables();
  });

  it('starts a drill session with DTO items', async () => {
    const response = await req('POST', '/sessions/start', {
      dataset: 'gitverbs85',
      drillMode: 'word_to_meaning',
      count: 5,
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.sessionId).toBeTruthy();
    expect(payload.data.startedAt).toBeTypeOf('number');
    expect(payload.data.items).toHaveLength(5);
    expect(payload.data.items[0].problemDTO.id).toBeTruthy();
    expect(payload.data.items[0].problemDTO.payload.choiceAnswerSpec?.correctChoiceIds).toBeUndefined();
  });

  it('judges answers by drillMode', async () => {
    if (!('choiceAnswerSpec' in wordToMeaningProblem)) {
      throw new Error('invalid select fixture');
    }
    if (!('answerSpec' in wordInputProblem)) {
      throw new Error('invalid input fixture');
    }

    const selectResponse = await req('POST', '/answers/judge', {
      itemId: wordToMeaningProblem.id,
      drillMode: wordToMeaningProblem.drillMode,
      answer: wordToMeaningProblem.choiceAnswerSpec.correctChoiceIds[0],
    });
    const selectPayload = await selectResponse.json();
    expect(selectPayload.data.isCorrect).toBe(true);

    const inputResponse = await req('POST', '/answers/judge', {
      itemId: wordInputProblem.id,
      drillMode: wordInputProblem.drillMode,
      answer: `${wordInputProblem.answerSpec.answers[0]}.`,
    });
    const inputPayload = await inputResponse.json();
    expect(inputPayload.data.isCorrect).toBe(true);
  });

  it('rejects invalid session start requests', async () => {
    const response = await req('POST', '/sessions/start', {
      dataset: 'gitverbs85',
      drillMode: 'flashcard',
      count: 0,
    });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects malformed json bodies', async () => {
    const response = await app.request('http://localhost/api/answers/judge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-token',
      },
      body: '{"itemId"',
    });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('INVALID_JSON');
  });

  it('writes session results and updates stats', async () => {
    if (!('choiceAnswerSpec' in wordToMeaningProblem)) {
      throw new Error('invalid fixture');
    }

    const startedAt = Date.now() - 5_000;
    const completedAt = Date.now();
    const response = await req('POST', '/sessions/end', {
      sessionId: 'session-1',
      startedAt,
      completedAt,
      answers: [
        {
          itemId: wordToMeaningProblem.id,
          drillMode: wordToMeaningProblem.drillMode,
          answer: wordToMeaningProblem.choiceAnswerSpec.correctChoiceIds[0],
          answeredAt: completedAt - 1_000,
        },
      ],
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.accepted).toBe(1);
    expect(payload.data.results[0].isCorrect).toBe(true);

    const progressRows = await testDb.select().from(schema.drillProgress);
    expect(progressRows).toHaveLength(1);
    expect(progressRows[0]?.drillMode).toBe(wordToMeaningProblem.drillMode);

    const statsResponse = await req('GET', '/users/me/stats');
    const statsPayload = await statsResponse.json();
    expect(statsPayload.data.totalReviewed).toBe(1);
    expect(statsPayload.data.totalCorrect).toBe(1);

    const activityRows = await testDb.select().from(schema.userActivities);
    expect(activityRows).toHaveLength(1);
    expect(activityRows[0]?.itemsReviewed).toBe(1);
    expect(activityRows[0]?.correctCount).toBe(1);
  });

  it('rejects duplicate session writes', async () => {
    if (!('choiceAnswerSpec' in wordToMeaningProblem)) {
      throw new Error('invalid fixture');
    }

    const body = {
      sessionId: 'session-dup',
      startedAt: Date.now() - 5_000,
      completedAt: Date.now(),
      answers: [
        {
          itemId: wordToMeaningProblem.id,
          drillMode: wordToMeaningProblem.drillMode,
          answer: wordToMeaningProblem.choiceAnswerSpec.correctChoiceIds[0],
          answeredAt: Date.now() - 1_000,
        },
      ],
    };

    const first = await req('POST', '/sessions/end', body);
    expect(first.status).toBe(200);

    const second = await req('POST', '/sessions/end', body);
    expect(second.status).toBe(409);
    const payload = await second.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('DUPLICATE_SESSION');
  });

  it('rejects out-of-range answer timestamps', async () => {
    if (!('choiceAnswerSpec' in wordToMeaningProblem)) {
      throw new Error('invalid fixture');
    }

    const startedAt = Date.now() - 5_000;
    const completedAt = Date.now();
    const response = await req('POST', '/sessions/end', {
      sessionId: 'session-invalid-time',
      startedAt,
      completedAt,
      answers: [
        {
          itemId: wordToMeaningProblem.id,
          drillMode: wordToMeaningProblem.drillMode,
          answer: wordToMeaningProblem.choiceAnswerSpec.correctChoiceIds[0],
          answeredAt: startedAt - 10_000,
        },
      ],
    });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe('INVALID_TIMESTAMP');
  });
});
