import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'gittinglish:theme';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

function resolvedIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', resolvedIsDark(mode));
}

function loadMode(): ThemeMode {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: loadMode(),
  setMode: (mode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    set({ mode });
  },
}));

// Apply on initial load
applyTheme(loadMode());
