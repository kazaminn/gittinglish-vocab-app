import { createRequire } from 'node:module';
import type {
  ClozeMcqProblem,
  DatasetId,
  DrillMode,
  GeneratedProblem,
} from '@gittinglish-vocab-app/shared';

const require = createRequire(import.meta.url);

interface ProblemSection {
  id: string;
  label: string;
  sentenceIds: string[];
}

interface ProblemQuery {
  dataset: DatasetId;
  drillMode: DrillMode;
  sectionId?: string;
}

const wordToMeaningProblems =
  require('../../../data/gitverbs85_word_to_meaning.json') as ClozeMcqProblem[];
const meaningToWordProblems =
  require('../../../data/gitverbs85_meaning_to_word.json') as ClozeMcqProblem[];
const sentenceClozeProblems =
  require('../../../data/gitverbs85_sentence_cloze.json') as ClozeMcqProblem[];

const DATASET_FLASHCARD_MODE: Record<DatasetId, DrillMode> = {
  gitverbs85: 'word_to_meaning',
};

const DATASET_PROBLEMS: Record<
  DatasetId,
  Partial<Record<DrillMode, GeneratedProblem[]>>
> = {
  gitverbs85: {
    word_to_meaning: wordToMeaningProblems,
    meaning_to_word: meaningToWordProblems,
    sentence_cloze: sentenceClozeProblems,
    flashcard: wordToMeaningProblems,
  },
};

export function getSectionsForDataset(_dataset: DatasetId): ProblemSection[] {
  return [];
}

export function getProblemsForQuery(query: ProblemQuery): GeneratedProblem[] {
  const requestedMode =
    query.drillMode === 'flashcard'
      ? DATASET_FLASHCARD_MODE[query.dataset]
      : query.drillMode;

  return DATASET_PROBLEMS[query.dataset][requestedMode] ?? [];
}

export function getProblemById(id: string): GeneratedProblem | undefined {
  return Object.values(DATASET_PROBLEMS)
    .flatMap((entry) => Object.values(entry))
    .flatMap((problems) => problems ?? [])
    .find((problem) => problem.id === id);
}
