import { useId, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authClient } from '../../lib/auth-client';
import { translateAuthError } from './errors';

// Better Auth's username plugin accepts these characters by default. Checking
// here as well turns a round trip that comes back in English into an inline
// Japanese message.
const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

/**
 * Kazamitte ID sign-up creates the account straight from the provider's
 * response, so it arrives with no ID, a placeholder display name, and no
 * record that the terms were accepted. This page finishes that account, and
 * ProtectedRoute keeps the user here until it has an ID.
 */
export function SetupPage() {
  const { user } = useAuth();
  const usernameId = useId();
  const usernameHintId = useId();
  const displayNameId = useId();
  const termsId = useId();
  const errorId = useId();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUsernameValid =
    username.length >= 3 &&
    username.length <= 32 &&
    USERNAME_PATTERN.test(username);
  const canSubmit = agreed && isUsernameValid && !isSubmitting;
  const hasError = Boolean(error);

  // Better Auth refreshes the session atom after /update-user, so leaving the
  // redirect to the session rather than navigating on the response avoids
  // bouncing off ProtectedRoute with a stale user.
  if (user?.username) return <Navigate to="/app" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(undefined);

    const result = await authClient.updateUser({
      username,
      // Only /sign-up/email defaults this from username; on update it has to
      // be sent explicitly or the ID would display as the placeholder.
      displayUsername: username,
      name: displayName.trim() || username,
    });

    if (result.error) {
      setError(translateAuthError(result.error));
      setIsSubmitting(false);
      return;
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">初期設定</h1>
      <p className="text-text-muted mb-6 text-sm">
        Kazamitte ID でのログインが完了しました。Gittinglish で使う ID
        を決めてください。
      </p>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={usernameId} className="text-sm">
            ID (3〜32 文字)
          </label>
          <input
            id={usernameId}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={32}
            autoComplete="username"
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError ? `${usernameHintId} ${errorId}` : usernameHintId
            }
            className="bg-bg rounded-md border border-border px-3 py-2"
          />
          <span id={usernameHintId} className="text-text-muted text-xs">
            半角英数字と _ . が使えます。
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={displayNameId} className="text-sm">
            表示名 (任意)
          </label>
          <input
            id={displayNameId}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={64}
            autoComplete="name"
            className="bg-bg rounded-md border border-border px-3 py-2"
          />
        </div>

        <div className="flex items-start gap-2 text-sm">
          <input
            id={termsId}
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
            className="mt-1"
          />
          <label htmlFor={termsId}>
            <Link to="/terms" className="underline">
              利用規約
            </Link>{' '}
            と{' '}
            <Link to="/privacy" className="underline">
              プライバシーポリシー
            </Link>{' '}
            に同意します
          </label>
        </div>

        {hasError && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          className="text-text-inverted hover:bg-accent-hover inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '設定中…' : '設定して始める'}
        </button>
      </form>
    </main>
  );
}
