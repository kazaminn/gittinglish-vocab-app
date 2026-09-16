import { useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import { translateOAuthError } from '../auth/errors';
import { useLinkedAccountsQuery } from './queries';

const PROVIDER_ID = 'kazamitte';

/**
 * Lets an existing password user attach their Kazamitte identity without
 * losing progress. Linking is deliberately manual: the account row keeps a
 * dummy email, so nothing can match it automatically on sign-in, and being
 * signed in here is what proves the local account belongs to the user.
 */
export function KazamitteLinkSection() {
  const [searchParams] = useSearchParams();
  const statusId = useId();
  const linkedAccounts = useLinkedAccountsQuery();
  const [isRedirecting, setIsRedirecting] = useState(false);
  // Better Auth appends `?error=<code>` to errorCallbackURL, so that URL must
  // carry no query of its own or the code is lost behind the first parameter.
  const [error, setError] = useState<string | undefined>(() =>
    searchParams.has('error')
      ? translateOAuthError(searchParams.get('error'))
      : undefined
  );

  const isLinked = linkedAccounts.data?.some(
    (account) => account.providerId === PROVIDER_ID
  );

  async function handleLink() {
    if (isRedirecting) return;
    setIsRedirecting(true);
    setError(undefined);

    // Resolves only on failure; success replaces the page with the provider's.
    const result = await authClient.oauth2.link({
      providerId: PROVIDER_ID,
      callbackURL: '/app/settings',
      errorCallbackURL: '/app/settings',
    });

    if (result.error) {
      setError(result.error.message ?? translateOAuthError(null));
      setIsRedirecting(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        kazamitte sso
      </p>

      <p
        id={statusId}
        className="text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        {linkedAccounts.isPending
          ? 'checking link status...'
          : isLinked
            ? 'linked. you can sign in with kazamitte.'
            : 'not linked. link to sign in with kazamitte while keeping your progress.'}
      </p>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="text-sm"
          style={{ color: 'var(--text-error)' }}
        >
          {error}
        </p>
      )}

      {!isLinked && (
        <button
          type="button"
          onClick={() => void handleLink()}
          disabled={isRedirecting || linkedAccounts.isPending}
          aria-busy={isRedirecting}
          aria-describedby={statusId}
          className="w-full rounded-sm border px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'transparent',
            borderColor: 'var(--border-accent)',
            color: 'var(--text-accent)',
          }}
        >
          &gt; {isRedirecting ? 'redirecting...' : 'link kazamitte account'}
        </button>
      )}
    </div>
  );
}
