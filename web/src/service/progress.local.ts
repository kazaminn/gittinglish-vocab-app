import { type DrillMode, type DrillProgress } from '@shared/domain';
import { type ProgressService } from './types';

const STORAGE_PREFIX = 'gittinglish:progress';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function loadAll(userId: string): DrillProgress[] {
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DrillProgress[];
  } catch {
    return [];
  }
}

function saveAll(userId: string, list: DrillProgress[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export function createLocalProgressService(): ProgressService {
  return {
    getProgress(
      userId: string,
      drillMode: DrillMode
    ): Promise<DrillProgress[]> {
      return Promise.resolve(
        loadAll(userId).filter((p) => p.drillMode === drillMode)
      );
    },

    saveProgress(progress: DrillProgress): Promise<void> {
      const all = loadAll(progress.userId);
      const idx = all.findIndex(
        (p) =>
          p.itemId === progress.itemId && p.drillMode === progress.drillMode
      );
      if (idx >= 0) {
        all[idx] = progress;
      } else {
        all.push(progress);
      }
      saveAll(progress.userId, all);
      return Promise.resolve();
    },

    resetProgress(userId: string): Promise<void> {
      localStorage.removeItem(storageKey(userId));
      return Promise.resolve();
    },
  };
}
