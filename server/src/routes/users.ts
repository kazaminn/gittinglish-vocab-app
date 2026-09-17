import { APIError } from 'better-auth';
import { eq, and, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/index.js';
import { db } from '../db/client.js';
import {
  answerLogs,
  drillProgress,
  sessionWrites,
  user,
  userActivities,
} from '../db/schema.js';
import type { AuthEnv } from '../middleware/auth.js';
import { badRequest, conflict } from '../utils/api-error.js';
import { ok } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const app = new Hono<AuthEnv>();
const TOKYO_TIME_ZONE = 'Asia/Tokyo';

function formatTokyoDate(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TOKYO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Matches emailAndPassword.{min,max}PasswordLength in ../auth/index.ts.
const SetPasswordRequestSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

const DeleteAccountRequestSchema = z.object({
  confirmUsername: z.string().min(1),
});

// GET /api/users/me/stats
app.get('/me/stats', async (c) => {
  const userId = c.get('userId');
  const now = Math.floor(Date.now() / 1000);

  // Total reviewed & correct
  const stats = await db
    .select({
      totalReviewed: sql<number>`coalesce(sum(items_reviewed), 0)`,
      totalCorrect: sql<number>`coalesce(sum(correct_count), 0)`,
    })
    .from(userActivities)
    .where(eq(userActivities.userId, userId))
    .get();

  // Due today
  const dueResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(drillProgress)
    .where(and(eq(drillProgress.userId, userId), sql`next_review <= ${now}`))
    .get();

  // Streak: count consecutive days backwards from today
  const allDays = await db
    .select({ date: userActivities.activityDate })
    .from(userActivities)
    .where(eq(userActivities.userId, userId))
    .orderBy(sql`activity_date desc`);

  let streakDays = 0;
  const today = new Date();
  for (let i = 0; i < allDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = formatTokyoDate(expected);
    if (allDays[i]?.date === expectedStr) {
      streakDays++;
    } else {
      break;
    }
  }

  return c.json(
    ok({
      totalReviewed: stats?.totalReviewed ?? 0,
      totalCorrect: stats?.totalCorrect ?? 0,
      streakDays,
      dueToday: dueResult?.count ?? 0,
    })
  );
});

// POST /api/users/password
// A Kazamitte-only user has exactly one `account` row (providerId
// 'kazamitte') and no password, and Better Auth refuses to unlink a user's
// last login method. Setting a password is what gives that user a second
// method, and therefore a way to unlink Kazamitte later.
//
// Better Auth's own setPassword endpoint (auth.api.setPassword) is never
// reachable over HTTP on this better-auth version: its createAuthEndpoint()
// call passes no path, and better-call's router skips endpoints without one.
// So this route calls auth.api.setPassword directly and forwards the request
// headers, which is how it resolves the caller's session.
app.post('/password', async (c) => {
  const { newPassword } = await parseJsonBody(
    c.req.raw,
    SetPasswordRequestSchema
  );

  try {
    await auth.api.setPassword({
      headers: c.req.raw.headers,
      body: { newPassword },
    });
  } catch (error) {
    if (
      error instanceof APIError &&
      error.body?.code === 'PASSWORD_ALREADY_SET'
    ) {
      throw conflict(
        'PASSWORD_ALREADY_SET',
        'A password is already set for this account'
      );
    }
    throw error;
  }

  return c.json(ok({ success: true }));
});

// DELETE /api/users/me
// Irreversible, so the caller must retype their own username — never an id
// taken from the body — to prove intent. session_writes, drill_progress,
// answer_logs and user_activities key on a plain user_id with no FK to
// `user` (see server/src/db/schema.ts), so deleting `user` alone would
// strand them; they're deleted explicitly here, and the `user` row last so
// `session`/`account` (which do declare onDelete: 'cascade') go with it.
// All five deletes run in one db.transaction(): @libsql/client opens a
// Hrana stream for `transaction()` even in HTTP mode against Turso, so this
// is a real all-or-nothing commit, not best-effort ordering. Signing out
// runs before that commit, because afterwards there is no session left for
// Better Auth to find and clear.
app.delete('/me', async (c) => {
  const userId = c.get('userId');
  const username = c.get('username');
  const { confirmUsername } = await parseJsonBody(
    c.req.raw,
    DeleteAccountRequestSchema
  );

  if (!username || confirmUsername !== username) {
    throw badRequest(
      'CONFIRMATION_MISMATCH',
      'Confirmation did not match your account ID'
    );
  }

  // Sign out first, and only for the headers: Better Auth resolves the
  // session from the request, and the delete below cascades that row away,
  // so asking afterwards would find nothing to clear and leave the browser
  // holding the cookie. Failing here is not fatal — a cookie pointing at a
  // deleted session authenticates nobody — so the delete still runs.
  let cookieClears: string[] = [];
  try {
    const signOutResult = await auth.api.signOut({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });
    cookieClears = signOutResult.headers.getSetCookie();
  } catch (error) {
    console.error(
      'Failed to clear session cookie before account delete:',
      error
    );
  }

  await db.transaction(async (tx) => {
    await tx.delete(sessionWrites).where(eq(sessionWrites.userId, userId));
    await tx.delete(drillProgress).where(eq(drillProgress.userId, userId));
    await tx.delete(answerLogs).where(eq(answerLogs.userId, userId));
    await tx.delete(userActivities).where(eq(userActivities.userId, userId));
    await tx.delete(user).where(eq(user.id, userId));
  });

  for (const cookie of cookieClears) {
    c.header('set-cookie', cookie, { append: true });
  }

  return c.json(ok({ success: true }));
});

export default app;
