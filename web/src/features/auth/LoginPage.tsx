import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../../lib/auth-client';
import { translateAuthError } from './errors';

export function LoginPage() {
  const navigate = useNavigate();
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = username.length > 0 && password.length > 0 && !isSubmitting;
  const hasError = Boolean(error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(undefined);

    const result = await signIn.username({ username, password });

    if (result.error) {
      setError(translateAuthError(result.error));
      setIsSubmitting(false);
      return;
    }

    void navigate('/app');
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">ログイン</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor={usernameId} className="text-sm">
            ID
          </label>
          <input
            id={usernameId}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            className="border-border bg-bg rounded-md border px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={passwordId} className="text-sm">
            パスワード
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            className="border-border bg-bg rounded-md border px-3 py-2"
          />
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
          className="bg-accent text-text-inverted hover:bg-accent-hover inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'ログイン中…' : 'ログイン'}
        </button>

        <p className="text-text-muted text-center text-xs">
          まだアカウントが無い方は{' '}
          <Link to="/signup" className="underline">
            サインアップ
          </Link>
        </p>
      </form>
    </main>
  );
}
