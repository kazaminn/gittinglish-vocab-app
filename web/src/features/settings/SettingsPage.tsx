import { useState } from 'react';
import { type UserSettings } from '@shared/domain';
import { Shell } from '../../components/Shell';
import { useSettings } from '../../hooks/useSettings';
import { readStoredSettings } from '../../service/settings.local';
import { useThemeStore } from '../../store/theme';

interface SettingsPageProps {
  onBackToHome: () => void;
}

function updateSettings<TKey extends keyof UserSettings>(
  settings: UserSettings,
  key: TKey,
  value: UserSettings[TKey]
): UserSettings {
  return {
    ...settings,
    [key]: value,
  };
}

export function SettingsPage({ onBackToHome }: SettingsPageProps) {
  const { saveSettings } = useSettings();
  const { setMode } = useThemeStore();
  const [draft, setDraft] = useState<UserSettings>(() => readStoredSettings());
  const [theme, setTheme] = useState<UserSettings['theme']>(draft.theme);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const currentDraft = draft;
    const nextSettings: UserSettings = {
      displayName: currentDraft.displayName,
      fontSize: currentDraft.fontSize,
      fontWeight: currentDraft.fontWeight,
      sessionSize: currentDraft.sessionSize,
      theme,
    };

    setIsSaving(true);
    await saveSettings(nextSettings);
    setMode(theme);
    setDraft(nextSettings);
    setIsSaving(false);
  }

  return (
    <Shell title="settings">
      <div className="space-y-2">
        <label
          htmlFor="display-name"
          className="block text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          display name
        </label>
        <input
          id="display-name"
          type="text"
          value={draft.displayName}
          onChange={(event) =>
            setDraft(updateSettings(draft, 'displayName', event.target.value))
          }
          className="w-full rounded-sm border px-3 py-2"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          theme
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          {(['light', 'dark', 'system'] as const).map((themeMode) => {
            const isSelected = theme === themeMode;
            return (
              <button
                key={themeMode}
                type="button"
                onClick={() => setTheme(themeMode)}
                className="rounded-sm border px-4 py-2 text-left text-sm capitalize"
                style={{
                  background: isSelected ? 'var(--bg-selected)' : 'transparent',
                  borderColor: isSelected
                    ? 'var(--border-accent)'
                    : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {themeMode}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="font-size"
          className="block text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          font size: {draft.fontSize}px
        </label>
        <input
          id="font-size"
          type="range"
          min={14}
          max={24}
          step={1}
          value={draft.fontSize}
          onChange={(event) =>
            setDraft(
              updateSettings(draft, 'fontSize', Number(event.target.value))
            )
          }
          className="w-full accent-accent"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="font-weight"
          className="block text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          font weight
        </label>
        <select
          id="font-weight"
          value={draft.fontWeight}
          onChange={(event) =>
            setDraft(
              updateSettings(draft, 'fontWeight', Number(event.target.value))
            )
          }
          className="w-full rounded-sm border px-3 py-2"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value={400}>400</option>
          <option value={500}>500</option>
          <option value={600}>600</option>
          <option value={700}>700</option>
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="default-session-size"
          className="block text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          default session size: {draft.sessionSize}
        </label>
        <input
          id="default-session-size"
          type="range"
          min={5}
          max={50}
          step={5}
          value={draft.sessionSize}
          onChange={(event) =>
            setDraft(
              updateSettings(draft, 'sessionSize', Number(event.target.value))
            )
          }
          className="w-full accent-accent"
        />
      </div>

      <div
        className="rounded-sm border px-4 py-4"
        style={{
          background: 'transparent',
          borderColor: 'var(--border-subtle)',
          fontSize: `${draft.fontSize}px`,
          fontWeight: draft.fontWeight,
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>&gt; preview</p>
        <p className="mt-2" style={{ color: 'var(--text-primary)' }}>
          {draft.displayName || 'User'} can review settings here before saving.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={isSaving}
          className="flex-1 rounded-sm border px-4 py-3 text-left"
          style={{
            background: 'transparent',
            borderColor: 'var(--border-accent)',
            color: 'var(--text-accent)',
          }}
        >
          &gt; {isSaving ? 'saving...' : 'save settings'}
        </button>
        <button
          type="button"
          onClick={onBackToHome}
          className="flex-1 rounded-sm border px-4 py-3 text-left"
          style={{
            background: 'transparent',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          &gt; home
        </button>
      </div>
    </Shell>
  );
}
