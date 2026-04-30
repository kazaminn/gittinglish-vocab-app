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

const DATASET_OPTIONS: DatasetOption[] = [
  {
    id: 'gitverbs85',
    label: 'GitVerbs85',
    description: '頻出動詞 85 のドリル',
  },
];

const DATASET_MODE_MAP: Record<DatasetId, DrillMode[]> = {
  gitverbs85: ['word_to_meaning', 'meaning_to_word', 'sentence_cloze', 'flashcard'],
};

const DATASET_DEFAULT_MODE: Record<DatasetId, DrillMode> = {
  gitverbs85: 'word_to_meaning',
};

const DATASET_FLASHCARD_MODE: Record<DatasetId, DrillMode> = {
  gitverbs85: 'word_to_meaning',
};

function importProblemModule(
  loader: () => Promise<{ default: unknown }>
): () => Promise<GeneratedProblem[]> {
  return async () => {
    const module = await loader();
    return module.default as GeneratedProblem[];
  };
}

const gitverbsProblemImporters: Record<
  'word_to_meaning' | 'meaning_to_word' | 'sentence_cloze',
  () => Promise<GeneratedProblem[]>
> = {
  word_to_meaning: importProblemModule(
    () => import('../../../data/gitverbs85_word_to_meaning.json')
  ),
  meaning_to_word: importProblemModule(
    () => import('../../../data/gitverbs85_meaning_to_word.json')
  ),
  sentence_cloze: importProblemModule(
    () => import('../../../data/gitverbs85_sentence_cloze.json')
  ),
};

const problemsCache = new Map<string, Promise<GeneratedProblem[]>>();

function getRequestedMode(query: ProblemQuery): Exclude<DrillMode, 'flashcard'> {
  return (query.drillMode === 'flashcard'
    ? DATASET_FLASHCARD_MODE[query.datasetId]
    : query.drillMode) as Exclude<DrillMode, 'flashcard'>;
}

function getCacheKey(datasetId: DatasetId, key: string) {
  return `${datasetId}:${key}`;
}

async function loadProblemsForMode(
  datasetId: DatasetId,
  drillMode: Exclude<DrillMode, 'flashcard'>
): Promise<GeneratedProblem[]> {
  const cacheKey = getCacheKey(datasetId, drillMode);
  const cached = problemsCache.get(cacheKey);
  if (cached) return cached;

  const importer =
    gitverbsProblemImporters[
      drillMode as Extract<
        Exclude<DrillMode, 'flashcard'>,
        'word_to_meaning' | 'meaning_to_word' | 'sentence_cloze'
      >
    ];
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

export function getAvailableModesForDataset(datasetId: DatasetId): DrillMode[] {
  return DATASET_MODE_MAP[datasetId];
}

export function getDefaultModeForDataset(datasetId: DatasetId): DrillMode {
  return DATASET_DEFAULT_MODE[datasetId];
}

// gitverbs85 は section 分割なし
export async function getSectionsForDataset(_datasetId: DatasetId): Promise<ProblemSection[]> {
  return [];
}

export async function getSectionLabel(
  _datasetId: DatasetId,
  _sectionId: string | undefined
): Promise<string | undefined> {
  return undefined;
}

export async function getProblemsForQuery(query: ProblemQuery): Promise<GeneratedProblem[]> {
  const requestedMode = getRequestedMode(query);
  return loadProblemsForMode(query.datasetId, requestedMode);
}

export async function getProblemCount(query: ProblemQuery): Promise<number> {
  return (await getProblemsForQuery(query)).length;
}

export async function getPreviewProblems(
  query: ProblemQuery,
  limit = 5
): Promise<GeneratedProblem[]> {
  return (await getProblemsForQuery(query)).slice(0, limit);
}

export async function preloadDatasetMode(
  datasetId: DatasetId,
  drillMode: Exclude<DrillMode, 'flashcard'>
) {
  await loadProblemsForMode(datasetId, drillMode);
}
