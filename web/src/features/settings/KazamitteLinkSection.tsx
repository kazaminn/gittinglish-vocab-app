import { useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '../../lib/auth-client';
import {
  isAccountAlreadyLinkedError,
  translateAuthError,
  translateOAuthError,
} from '../auth/errors';
import { linkedAccountsQueryKey, useLinkedAccountsQuery } from './queries';

const PROVIDER_ID = 'kazamitte';

interface OAuthCallbackError {
  code: string | null;
  message: string;
}

/**
 * Lets an existing password user attach their Kazamitte ID without losing
 * progress, and lets them detach it again. Linking is deliberately manual:
 * the account row keeps a dummy email, so nothing can match it automatically
 * on sign-in, and being signed in here is what proves the local account
 * belongs to the user.
 */
export function KazamitteLinkSection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const statusId = useId();
  const soleMethodId = useId();
  const linkedAccounts = useLinkedAccountsQuery();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | undefined>();
  // Better Auth appends `?error=<code>` to errorCallbackURL, so that URL must
  // carry no query of its own or the code is lost behind the first parameter.
  const [linkError, setLinkError] = useState<OAuthCallbackError | undefined>(
    () => {
      if (!searchParams.has('error')) return undefined;
      const code = searchParams.get('error');
      return { code, message: translateOAuthError(code) };
    }
  );

  const kazamitteAccount = linkedAccounts.data?.find(
    (account) => account.providerId === PROVIDER_ID
  );
  const isLinked = Boolean(kazamitteAccount);
  const isSoleLoginMethod = isLinked && linkedAccounts.data?.length === 1;

  async function handleLink() {
    if (isRedirecting) return;
    setIsRedirecting(true);
    setLinkError(undefined);

    const result = await authClient.oauth2.link({
      providerId: PROVIDER_ID,
      callbackURL: '/app/settings',
      errorCallbackURL: '/app/settings',
    });

    if (result.error) {
      setLinkError({
        code: result.error.code ?? null,
        message: result.error.message ?? translateOAuthError(null),
      });
      setIsRedirecting(false);
      return;
    }

    // The client navigates by itself when the response carries a redirect, so
    // reaching here means it did not. Follow the URL rather than leaving the
    // button pending forever.
    const url = result.data?.url;
    if (typeof url === 'string' && url.length > 0) {
      window.location.href = url;
      return;
    }

    setLinkError({ code: null, message: translateOAuthError(null) });
    setIsRedirecting(false);
  }

  async function handleUnlink() {
    if (!kazamitteAccount || isUnlinking) return;
    setIsUnlinking(true);
    setUnlinkError(undefined);

    const result = await authClient.unlinkAccount({
      providerId: PROVIDER_ID,
      accountId: kazamitteAccount.accountId,
    });

    setIsUnlinking(false);
    setIsConfirmingUnlink(false);

    if (result.error) {
      setUnlinkError(translateAuthError(result.error));
      return;
    }

    // The server is the enforcement for "don't unlink the last login
    // method"; this call only reads the list to shape the UI. Refetching
    // here is what makes the section reflect the new state.
    await queryClient.invalidateQueries({ queryKey: linkedAccountsQueryKey });
  }

  async function handleSignOutAndRetry() {
    await authClient.signOut();
    void navigate('/login');
  }

  function handleKeepCurrentAccount() {
    setLinkError(undefined);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        kazamitte id
      </p>

      <p
        id={statusId}
        className="text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        {linkedAccounts.isPending
          ? 'checking link status...'
          : isLinked
            ? 'linked. you can sign in with your kazamitte id.'
            : 'not linked. link your kazamitte id to sign in while keeping your progress.'}
      </p>

      {linkError && (
        <div className="space-y-2">
          <p
            role="alert"
            aria-live="polite"
            className="text-sm"
            style={{ color: 'var(--text-error)' }}
          >
            {linkError.message}
          </p>

          {isAccountAlreadyLinkedError(linkError.code) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <button
                type="button"
                onClick={() => {
                  void handleSignOutAndRetry();
                }}
                className="underline"
                style={{ color: 'var(--text-accent)' }}
              >
                サインアウトしてその Kazamitte ID でログインする
              </button>
              <button
                type="button"
                onClick={handleKeepCurrentAccount}
                className="underline"
                style={{ color: 'var(--text-muted)' }}
              >
                このまま今のアカウントを使う
              </button>
            </div>
          )}
        </div>
      )}

      {unlinkError && (
        <p
          role="alert"
          aria-live="polite"
          className="text-sm"
          style={{ color: 'var(--text-error)' }}
        >
          {unlinkError}
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
          &gt; {isRedirecting ? 'authenticating...' : 'link kazamitte id'}
        </button>
      )}

      {isLinked && (
        <div className="space-y-2 pt-1">
          {isSoleLoginMethod && (
            <p
              id={soleMethodId}
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              this is your only login method. set a password first if you
              want to unlink it.
            </p>
          )}

          {!isConfirmingUnlink && (
            <button
              type="button"
              onClick={() => setIsConfirmingUnlink(true)}
              disabled={isUnlinking}
              aria-describedby={isSoleLoginMethod ? soleMethodId : undefined}
              className="rounded-sm border px-3 py-1.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'transparent',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              &gt; unlink kazamitte id
            </button>
          )}

          {isConfirmingUnlink && (
            <div
              className="space-y-2 rounded-sm border px-3 py-2"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                unlink kazamitte id? you will need a password or another
                login method to sign back in without it.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleUnlink()}
                  disabled={isUnlinking}
                  aria-busy={isUnlinking}
                  className="text-xs underline disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isUnlinking ? 'unlinking...' : 'yes, unlink it'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingUnlink(false)}
                  disabled={isUnlinking}
                  className="text-xs underline disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: 'var(--text-muted)' }}
                >
                  cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
