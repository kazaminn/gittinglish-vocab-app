import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type UserSettings } from '@shared/domain';
import { authClient } from '../../lib/auth-client';
import { useServices } from '../../service/context';

export const settingsQueryKey = ['settings'] as const;
export const linkedAccountsQueryKey = ['linked-accounts'] as const;

export function useSettingsQuery() {
  const { settings } = useServices();

  return useQuery({
    queryKey: settingsQueryKey,
    queryFn: () => settings.getSettings(),
    staleTime: Infinity,
  });
}

export function useSaveSettingsMutation() {
  const { settings } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nextSettings: UserSettings) =>
      settings.saveSettings(nextSettings),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(settingsQueryKey, variables);
    },
  });
}

/**
 * Which providers the signed-in user has linked. Drives the SSO section, so it
 * is refetched after a link round-trip rather than cached indefinitely.
 */
export function useLinkedAccountsQuery() {
  return useQuery({
    queryKey: linkedAccountsQueryKey,
    queryFn: async () => {
      const result = await authClient.listAccounts();
      if (result.error) {
        throw new Error(result.error.message ?? 'failed to list accounts');
      }
      return result.data ?? [];
    },
    staleTime: 0,
  });
}
