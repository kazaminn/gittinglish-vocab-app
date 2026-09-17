import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrivacyPage } from '../../../src/features/legal/PrivacyPage';
import { renderWithProviders } from '../../test-utils';

describe('PrivacyPage', () => {
  it('describes Kazamitte ID as the login provider, not Google/GitHub directly', () => {
    renderWithProviders(<PrivacyPage />);

    expect(screen.getAllByText(/Kazamitte ID/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /本サービスが Google や\s*GitHub と直接情報をやり取りすることはありません/
      )
    ).toBeInTheDocument();
  });

  it('does not claim to collect a hashed email address', () => {
    renderWithProviders(<PrivacyPage />);

    expect(screen.queryByText(/メールアドレス（ハッシュ化）/)).toBeNull();
    expect(
      screen.getByText(/ユーザーの実際のメールアドレスを取得・保持しません/)
    ).toBeInTheDocument();
  });

  it('says the display name is user-entered, not pulled from OAuth', () => {
    renderWithProviders(<PrivacyPage />);

    expect(
      screen.getByText(/ユーザー自身が入力したものです/)
    ).toBeInTheDocument();
  });

  it('discloses the hosting and database processors', () => {
    renderWithProviders(<PrivacyPage />);

    // Named in more than one place (the processor list and log retention),
    // so assert it is disclosed at all rather than disclosed exactly once.
    expect(screen.getAllByText(/Vercel/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Turso/)).toBeInTheDocument();
  });

  it('discloses that sessions record IP address and user agent', () => {
    renderWithProviders(<PrivacyPage />);

    expect(
      screen.getAllByText(/IP アドレス・ユーザーエージェント/)[0]
    ).toBeInTheDocument();
  });

  it('explains the two independent session layers', () => {
    renderWithProviders(<PrivacyPage />);

    expect(
      screen.getByText(/独立した 2 つのセッションが関わります/)
    ).toBeInTheDocument();
  });

  it('explains what browser localStorage holds and does not hold', () => {
    renderWithProviders(<PrivacyPage />);

    expect(
      screen.getByText(
        /パスワードやログイン用のトークン・セッション情報を localStorage/
      )
    ).toBeInTheDocument();
  });

  it('explains account deletion and Kazamitte ID unlinking', () => {
    renderWithProviders(<PrivacyPage />);

    expect(screen.getAllByText(/アカウントの削除/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Kazamitte ID の連携解除/)).toBeInTheDocument();
  });

  it('renders the collected-information table with real header cells', () => {
    renderWithProviders(<PrivacyPage />);

    const table = screen.getByRole('table');
    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((cell) => cell.textContent)).toEqual([
      '種類',
      'いつ取得',
      '何に使う',
    ]);
    expect(table).toBeInTheDocument();
  });

  it('names the operator and contact, and dates the policy to this rewrite', () => {
    renderWithProviders(<PrivacyPage />);

    expect(screen.getByText(/運営者: kazaminn/)).toBeInTheDocument();
    expect(screen.getAllByText('contact@kazamitte.com').length).toBeGreaterThan(
      0
    );
    expect(screen.getByText(/最終更新日: 2026年9月17日/)).toBeInTheDocument();
  });

  it('renders headings in order without skipping levels', () => {
    renderWithProviders(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /プライバシーポリシー/ })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(
      0
    );
  });
});
