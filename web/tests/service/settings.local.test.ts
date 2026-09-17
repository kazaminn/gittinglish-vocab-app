import { beforeEach, describe, expect, it } from 'vitest';
import {
  createLocalSettingsService,
  readStoredSettings,
} from '../../src/service/settings.local';

const STORAGE_KEY = 'gittinglish:settings';

describe('settings.local', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('drops a stale displayName from a previously stored payload', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        displayName: 'someone else',
        fontSize: 18,
        fontWeight: 500,
        theme: 'dark',
        sessionSize: 30,
      })
    );

    const settings = readStoredSettings();

    expect(settings).not.toHaveProperty('displayName');
    expect(settings).toEqual({
      fontSize: 18,
      fontWeight: 500,
      theme: 'dark',
      sessionSize: 30,
    });
  });

  it('never writes a displayName back to storage', async () => {
    const service = createLocalSettingsService();

    await service.saveSettings({
      fontSize: 20,
      fontWeight: 600,
      theme: 'light',
      sessionSize: 10,
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}')).not.toHaveProperty('displayName');
  });
});
