import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type UserSettings } from '@shared/domain';
import { useServices } from '../../service/context';

export const settingsQueryKey = ['settings'] as const;

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
