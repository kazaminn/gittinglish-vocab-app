import { eq, and, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db/client.js';
import { drillProgress, userActivities } from '../db/schema.js';
import type { AuthEnv } from '../middleware/auth.js';
import { ok } from '../utils/response.js';

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

export default app;
