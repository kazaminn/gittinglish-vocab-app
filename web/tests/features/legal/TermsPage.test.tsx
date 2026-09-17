import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TermsPage } from '../../../src/features/legal/TermsPage';
import { renderWithProviders } from '../../test-utils';

describe('TermsPage', () => {
  it('describes Kazamitte ID and ID/password as the login methods, not direct Google/GitHub login', () => {
    renderWithProviders(<TermsPage />);

    expect(screen.getByText(/Kazamitte ID/)).toBeInTheDocument();
    expect(
      screen.getByText(/ID・パスワードでの認証が必要です/)
    ).toBeInTheDocument();
  });
});
