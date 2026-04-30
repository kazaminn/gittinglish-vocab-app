import { randomUUID } from 'node:crypto';
import { and, eq, inArray, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import type {
  EndSessionResultItem,
  SessionStartItem,
} from '../../../shared/dto.js';
import {
  EndSessionRequestSchema,
  SessionStartRequestSchema,
} from '../../../shared/schemas.js';
import { toProblemDTO } from '../../../shared/dto.js';
import { db } from '../db/client.js';
import { getProblemById, getProblemsForQuery } from '../data/problem-loader.js';
import {
  answerLogs,
  drillProgress,
  sessionWrites,
  userActivities,
  users,
} from '../db/schema.js';
import { judgeAnswer } from '../logic/judge.js';
import { calculateSM2, qualityFromCorrectness } from '../logic/sm2.js';
import type { AuthEnv } from '../middleware/auth.js';
import { ApiError, badRequest, conflict, internal, notFound } from '../utils/api-error.js';
import { err, ok } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const app = new Hono<AuthEnv>();
const TOKYO_TIME_ZONE = 'Asia/Tokyo';
const DEFAULT_COUNT = 20;
const MAX_COUNT = 50;

function unixSecondsFromMs(timestampMs: number): number {
  return Math.floor(timestampMs / 1000);
}

function formatTokyoDateFromUnixSeconds(unixSeconds: number): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TOKYO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(unixSeconds * 1000));
}

async function ensureUser(userId: string, displayName: string | undefined) {
  const existingUser = await db.select().from(users).where(eq(users.id, userId)).get();
  if (existingUser) return;

  await db.insert(users).values({
    id: userId,
    displayName,
    createdAt: Math.floor(Date.now() / 1000),
  });
}

function buildJudgeMeta(problem: SessionStartItem['problemDTO'] | ReturnType<typeof getProblemById>) {
  if (!problem) return undefined;

  if ('choiceAnswerSpec' in problem) {
    const correctChoice = problem.choices.find((choice) =>
      problem.choiceAnswerSpec.correctChoiceIds.includes(choice.id)
    );

    return {
      kind: 'select' as const,
      correctChoiceIds: problem.choiceAnswerSpec.correctChoiceIds,
      correctAnswer: correctChoice?.text ?? '',
    };
  }

  if ('answerSpec' in problem) {
    return {
      kind: 'input' as const,
      acceptedAnswers: problem.answerSpec.answers,
      correctAnswer: problem.answerSpec.answers[0] ?? '',
    };
  }

  return undefined;
}

