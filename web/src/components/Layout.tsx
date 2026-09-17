import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LogOut, Settings, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { settings } = useSettings();
  const { user } = useAuth();
  const userId = user?.username ?? user?.displayName ?? '';
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setIsMenuOpen(false);
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function handleLogout() {
    setIsMenuOpen(false);
    // Sign-out itself, plus the Kazamitte sign-out offer, live on /logout.
    void navigate('/logout');
  }

  return (
    <div
      className="min-h-screen font-mono"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: settings ? `${settings.fontSize}px` : undefined,
        fontWeight: settings?.fontWeight,
      }}
    >
      <header
        className="border-b px-3 py-3 text-sm"
        style={{
          background: 'var(--bg-primary)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="mx-auto flex max-w-(--container-max) items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              void navigate('/');
            }}
            className="rounded-sm bg-transparent p-0 text-inherit hover:underline focus-visible:underline"
            aria-label="Go to home"
          >
            gittinglish
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <ThemeToggle />
            {user && (
              <div className="relative min-w-0" ref={menuRef}>
                <button
                  type="button"
                  aria-label={`Open user menu, signed in as ${userId}`}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className="flex max-w-28 min-w-0 items-center gap-1.5 rounded-sm border px-2 py-1 transition-colors hover:bg-(--bg-interactive-hover) sm:max-w-48"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <UserRound
                    size={18}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span className="truncate">{userId}</span>
                </button>
                {isMenuOpen && (
                  <div
                    className="absolute top-10 right-0 z-10 min-w-48 rounded-sm border"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div
                      className="border-b px-3 py-2"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <p
                        className="truncate text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {user.displayName}
                      </p>
                      <p
                        className="truncate text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        id: {userId}
                      </p>
                    </div>
                    <div role="menu" aria-label="User menu" className="p-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsMenuOpen(false);
                          void navigate('/app/settings');
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-(--bg-interactive-hover)"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Settings size={16} aria-hidden="true" />
                        settings
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-(--bg-interactive-hover)"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <LogOut size={16} aria-hidden="true" />
                        logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
