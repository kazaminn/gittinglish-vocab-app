import { useQuery } from '@tanstack/react-query';
import { type UserStatsResponse } from '@shared/dto';
import { apiRequest } from '../../lib/api-client';

export const userQueryKeys = {
  stats: ['user', 'stats'] as const,
};

export function useUserStatsQuery(enabled = true) {
  return useQuery({
    queryKey: userQueryKeys.stats,
    queryFn: () => apiRequest<UserStatsResponse>('/api/users/me/stats'),
    enabled,
    staleTime: 60_000,
  });
}
