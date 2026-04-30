import { type UserSettings } from '@shared/domain';
import { type SettingsService } from './types';

const STORAGE_KEY = 'gittinglish:settings';

export const DEFAULT_SETTINGS: UserSettings = {
  displayName: 'User',
  fontSize: 16,
  fontWeight: 400,
  theme: 'system',
  sessionSize: 20,
};

export function readStoredSettings(): UserSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    return {
      ...DEFAULT_SETTINGS,
      ...(JSON.parse(raw) as Partial<UserSettings>),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function createLocalSettingsService(): SettingsService {
  return {
    getSettings(): Promise<UserSettings> {
      return Promise.resolve(readStoredSettings());
    },

    saveSettings(settings: UserSettings): Promise<void> {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return Promise.resolve();
    },
  };
}
