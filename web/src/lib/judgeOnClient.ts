import type { JudgeResponse, SessionStartItem } from '@shared/dto';
import { normalizeTextAnswer } from './normalizeTextAnswer';

/**
 * Client-side judge using only the data sent with SessionStartItem.judgeMeta.
 * The server re-judges authoritatively at /api/sessions/end, so this only
 * needs to be accurate enough for immediate UI feedback.
 *
 * Throws if the item has no judgeMeta (e.g. reorder/transform variants that
 * are not yet supported on the client). Callers should treat that as a bug
 * rather than silently fall back.
 */
export function judgeOnClient(
  item: SessionStartItem,
  answer: string
): JudgeResponse {
  const meta = item.judgeMeta;
  if (!meta) {
    throw new Error(
      `judgeOnClient: item ${item.itemId} (${item.drillMode}) has no judgeMeta`
    );
  }

  const explanation = item.problemDTO.explanation;

  if (meta.kind === 'select') {
    return {
      isCorrect: meta.correctChoiceIds.includes(answer.trim()),
      correctAnswer: meta.correctAnswer,
      explanation,
    };
  }

  const normalized = normalizeTextAnswer(answer);
  const isCorrect = meta.acceptedAnswers.some(
    (candidate) => normalizeTextAnswer(candidate) === normalized
  );
  return {
    isCorrect,
    correctAnswer: meta.correctAnswer,
    explanation,
  };
}
