import { describe, expect, it } from 'vitest';
import {
  isAccountAlreadyLinkedError,
  translateAuthError,
  translateOAuthError,
} from '../../../src/features/auth/errors';

describe('translateAuthError', () => {
  it('names the remedy when the last login method cannot be unlinked', () => {
    expect(
      translateAuthError({
        code: 'FAILED_TO_UNLINK_LAST_ACCOUNT',
        message: "You can't unlink your last account",
      })
    ).toBe(
      'Kazamitte ID は現在唯一のログイン方法です。連携を解除するには、先にパスワードを設定してください。'
    );
  });

  it('tells a stale session to sign in again rather than quoting the rule', () => {
    const translated = translateAuthError({
      code: 'SESSION_NOT_FRESH',
      message: 'Session is not fresh',
    });

    expect(translated).toContain('ログインし直して');
    expect(translated).not.toContain('fresh');
  });

  it('translates the username plugin codes', () => {
    expect(
      translateAuthError({
        code: 'USERNAME_IS_ALREADY_TAKEN',
        message: 'Username is already taken. Please try another.',
      })
    ).toBe('この ID は既に使われています。');
    expect(
      translateAuthError({
        code: 'INVALID_USERNAME',
        message: 'Username is invalid',
      })
    ).toBe('ID に使えるのは半角英数字と _ . のみです。');
  });

  it('falls back to the raw message so an unmapped failure is still nameable', () => {
    expect(translateAuthError({ code: 'SOMETHING_NEW', message: 'boom' })).toBe(
      'boom'
    );
  });
});

describe('translateOAuthError', () => {
  it('calls the identity Kazamitte ID everywhere', () => {
    const codes = [
      'invalid_client',
      'issuer_mismatch',
      'email_is_missing',
      "email_doesn't_match",
      'account_already_linked_to_different_user',
      'account_not_linked',
      'signup_disabled',
    ];

    for (const code of codes) {
      const translated = translateOAuthError(code);
      expect(translated).toContain('Kazamitte ID');
      // "Kazamitte アカウント" and bare "Kazamitte" were the other two names
      // the UI used for the same thing.
      expect(translated).not.toContain('Kazamitte アカウント');
    }
  });

  it('never names the account that already owns the identity', () => {
    expect(
      translateOAuthError('account_already_linked_to_different_user')
    ).toBe('この Kazamitte ID は既に別のアカウントと連携されています。');
  });

  it('shows an unknown code verbatim so a report can name the real failure', () => {
    expect(translateOAuthError('brand_new_code')).toContain('brand_new_code');
  });
});

describe('isAccountAlreadyLinkedError', () => {
  it('matches only the linked-elsewhere code', () => {
    expect(
      isAccountAlreadyLinkedError('account_already_linked_to_different_user')
    ).toBe(true);
    expect(isAccountAlreadyLinkedError('account_not_linked')).toBe(false);
    expect(isAccountAlreadyLinkedError(null)).toBe(false);
    expect(isAccountAlreadyLinkedError(undefined)).toBe(false);
  });
});
