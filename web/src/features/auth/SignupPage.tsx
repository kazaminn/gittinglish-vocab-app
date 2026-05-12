import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../lib/auth-client';
import { translateAuthError } from './errors';

export function SignupPage() {
  const navigate = useNavigate();
  const usernameId = useId();
  const passwordId = useId();
  const passwordHintId = useId();
  const displayNameId = useId();
  const termsId = useId();
  const errorId = useId();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    agreed && username.length >= 3 && password.length >= 8 && !isSubmitting;
  const hasError = Boolean(error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(undefined);

    const result = await signUp.email({
      email: `${username}@local.invalid`,
      password,
      name: displayName.trim() || username,
      username,
    });

    if (result.error) {
      setError(translateAuthError(result.error));
      setIsSubmitting(false);
      return;
    }

    void navigate('/app');
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">サインアップ</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
            aria-describedby={hasError ? errorId : undefined}
            className="border-border bg-bg rounded-md border px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={passwordId} className="text-sm">
            パスワード (8 文字以上)
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError ? `${passwordHintId} ${errorId}` : passwordHintId
            }
            className="border-border bg-bg rounded-md border px-3 py-2"
          />
          <span id={passwordHintId} className="text-text-muted text-xs">
            推奨: 15 文字以上のパスフレーズ (例: 単語を 4〜5 個つなげたもの)
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
            className="border-border bg-bg rounded-md border px-3 py-2"
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
          {isSubmitting ? 'サインアップ中…' : 'サインアップ'}
        </button>

        <p className="text-text-muted text-center text-xs">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login" className="underline">
            ログイン
          </Link>
        </p>
      </form>
    </main>
  );
}
