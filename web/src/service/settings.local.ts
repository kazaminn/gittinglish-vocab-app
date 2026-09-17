import { type UserSettings } from '@shared/domain';
import { type SettingsService } from './types';

const STORAGE_KEY = 'gittinglish:settings';

export const DEFAULT_SETTINGS: UserSettings = {
  fontSize: 16,
  fontWeight: 400,
  theme: 'system',
  sessionSize: 20,
};

// Picks only the known UserSettings keys out of a parsed payload, so a stale
// field from an older schema (e.g. the display name this store used to keep)
// cannot ride along into a later save.
function pickKnownSettings(parsed: Partial<UserSettings>): UserSettings {
  return {
    fontSize: parsed.fontSize ?? DEFAULT_SETTINGS.fontSize,
    fontWeight: parsed.fontWeight ?? DEFAULT_SETTINGS.fontWeight,
    theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
    sessionSize: parsed.sessionSize ?? DEFAULT_SETTINGS.sessionSize,
  };
}

export function readStoredSettings(): UserSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    return pickKnownSettings(JSON.parse(raw) as Partial<UserSettings>);
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
