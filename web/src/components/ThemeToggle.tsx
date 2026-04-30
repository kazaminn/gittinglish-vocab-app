import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/theme';

const MODES = ['light', 'dark', 'system'] as const;

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const LABELS = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System theme',
} as const;

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();

  function cycle() {
    const idx = MODES.indexOf(mode);
    const nextIdx = (idx + 1) % MODES.length;
    setMode(MODES[nextIdx] ?? 'system');
  }

  const Icon = ICONS[mode];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABELS[mode]}
      className="rounded-sm px-2 py-1"
      style={{
        color: 'var(--text-muted)',
      }}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
