import {
  type DatasetId,
  type DrillMode,
  type GeneratedProblem,
} from '@shared/domain';

export type { DatasetId } from '@shared/domain';

export interface ProblemSection {
  id: string;
  label: string;
  sentenceIds: string[];
}

export interface ProblemQuery {
  datasetId: DatasetId;
  drillMode: DrillMode;
  sectionId?: string;
}

export interface DatasetOption {
  id: DatasetId;
  label: string;
  description: string;
}

// gitverbs85 is left off the menu (gitverbs replaces it) but stays loadable
// so a session already running on it can finish.
const DATASET_OPTIONS: DatasetOption[] = [
  {
    id: 'gitverbs',
    label: 'GitVerbs',
    description: '頻出動詞 100 語のドリル',
  },
  {
    id: 'gitnouns',
    label: 'GitNouns',
    description: '頻出名詞 39 語のドリル',
  },
  {
    id: 'gitadjectives',
    label: 'GitAdjectives',
    description: '頻出形容詞 51 語のドリル',
  },
  {
    id: 'gitadverbs',
    label: 'GitAdverbs',
    description: '頻出副詞 41 語のドリル',
  },
];

export const DEFAULT_DATASET_ID: DatasetId = 'gitverbs';

type ProblemMode = 'word_to_meaning' | 'meaning_to_word' | 'sentence_cloze';

const DATASET_MODES: DrillMode[] = [
  'word_to_meaning',
  'meaning_to_word',
  'sentence_cloze',
  'flashcard',
];

function importProblemModule(
  loader: () => Promise<{ default: unknown }>,
): () => Promise<GeneratedProblem[]> {
  return async () => {
    const module = await loader();
    return module.default as GeneratedProblem[];
  };
}

// Literal paths so Vite can split each file into its own chunk.
const problemImporters: Record<
  DatasetId,
  Record<ProblemMode, () => Promise<GeneratedProblem[]>>
> = {
  gitverbs85: {
    word_to_meaning: importProblemModule(
      () => import('../../../data/gitverbs85_word_to_meaning.json'),
    ),
    meaning_to_word: importProblemModule(
      () => import('../../../data/gitverbs85_meaning_to_word.json'),
    ),
    sentence_cloze: importProblemModule(
      () => import('../../../data/gitverbs85_sentence_cloze.json'),
    ),
  },
  gitverbs: {
    word_to_meaning: importProblemModule(
      () => import('../../../data/gitverbs/gitverbs_word_to_meaning.json'),
    ),
    meaning_to_word: importProblemModule(
      () => import('../../../data/gitverbs/gitverbs_meaning_to_word.json'),
    ),
    sentence_cloze: importProblemModule(
      () => import('../../../data/gitverbs/gitverbs_sentence_cloze.json'),
    ),
  },
  gitnouns: {
    word_to_meaning: importProblemModule(
      () => import('../../../data/gitnouns/gitnouns_word_to_meaning.json'),
    ),
    meaning_to_word: importProblemModule(
      () => import('../../../data/gitnouns/gitnouns_meaning_to_word.json'),
    ),
    sentence_cloze: importProblemModule(
      () => import('../../../data/gitnouns/gitnouns_sentence_cloze.json'),
    ),
  },
  gitadjectives: {
    word_to_meaning: importProblemModule(
      () =>
        import('../../../data/gitadjectives/gitadjectives_word_to_meaning.json'),
    ),
    meaning_to_word: importProblemModule(
      () =>
        import('../../../data/gitadjectives/gitadjectives_meaning_to_word.json'),
    ),
    sentence_cloze: importProblemModule(
      () =>
        import('../../../data/gitadjectives/gitadjectives_sentence_cloze.json'),
    ),
  },
  gitadverbs: {
    word_to_meaning: importProblemModule(
      () => import('../../../data/gitadverbs/gitadverbs_word_to_meaning.json'),
    ),
    meaning_to_word: importProblemModule(
      () => import('../../../data/gitadverbs/gitadverbs_meaning_to_word.json'),
    ),
    sentence_cloze: importProblemModule(
      () => import('../../../data/gitadverbs/gitadverbs_sentence_cloze.json'),
    ),
  },
};

const problemsCache = new Map<string, Promise<GeneratedProblem[]>>();

function getRequestedMode(
  query: ProblemQuery,
): Exclude<DrillMode, 'flashcard'> {
  return query.drillMode === 'flashcard' ? 'word_to_meaning' : query.drillMode;
}

function getCacheKey(datasetId: DatasetId, key: string) {
  return `${datasetId}:${key}`;
}

async function loadProblemsForMode(
  datasetId: DatasetId,
  drillMode: Exclude<DrillMode, 'flashcard'>,
): Promise<GeneratedProblem[]> {
  const cacheKey = getCacheKey(datasetId, drillMode);
  const cached = problemsCache.get(cacheKey);
  if (cached) return cached;

  const importer = problemImporters[datasetId][drillMode as ProblemMode] as
    (() => Promise<GeneratedProblem[]>) | undefined;
  if (!importer) {
    const empty = Promise.resolve([]);
    problemsCache.set(cacheKey, empty);
    return empty;
  }

  const loadPromise = importer();
  problemsCache.set(cacheKey, loadPromise);
  return loadPromise;
}

export function getDatasetOptions(): DatasetOption[] {
  return DATASET_OPTIONS;
}

export function getAvailableModesForDataset(
  _datasetId: DatasetId,
): DrillMode[] {
  return DATASET_MODES;
}

export function getDefaultModeForDataset(_datasetId: DatasetId): DrillMode {
  return 'word_to_meaning';
}

export function getSectionsForDataset(
  _datasetId: DatasetId,
): Promise<ProblemSection[]> {
  return Promise.resolve([]);
}

export function getSectionLabel(
  _datasetId: DatasetId,
  _sectionId: string | undefined,
): Promise<string | undefined> {
  return Promise.resolve(undefined);
}

export async function getProblemsForQuery(
  query: ProblemQuery,
): Promise<GeneratedProblem[]> {
  const requestedMode = getRequestedMode(query);
  return loadProblemsForMode(query.datasetId, requestedMode);
}

export async function getProblemCount(query: ProblemQuery): Promise<number> {
  return (await getProblemsForQuery(query)).length;
}

export async function getPreviewProblems(
  query: ProblemQuery,
  limit = 5,
): Promise<GeneratedProblem[]> {
  return (await getProblemsForQuery(query)).slice(0, limit);
}

export async function preloadDatasetMode(
  datasetId: DatasetId,
  drillMode: Exclude<DrillMode, 'flashcard'>,
) {
  await loadProblemsForMode(datasetId, drillMode);
}
