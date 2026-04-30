import { type GeneratedProblem, type DrillProgress } from '@shared/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalSessionService } from '../../src/service/session.local';

function makeProblem(id: string): GeneratedProblem {
  return {
    id,
    sentenceId: `s-${id}`,
    pedagogicalKind: 'cloze',
    interactionType: 'select',
    drillMode: 'word_to_meaning',
    tags: { grammar: ['svo'] },
    prompt: `What does '${id}' mean?`,
    stem: id,
    choices: [
      { id: 'a', text: 'meaning A' },
      { id: 'b', text: 'meaning B' },
      { id: 'c', text: 'meaning C' },
      { id: 'd', text: 'meaning D' },
    ],
    choiceAnswerSpec: { mode: 'single', correctChoiceIds: ['a'] },
    explanation: { summary: `${id} means A` },
    difficulty: { level: 1 },
  };
}

function makeProgress(itemId: string, nextReview: number): DrillProgress {
  return {
    userId: 'test-user',
    itemId,
    drillMode: 'word_to_meaning',
    ease: 2.5,
    interval: 1,
    nextReview,
    reps: 1,
    updatedAt: 0,
  };
}

describe('createLocalSessionService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a session with new items when no progress exists', async () => {
    const service = createLocalSessionService();
    const problems = Array.from({ length: 20 }, (_, i) => makeProblem(`w${i}`));
    const session = await service.startSession(
      { userId: 'test-user', drillMode: 'word_to_meaning', count: 10 },
      problems,
      []
    );

    expect(session.items.length).toBe(10);
    expect(session.status).toBe('active');
    expect(session.currentIndex).toBe(0);
  });

  it('limits new items to MAX_NEW_ITEMS (10)', async () => {
    const service = createLocalSessionService();
    const problems = Array.from({ length: 50 }, (_, i) => makeProblem(`w${i}`));
    const session = await service.startSession(
      { userId: 'test-user', drillMode: 'word_to_meaning', count: 20 },
      problems,
      []
    );

    expect(session.items.length).toBe(10);
  });

  it('prioritizes review-due items', async () => {
    const service = createLocalSessionService();
    const problems = Array.from({ length: 20 }, (_, i) => makeProblem(`w${i}`));
    const now = Date.now();
    const progress = [
      makeProgress('w0', now - 100_000),
      makeProgress('w1', now - 50_000),
      makeProgress('w2', now + 99_999_000), // not due yet
    ];

    const session = await service.startSession(
      { userId: 'test-user', drillMode: 'word_to_meaning', count: 5 },
      problems,
      progress
    );

    // Review items first
    expect(session.items[0]?.problemId).toBe('w0');
    expect(session.items[1]?.problemId).toBe('w1');
    // w2 is not due, so remaining slots filled with new items
  });

  it('saves and retrieves a session', async () => {
    const service = createLocalSessionService();
    const problems = [makeProblem('w0')];
    const session = await service.startSession(
      { userId: 'test-user', drillMode: 'word_to_meaning', count: 1 },
      problems,
      []
    );

    const retrieved = await service.getActiveSession('test-user');
    expect(retrieved?.id).toBe(session.id);
  });

  it('deletes a session', async () => {
    const service = createLocalSessionService();
    const problems = [makeProblem('w0')];
    await service.startSession(
      { userId: 'test-user', drillMode: 'word_to_meaning', count: 1 },
      problems,
      []
    );
    await service.clearSession('test-user');

    const retrieved = await service.getActiveSession('test-user');
    expect(retrieved).toBeUndefined();
  });

  it('handles empty problems list', async () => {
    const service = createLocalSessionService();
    const session = await service.startSession(
      { userId: 'test-user', drillMode: 'word_to_meaning', count: 10 },
      [],
      []
    );

    expect(session.items.length).toBe(0);
  });
});
