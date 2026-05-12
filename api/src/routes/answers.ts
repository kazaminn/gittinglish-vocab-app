import { Hono } from 'hono';
import { JudgeRequestSchema } from '@gittinglish-vocab-app/shared/schemas';
import { getProblemById } from '../data/problem-loader.js';
import { judgeAnswer } from '../logic/judge.js';
import type { AuthEnv } from '../middleware/auth.js';
import { notFound } from '../utils/api-error.js';
import { ok } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const app = new Hono<AuthEnv>();

app.post('/judge', async (c) => {
  const body = await parseJsonBody(c.req.raw, JudgeRequestSchema);

  const problem = getProblemById(body.itemId);
  if (!problem || problem.drillMode !== body.drillMode) {
    throw notFound('INVALID_ITEM', `No problem found for ${body.itemId}`);
  }

  const result = judgeAnswer(problem, body.answer);

  return c.json(
    ok({
      isCorrect: result.isCorrect,
      correctAnswer: result.correctAnswer,
      explanation: problem.explanation,
    })
  );
});

export default app;
