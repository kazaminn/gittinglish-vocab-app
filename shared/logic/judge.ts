import type { GeneratedProblem } from '../domain.js';
import type { JudgeResponse, SessionStartItem } from '../dto.js';
import { normalizeTextAnswer } from './normalize.js';

export interface JudgeResult {
  isCorrect: boolean;
  correctAnswer: string;
}

function joinChunksInOrder(problem: GeneratedProblem, orderedIds: string[]): string {
  if (!('chunks' in problem)) return '';
  const chunkMap = new Map(problem.chunks.map((chunk) => [chunk.id, chunk.text]));
  return orderedIds.map((id) => chunkMap.get(id) ?? '').join(' ').trim();
}

/**
 * Server-side authoritative judge. Operates on the full GeneratedProblem
 * (which includes correct answers) and is reused by /api/sessions/end.
 */
export function judgeAnswer(
  problem: GeneratedProblem,
  answer: string
): JudgeResult {
  if ('choiceAnswerSpec' in problem) {
    const normalized = answer.trim();
    const correctIds = problem.choiceAnswerSpec.correctChoiceIds;
    const correctChoice = problem.choices.find((choice) =>
      correctIds.includes(choice.id)
    );
    return {
      isCorrect: correctIds.includes(normalized),
      correctAnswer: correctChoice?.text ?? correctIds[0] ?? '',
    };
  }

  if ('answerSpec' in problem) {
    const normalized = normalizeTextAnswer(answer);
    const isCorrect = problem.answerSpec.answers.some(
      (candidate) => normalizeTextAnswer(candidate) === normalized
    );
    return {
      isCorrect,
      correctAnswer: problem.answerSpec.answers[0] ?? '',
    };
  }

  if ('correctOrder' in problem) {
    const userOrder = answer
      .split(',')
      .map((chunkId) => chunkId.trim())
      .filter(Boolean);
    const isCorrect =
      userOrder.length === problem.correctOrder.length &&
      userOrder.every((chunkId, index) => chunkId === problem.correctOrder[index]);
    return {
      isCorrect,
      correctAnswer: joinChunksInOrder(problem, problem.correctOrder),
    };
  }

  return { isCorrect: false, correctAnswer: '' };
}

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
