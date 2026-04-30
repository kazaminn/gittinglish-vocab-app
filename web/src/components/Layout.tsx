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
  const { user, signOut } = useAuth();
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

  async function handleLogout() {
    await signOut();
    setIsMenuOpen(false);
    void navigate('/');
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
        <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-between gap-3">
          <span>gittinglish</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Open user menu"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className="rounded-sm border px-2 py-1"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <UserRound size={18} aria-hidden="true" />
                </button>
                {isMenuOpen && (
                  <div
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 top-10 z-10 min-w-40 rounded-sm border p-1"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void navigate('/settings');
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Settings size={16} aria-hidden="true" />
                      settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        void handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      logout
                    </button>
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
