// Local-dev only auth bypass for the SPA.
// Two safety gates that must BOTH hold:
//   1. SKIP_AUTHENTIFICATION constant flipped to true by hand (default false)
//   2. window.location.hostname is localhost / 127.0.0.1 AND import.meta.env.DEV
// Vite production builds set DEV to false, so this cannot leak into prod.
import type { AuthUser } from '../hooks/useAuth';

export const SKIP_AUTHENTIFICATION = false;

export const TEST_USER: AuthUser = {
  id: 'testuser',
  displayName: 'testuser',
  username: 'testuser',
};

export function isDevAuthSkipActive(): boolean {
  if (!SKIP_AUTHENTIFICATION) return false;
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}
