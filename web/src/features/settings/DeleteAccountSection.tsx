import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ApiClientError, apiRequest } from '../../lib/api-client';
import { authClient } from '../../lib/auth-client';

/**
 * Deletes the Gittinglish account and everything keyed to it (drill
 * progress, answer history, activity stats). This is unrelated to signing
 * out and unrelated to unlinking Kazamitte ID: the Kazamitte ID account
 * lives in a different service, is shared with other Kazamitte apps, and is
 * never touched here.
 *
 * Deliberately the quietest control on the page — muted colors throughout,
 * no accent border — because it is the one irreversible action in the app.
 * Confirmation is retyping the account's own id, not window.confirm.
 */
export function DeleteAccountSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fieldId = useId();
  const hintId = useId();
  const errorId = useId();

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const username = user?.username;
  const isMatch = username !== undefined && confirmValue === username;

  function handleCancel() {
    setIsConfirming(false);
    setConfirmValue('');
    setError(undefined);
  }

  async function handleDelete() {
    if (!isMatch || isDeleting) return;
    setIsDeleting(true);
    setError(undefined);

    try {
      await apiRequest<{ success: boolean }>('/api/users/me', {
        method: 'DELETE',
        body: JSON.stringify({ confirmUsername: confirmValue }),
      });
      await authClient.signOut();
      void navigate('/');
    } catch (deleteError: unknown) {
      if (
        deleteError instanceof ApiClientError &&
        deleteError.code === 'CONFIRMATION_MISMATCH'
      ) {
        setError('入力した ID が一致しませんでした。');
      } else {
        setError('アカウントの削除に失敗しました。もう一度お試しください。');
      }
      setIsDeleting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isMatch || isDeleting) return;
    void handleDelete();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        delete account
      </p>

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        permanently deletes your Gittinglish account and all drill progress,
        answer history and activity stats. this cannot be undone. your Kazamitte
        ID itself is not deleted — you can still use it to sign in to other
        Kazamitte apps.
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

      {!isConfirming && (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="rounded-sm border px-3 py-1.5 text-left text-xs"
          style={{
            background: 'transparent',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          &gt; delete account
        </button>
      )}

      {isConfirming && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-sm border px-3 py-2"
          style={{ borderColor: 'var(--border-subtle)' }}
          noValidate
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            this is permanent. type your id (
            <span style={{ color: 'var(--text-secondary)' }}>{username}</span>)
            to confirm.
          </p>

          <div className="flex flex-col gap-1">
            <label htmlFor={fieldId} className="sr-only text-xs">
              confirm account id
            </label>
            <input
              id={fieldId}
              type="text"
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={isDeleting}
              aria-describedby={error ? `${hintId} ${errorId}` : hintId}
              aria-invalid={Boolean(error) || undefined}
              className="rounded-sm border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'var(--bg-interactive)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <span id={hintId} className="sr-only">
              retype {username} exactly to enable the delete button
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isMatch || isDeleting}
              aria-busy={isDeleting}
              className="text-xs underline disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: 'var(--text-error)' }}
            >
              {isDeleting ? 'deleting...' : 'yes, delete my account'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isDeleting}
              className="text-xs underline disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: 'var(--text-muted)' }}
            >
              cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
