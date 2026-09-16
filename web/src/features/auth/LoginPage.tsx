import { useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authClient, signIn } from '../../lib/auth-client';
import { translateAuthError, translateOAuthError } from './errors';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();
  const ssoErrorId = useId();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // The provider sends the browser back here on failure, so the only signal
  // available is the `error` code Better Auth appends to errorCallbackURL.
  // That URL must carry no query of its own, or the code lands in a second
  // `error` parameter and the first one wins.
  const [ssoError, setSsoError] = useState<string | undefined>(() =>
    searchParams.has('error')
      ? translateOAuthError(searchParams.get('error'))
      : undefined
  );

  const isBusy = isSubmitting || isRedirecting;
  const canSubmit = username.length > 0 && password.length > 0 && !isBusy;
  const hasError = Boolean(error);

  async function handleKazamitteSignIn() {
    if (isBusy) return;
    setIsRedirecting(true);
    setSsoError(undefined);

    // On success this never resolves normally: the call returns a redirect the
    // client follows, so the page is replaced.
    const result = await authClient.signIn.oauth2({
      providerId: 'kazamitte',
      callbackURL: '/app',
      errorCallbackURL: '/login',
    });

    if (result.error) {
      setSsoError(translateAuthError(result.error));
      setIsRedirecting(false);
    }
  }

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

      <div className="mb-6 flex flex-col gap-3">
        {ssoError && (
          <p
            id={ssoErrorId}
            role="alert"
            aria-live="polite"
            className="text-sm text-red-600"
          >
            {ssoError}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleKazamitteSignIn()}
          disabled={isBusy}
          aria-busy={isRedirecting}
          aria-describedby={ssoError ? ssoErrorId : undefined}
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRedirecting ? 'Kazamitte に移動中…' : 'Kazamitte でログイン'}
        </button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-text-muted text-xs">または</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
        noValidate
      >
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
            className="bg-bg rounded-md border border-border px-3 py-2"
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
            className="bg-bg rounded-md border border-border px-3 py-2"
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
          className="text-text-inverted hover:bg-accent-hover inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
