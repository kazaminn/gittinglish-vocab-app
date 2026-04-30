// Local-dev only bypass for Better Auth.
// Two safety gates that must BOTH hold:
//   1. SKIP_AUTHENTIFICATION constant flipped to true by hand (default false)
//   2. Request Host is localhost / 127.0.0.1 AND NODE_ENV !== 'production'
// Production never satisfies gate 2, so this cannot accidentally leak.

export const SKIP_AUTHENTIFICATION = false;

export const TEST_USER = {
  id: 'testuser',
  name: 'testuser',
  email: 'testuser@local.invalid',
  username: 'testuser',
} as const;

export function isDevAuthSkipActive(req: Request): boolean {
  if (!SKIP_AUTHENTIFICATION) return false;
  if (process.env.NODE_ENV === 'production') return false;
  const host = (req.headers.get('host') ?? '').split(':')[0];
  return host === 'localhost' || host === '127.0.0.1';
}
