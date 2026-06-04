import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { type DatasetId } from '@shared/domain';
import {
  getProblemsForQuery,
  getSectionLabel,
  getSectionsForDataset,
  type ProblemQuery,
} from '../../data/problems';

export const homeQueryKeys = {
  sections: (datasetId: DatasetId) => ['home', 'sections', datasetId] as const,
  problems: (query: ProblemQuery) =>
    [
      'home',
      'problems',
      query.datasetId,
      query.drillMode,
      query.sectionId ?? 'all',
    ] as const,
  sectionLabel: (datasetId: DatasetId, sectionId: string | undefined) =>
    ['home', 'sectionLabel', datasetId, sectionId ?? 'all'] as const,
};

// Problem JSON is bundled and immutable, so it never goes stale.
export function useHomeSectionsQuery(datasetId: DatasetId) {
  return useQuery({
    queryKey: homeQueryKeys.sections(datasetId),
    queryFn: () => getSectionsForDataset(datasetId),
    staleTime: Infinity,
  });
}

export function useHomeProblemsQuery(query: ProblemQuery) {
  return useQuery({
    queryKey: homeQueryKeys.problems(query),
    queryFn: () => getProblemsForQuery(query),
    // Keep the previous dataset/mode visible while the next one loads so the
    // content area never flashes empty on switch.
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
}

export function useSectionLabelQuery(
  datasetId: DatasetId,
  sectionId: string | undefined
) {
  return useQuery({
    queryKey: homeQueryKeys.sectionLabel(datasetId, sectionId),
    queryFn: () => getSectionLabel(datasetId, sectionId),
    staleTime: Infinity,
  });
}
