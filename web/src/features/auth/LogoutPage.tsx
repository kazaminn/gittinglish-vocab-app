import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authClient } from '../../lib/auth-client';
import { useServices } from '../../service';

// The provider's production origin is fixed, same as the issuer the server
// discovers against. Its sign-out is a page rather than a call: the session
// cookie there is same-site, so only a form on that origin can end it.
const KAZAMITTE_SIGN_OUT_URL = 'https://auth.kazamitte.com/sign-out';

const PROVIDER_ID = 'kazamitte';

/**
 * Where the logout menu lands. Signing out is done here rather than in the
 * header so there is somewhere to say what the click did and did not end: the
 * Gittinglish session stops, the Kazamitte ID session does not, and the Google
 * or GitHub session behind that one does not either.
 */
export function LogoutPage() {
  const { isLoading, user } = useAuth();
  const { progress, session } = useServices();
  const [isDone, setIsDone] = useState(false);
  const [hadKazamitte, setHadKazamitte] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (isLoading || hasStarted.current) return;
    hasStarted.current = true;

    void (async () => {
      if (user) {
        // Read the login methods while the session still exists — once it is
        // gone there is no way to tell whether Kazamitte ID was one of them.
        const accounts = await authClient.listAccounts();
        setHadKazamitte(
          accounts.error
            ? // Offering the link to someone who never used Kazamitte ID
              // costs them one ignored sentence; withholding it from someone
              // who did leaves them signed in believing they are not.
              true
            : (accounts.data ?? []).some(
                (account) => account.providerId === PROVIDER_ID
              )
        );

        // Drill progress and the in-flight session are kept in this browser
        // under the user's id. Nothing reads them back for a different
        // account, but on a shared machine they outlive the session that
        // produced them, so they go with it. A storage failure here must not
        // stop the sign-out — being left signed in is the worse outcome.
        try {
          await progress.resetProgress(user.id);
          await session.clearSession(user.id);
        } catch {
          // Ignored on purpose; see above.
        }

        await authClient.signOut();
      }
      setIsDone(true);
    })();
  }, [isLoading, user, progress, session]);

  if (!isDone) {
    return (
      <main className="mx-auto max-w-md px-6 py-12">
        <output aria-live="polite" className="text-text-muted text-sm">
          ログアウトしています…
        </output>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        ログアウトしました
      </h1>
      <p className="text-text-muted mb-6 text-sm">
        Gittinglish からログアウトしました。
      </p>

      {hadKazamitte && (
        <section className="mb-6 flex flex-col gap-2 rounded-md border border-border p-4">
          <h2 className="text-sm font-medium">Kazamitte ID は残っています</h2>
          <p className="text-text-muted text-sm">
            このままでは、次のログインで確認なしに同じアカウントに入ります。共有の端末を使っている場合は、こちらもログアウトしてください。
          </p>
          {/* The provider only redirects to its own origin after signing out,
              so opening in the same tab would strand the user there. */}
          <a
            href={KAZAMITTE_SIGN_OUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-inverted hover:bg-accent-hover inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium transition-colors"
          >
            Kazamitte ID からもログアウトする (別タブ)
          </a>
          <p className="text-text-muted text-xs">
            Kazamitte ID からログアウトしても、その先の Google / GitHub
            のログインは残ります。共有の端末では、そちらのログアウトも必要です。
          </p>
        </section>
      )}

      <p className="text-sm">
        <Link to="/login" className="underline">
          ログイン画面へ
        </Link>
      </p>
    </main>
  );
}