app.post('/start', async (c) => {
  const userId = c.get('userId');
  const body = await parseJsonBody(c.req.raw, SessionStartRequestSchema);
  const count = Math.min(Math.max(body.count ?? DEFAULT_COUNT, 1), MAX_COUNT);

  await ensureUser(userId, c.get('userDisplayName'));

  const candidateProblems = getProblemsForQuery({
    dataset: body.dataset,
    drillMode: body.drillMode,
    sectionId: body.sectionId,
  });
  const candidateIds = candidateProblems.map((problem) => problem.id);

  if (candidateIds.length === 0) {
    return c.json(
      ok({
        sessionId: randomUUID(),
        startedAt: Date.now(),
        items: [],
      })
    );
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const relevantProgress = await db
    .select()
    .from(drillProgress)
    .where(
      and(
        eq(drillProgress.userId, userId),
        eq(drillProgress.drillMode, body.drillMode),
        inArray(drillProgress.itemId, candidateIds)
      )
    );

  const progressByItemId = new Map(
    relevantProgress.map((progress) => [progress.itemId, progress])
  );
  const dueIds = new Set(
    relevantProgress
      .filter((progress) => progress.nextReview <= nowSeconds)
      .map((progress) => progress.itemId)
  );

  const selectedProblems = candidateProblems
    .filter((problem) => dueIds.has(problem.id))
    .concat(
      candidateProblems.filter((problem) => !progressByItemId.has(problem.id))
    )
    .concat(
      candidateProblems.filter(
        (problem) => progressByItemId.has(problem.id) && !dueIds.has(problem.id)
      )
    )
    .slice(0, count);

  const items: SessionStartItem[] = selectedProblems.map((problem) => {
    const progress = progressByItemId.get(problem.id);

    return {
      itemId: problem.id,
      drillMode: problem.drillMode,
      problemDTO: toProblemDTO(problem),
      judgeMeta: buildJudgeMeta(problem),
      currentProgress: {
        ease: progress?.ease ?? 2.5,
        interval: progress?.interval ?? 1,
        reps: progress?.reps ?? 0,
      },
    };
  });

  return c.json(
    ok({
      sessionId: randomUUID(),
      startedAt: Date.now(),
      items,
    })
  );
});

app.post('/end', async (c) => {
  const userId = c.get('userId');
  const body = await parseJsonBody(c.req.raw, EndSessionRequestSchema);

  const startedAtSeconds = unixSecondsFromMs(body.startedAt);
  const completedAtSeconds = unixSecondsFromMs(body.completedAt);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (body.answers.length === 0) {
    throw badRequest('INVALID_REQUEST', 'answers must not be empty');
  }

  if (body.startedAt > body.completedAt) {
    throw badRequest(
      'INVALID_TIMESTAMP',
      'startedAt must be earlier than or equal to completedAt'
    );
  }

  if (completedAtSeconds > nowSeconds + 60) {
    throw badRequest('INVALID_TIMESTAMP', 'completedAt is too far in the future');
  }

  const results: EndSessionResultItem[] = [];

  try {
    await db.transaction(async (tx) => {
      await tx.insert(sessionWrites).values({
        sessionId: body.sessionId,
        userId,
        writtenAt: nowSeconds,
      });

      for (const answer of body.answers) {
        const problem = getProblemById(answer.itemId);
        if (!problem) {
          throw notFound('INVALID_ITEM', `No problem found for ${answer.itemId}`);
        }

        if (problem.drillMode !== answer.drillMode) {
          throw badRequest(
            'INVALID_DRILL_MODE',
            `Problem ${answer.itemId} does not support ${answer.drillMode}`
          );
        }

        const answeredAtSeconds = unixSecondsFromMs(answer.answeredAt);
        if (
          answeredAtSeconds < startedAtSeconds ||
          answeredAtSeconds > completedAtSeconds + 60
        ) {
          throw badRequest(
            'INVALID_TIMESTAMP',
            `answeredAt out of range for ${answer.itemId}`
          );
        }

        const judgeResult = judgeAnswer(problem, answer.answer);
        const quality = qualityFromCorrectness(judgeResult.isCorrect);

        const currentProgress = await tx
          .select()
          .from(drillProgress)
          .where(
            and(
              eq(drillProgress.userId, userId),
              eq(drillProgress.itemId, answer.itemId),
              eq(drillProgress.drillMode, answer.drillMode)
            )
          )
          .get();

        const sm2Result = calculateSM2(
          {
            quality,
            ease: currentProgress?.ease ?? 2.5,
            interval: currentProgress?.interval ?? 1,
            reps: currentProgress?.reps ?? 0,
          },
          answeredAtSeconds
        );

        await tx
          .insert(drillProgress)
          .values({
            userId,
            itemId: answer.itemId,
            drillMode: answer.drillMode,
            ease: sm2Result.ease,
            interval: sm2Result.interval,
            reps: sm2Result.reps,
            nextReview: sm2Result.nextReview,
            updatedAt: nowSeconds,
          })
          .onConflictDoUpdate({
            target: [
              drillProgress.userId,
              drillProgress.itemId,
              drillProgress.drillMode,
            ],
            set: {
              ease: sm2Result.ease,
              interval: sm2Result.interval,
              reps: sm2Result.reps,
              nextReview: sm2Result.nextReview,
              updatedAt: nowSeconds,
            },
          });

        await tx.insert(answerLogs).values({
          userId,
          sessionId: body.sessionId,
          itemId: answer.itemId,
          drillMode: answer.drillMode,
          answer: answer.answer,
          isCorrect: judgeResult.isCorrect ? 1 : 0,
          quality,
          answeredAt: answeredAtSeconds,
        });

        const date = formatTokyoDateFromUnixSeconds(answeredAtSeconds);
        const existingStats = await tx
          .select()
          .from(userActivities)
          .where(
            and(
              eq(userActivities.userId, userId),
              eq(userActivities.activityDate, date)
            )
          )
          .get();

        if (existingStats) {
          await tx
            .update(userActivities)
            .set({
              itemsReviewed: (existingStats.itemsReviewed ?? 0) + 1,
              correctCount:
                (existingStats.correctCount ?? 0) +
                (judgeResult.isCorrect ? 1 : 0),
              updatedAt: nowSeconds,
            })
            .where(
              and(
                eq(userActivities.userId, userId),
                eq(userActivities.activityDate, date)
              )
            );
        } else {
          await tx.insert(userActivities).values({
            userId,
            activityDate: date,
            itemsReviewed: 1,
            correctCount: judgeResult.isCorrect ? 1 : 0,
            createdAt: nowSeconds,
            updatedAt: nowSeconds,
          });
        }

        results.push({
          itemId: answer.itemId,
          drillMode: answer.drillMode,
          isCorrect: judgeResult.isCorrect,
          quality,
        });
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(err(error.code, error.message), error.status);
    }

    const message =
      error instanceof Error ? error.message : 'Failed to write session';
    const normalizedMessage = message.toLowerCase();
    const mappedError =
      normalizedMessage.includes('unique constraint failed') ||
      normalizedMessage.includes('sqlite_constraint') ||
      normalizedMessage.includes('constraint failed') ||
      normalizedMessage.includes('session_writes')
      ? conflict('DUPLICATE_SESSION', 'Session has already been persisted')
      : internal('Failed to write session');

    return c.json(err(mappedError.code, mappedError.message), mappedError.status);
  }

  return c.json(
    ok({
      accepted: results.length,
      results,
    })
  );
});

export default app;
