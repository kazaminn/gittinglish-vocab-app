import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core';

// Better Auth 用テーブル (user / session / account / verification) は auth-schema から re-export
export { account, session, user, verification } from './auth-schema.js';

export const sessionWrites = sqliteTable('session_writes', {
  sessionId: text('session_id').primaryKey(),
  userId: text('user_id').notNull(),
  writtenAt: integer('written_at').notNull(),
});

export const drillProgress = sqliteTable(
  'drill_progress',
  {
    userId: text('user_id').notNull(),
    itemId: text('item_id').notNull(),
    drillMode: text('drill_mode').notNull(),
    ease: real('ease').default(2.5),
    interval: integer('interval').default(1),
    nextReview: integer('next_review').notNull(),
    reps: integer('reps').default(0),
    updatedAt: integer('updated_at')
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.itemId, table.drillMode] }),
    index('idx_progress_review').on(
      table.userId,
      table.drillMode,
      table.nextReview
    ),
  ]
);

export const answerLogs = sqliteTable(
  'answer_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull(),
    sessionId: text('session_id').notNull(),
    itemId: text('item_id').notNull(),
    drillMode: text('drill_mode').notNull(),
    answer: text('answer'),
    isCorrect: integer('is_correct').notNull(),
    quality: integer('quality').notNull(),
    answeredAt: integer('answered_at')
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('idx_answer_logs_session').on(table.sessionId)]
);

export const userActivities = sqliteTable(
  'user_activities',
  {
    userId: text('user_id').notNull(),
    activityDate: text('activity_date').notNull(),
    itemsReviewed: integer('items_reviewed').default(0),
    correctCount: integer('correct_count').default(0),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at')
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.activityDate] }),
    index('idx_user_activities_user_date').on(table.userId, table.activityDate),
  ]
);
