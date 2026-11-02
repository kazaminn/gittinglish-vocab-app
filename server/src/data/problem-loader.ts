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

interface DatasetFiles {
  word_to_meaning: ClozeMcqProblem[];
  meaning_to_word: ClozeMcqProblem[];
  sentence_cloze: ClozeMcqProblem[];
}

// Every path is a string literal on purpose: Vercel traces the function's
// files statically, and a computed require() path would leave the JSON behind.
// gitverbs85 is off the Home menu but still loads, so a session started on it
// before the switch can still be judged and saved.
const DATASET_FILES: Record<DatasetId, DatasetFiles> = {
  gitverbs85: {
    word_to_meaning: require('../../../data/gitverbs85_word_to_meaning.json'),
    meaning_to_word: require('../../../data/gitverbs85_meaning_to_word.json'),
    sentence_cloze: require('../../../data/gitverbs85_sentence_cloze.json'),
  },
  gitverbs: {
    word_to_meaning: require('../../../data/gitverbs/gitverbs_word_to_meaning.json'),
    meaning_to_word: require('../../../data/gitverbs/gitverbs_meaning_to_word.json'),
    sentence_cloze: require('../../../data/gitverbs/gitverbs_sentence_cloze.json'),
  },
  gitnouns: {
    word_to_meaning: require('../../../data/gitnouns/gitnouns_word_to_meaning.json'),
    meaning_to_word: require('../../../data/gitnouns/gitnouns_meaning_to_word.json'),
    sentence_cloze: require('../../../data/gitnouns/gitnouns_sentence_cloze.json'),
  },
  gitadjectives: {
    word_to_meaning: require('../../../data/gitadjectives/gitadjectives_word_to_meaning.json'),
    meaning_to_word: require('../../../data/gitadjectives/gitadjectives_meaning_to_word.json'),
    sentence_cloze: require('../../../data/gitadjectives/gitadjectives_sentence_cloze.json'),
  },
  gitadverbs: {
    word_to_meaning: require('../../../data/gitadverbs/gitadverbs_word_to_meaning.json'),
    meaning_to_word: require('../../../data/gitadverbs/gitadverbs_meaning_to_word.json'),
    sentence_cloze: require('../../../data/gitadverbs/gitadverbs_sentence_cloze.json'),
  },
};

function problemsForMode(
  files: DatasetFiles,
  drillMode: DrillMode,
): GeneratedProblem[] {
  switch (drillMode) {
    case 'word_to_meaning':
    case 'flashcard':
      return files.word_to_meaning;
    case 'meaning_to_word':
      return files.meaning_to_word;
    case 'sentence_cloze':
      return files.sentence_cloze;
    default:
      return [];
  }
}

const PROBLEMS_BY_ID = new Map<string, GeneratedProblem>(
  Object.values(DATASET_FILES)
    .flatMap((files) => Object.values(files))
    .flat()
    .map((problem) => [problem.id, problem]),
);

export function getDatasetIds(): DatasetId[] {
  return Object.keys(DATASET_FILES) as DatasetId[];
}

export function getSectionsForDataset(_dataset: DatasetId): ProblemSection[] {
  return [];
}

export function getProblemsForQuery(query: ProblemQuery): GeneratedProblem[] {
  return problemsForMode(DATASET_FILES[query.dataset], query.drillMode);
}

export function getProblemById(id: string): GeneratedProblem | undefined {
  return PROBLEMS_BY_ID.get(id);
}
