import {
  ClozeMcqProblemSchema,
  DatasetIdSchema,
} from '@gittinglish-vocab-app/shared/schemas';
import { describe, expect, it } from 'vitest';
import {
  getDatasetIds,
  getProblemById,
  getProblemsForQuery,
} from '../data/problem-loader.js';

const MODES = ['word_to_meaning', 'meaning_to_word', 'sentence_cloze'] as const;

// gitverbs85 ships two different cloze problems under gitverbs85_001_scloze_1.
// It is off the menu and kept only for in-flight sessions, so the check below
// guards the datasets people can still pick.
const ACTIVE_DATASETS = getDatasetIds().filter((id) => id !== 'gitverbs85');

describe('problem loader', () => {
  it('loads every dataset the API accepts', () => {
    expect(getDatasetIds().sort()).toEqual([...DatasetIdSchema.options].sort());
  });

  describe.each(getDatasetIds())('%s', (dataset) => {
    it.each(MODES)('serves valid %s problems', (drillMode) => {
      const problems = getProblemsForQuery({ dataset, drillMode });

      expect(problems.length).toBeGreaterThan(0);
      for (const problem of problems) {
        expect(problem.id.startsWith(`${dataset}_`)).toBe(true);
        expect(problem.drillMode).toBe(drillMode);
        expect(ClozeMcqProblemSchema.safeParse(problem).error).toBeUndefined();
      }
    });

    it('serves flashcards from the word → meaning set', () => {
      expect(getProblemsForQuery({ dataset, drillMode: 'flashcard' })).toBe(
        getProblemsForQuery({ dataset, drillMode: 'word_to_meaning' }),
      );
    });
  });

  it('keeps problem ids unique so lookups by id find the right problem', () => {
    const problems = ACTIVE_DATASETS.flatMap((dataset) =>
      MODES.flatMap((drillMode) => getProblemsForQuery({ dataset, drillMode })),
    );

    expect(new Set(problems.map((p) => p.id)).size).toBe(problems.length);
    for (const problem of problems) {
      expect(getProblemById(problem.id)).toBe(problem);
    }
  });
});
