import { useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError, apiRequest } from '../../lib/api-client';
import { linkedAccountsQueryKey, useLinkedAccountsQuery } from './queries';

const CREDENTIAL_PROVIDER_ID = 'credential';
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Lets a user set a password. This matters most for a Kazamitte-only
 * sign-up: that account has exactly one login method (its `kazamitte`
 * account row), and Better Auth refuses to unlink a user's last remaining
 * method. Setting a password adds a second one, which is what makes
 * unlinking Kazamitte ID possible later.
 */
export function PasswordSection() {
  const fieldId = useId();
  const hintId = useId();
  const statusId = useId();
  const errorId = useId();

  const linkedAccounts = useLinkedAccountsQuery();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [justSet, setJustSet] = useState(false);

  const hasPassword =
    justSet ||
    (linkedAccounts.data?.some(
      (account) => account.providerId === CREDENTIAL_PROVIDER_ID
    ) ??
      false);

  const isValid =
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH;

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest<{ success: boolean }>('/api/users/password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: password }),
      }),
    onSuccess: () => {
      setJustSet(true);
      setPassword('');
      setError(undefined);
      void queryClient.invalidateQueries({ queryKey: linkedAccountsQueryKey });
    },
    onError: (mutationError: unknown) => {
      if (
        mutationError instanceof ApiClientError &&
        mutationError.code === 'PASSWORD_ALREADY_SET'
      ) {
        setError('このアカウントには既にパスワードが設定されています。');
        return;
      }
      setError('パスワードの設定に失敗しました。もう一度お試しください。');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || mutation.isPending) return;
    setError(undefined);
    mutation.mutate();
  }

  const showForm = !linkedAccounts.isPending && !hasPassword;

  return (
    <div className="space-y-2">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        password
      </p>

      <p
        id={statusId}
        className="text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        {linkedAccounts.isPending
          ? 'checking...'
          : hasPassword
            ? 'password set. you can sign in with your id and password.'
            : 'no password yet. setting one adds a second login method, which is what lets you unlink your kazamitte id.'}
      </p>

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm"
          style={{ color: 'var(--text-error)' }}
        >
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor={fieldId} className="text-sm">
              new password
            </label>
            <input
              id={fieldId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              autoComplete="new-password"
              aria-describedby={error ? `${hintId} ${errorId}` : hintId}
              aria-invalid={Boolean(error) || undefined}
              className="rounded-sm border px-3 py-2"
              style={{
                background: 'var(--bg-interactive)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <span
              id={hintId}
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              8-128 characters
            </span>
          </div>

          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            aria-busy={mutation.isPending}
            aria-describedby={statusId}
            className="w-full rounded-sm border px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'transparent',
              borderColor: 'var(--border-accent)',
              color: 'var(--text-accent)',
            }}
          >
            &gt; {mutation.isPending ? 'saving...' : 'set password'}
          </button>
        </form>
      )}
    </div>
  );
}
