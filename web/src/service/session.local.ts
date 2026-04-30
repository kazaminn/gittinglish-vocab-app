import {
  type DrillProgress,
  type GeneratedProblem,
  type Session,
  type SessionItem,
} from '@shared/domain';
import { type SessionService, type SessionStartParams } from './types';

const STORAGE_PREFIX = 'gittinglish:session';
const MAX_NEW_ITEMS = 10;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function generateSessionItems(
  problems: GeneratedProblem[],
  progressList: DrillProgress[],
  sessionSize: number
): SessionItem[] {
  const now = Date.now();
  const progressMap = new Map(progressList.map((p) => [p.itemId, p]));

  // Review-due items: nextReview <= now, sorted by nextReview asc then ease asc
  const reviewDue = progressList
    .filter((p) => p.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview || a.ease - b.ease)
    .slice(0, sessionSize);

  const reviewIds = new Set(reviewDue.map((p) => p.itemId));
  const items: SessionItem[] = reviewDue.map((p) => ({
    problemId: p.itemId,
    answered: false,
  }));

  // Fill with new items (not yet in progress)
  if (items.length < sessionSize) {
    const remaining = sessionSize - items.length;
    const maxNew = Math.min(remaining, MAX_NEW_ITEMS);
    const newProblems = problems.filter(
      (p) => !reviewIds.has(p.id) && !progressMap.has(p.id)
    );
    for (let i = 0; i < Math.min(maxNew, newProblems.length); i++) {
      const p = newProblems[i];
      if (p) {
        items.push({ problemId: p.id, answered: false });
      }
    }
  }

  return items;
}

export function createLocalSessionService(): SessionService {
  return {
    startSession(
      params: SessionStartParams,
      problems: GeneratedProblem[],
      progressList: DrillProgress[]
    ): Promise<Session> {
      const items = generateSessionItems(problems, progressList, params.count);
      const session: Session = {
        id: crypto.randomUUID(),
        userId: params.userId,
        drillMode: params.drillMode,
        items,
        currentIndex: 0,
        status: 'active',
        startedAt: Date.now(),
      };
      localStorage.setItem(storageKey(params.userId), JSON.stringify(session));
      return Promise.resolve(session);
    },

    getActiveSession(userId: string): Promise<Session | undefined> {
      const raw = localStorage.getItem(storageKey(userId));
      if (!raw) return Promise.resolve(undefined);
      try {
        const session = JSON.parse(raw) as Session;
        return Promise.resolve(
          session.status === 'active' ? session : undefined
        );
      } catch {
        return Promise.resolve(undefined);
      }
    },

    saveSession(session: Session): Promise<void> {
      localStorage.setItem(storageKey(session.userId), JSON.stringify(session));
      return Promise.resolve();
    },

    clearSession(userId: string): Promise<void> {
      localStorage.removeItem(storageKey(userId));
      return Promise.resolve();
    },
  };
}
