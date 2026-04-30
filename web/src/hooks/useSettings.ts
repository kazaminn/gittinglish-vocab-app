import { type UserSettings } from '@shared/domain';
import {
  useSaveSettingsMutation,
  useSettingsQuery,
} from '../features/settings/queries';

interface UseSettingsResult {
  isLoading: boolean;
  settings: UserSettings | undefined;
  saveSettings: (settings: UserSettings) => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const settingsQuery = useSettingsQuery();
  const saveSettingsMutation = useSaveSettingsMutation();

  return {
    isLoading: settingsQuery.isPending,
    settings: settingsQuery.data,
    saveSettings: async (settings) => {
      await saveSettingsMutation.mutateAsync(settings);
    },
  };
}
