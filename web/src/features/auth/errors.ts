export function translateAuthError(input: {
  code?: string;
  message?: string;
}): string {
  const code = input.code ?? '';
  const msg = input.message ?? '';

  // Better Auth's own last-account-standing guard (`/unlink-account`) refuses
  // to remove the only remaining login method. The user needs a next step,
  // not just a failure: set a password before the Kazamitte ID link can go.
  if (
    code === 'FAILED_TO_UNLINK_LAST_ACCOUNT' ||
    /unlink.*last account|last account.*unlink/i.test(msg)
  ) {
    return 'Kazamitte ID は現在唯一のログイン方法です。連携を解除するには、先にパスワードを設定してください。';
  }
  // `/unlink-account` runs behind freshSessionMiddleware, and freshAge
  // defaults to 24 hours while the session itself lasts days. Signing in
  // yesterday and unlinking today is therefore an ordinary thing to do and an
  // ordinary thing to be refused for, so name the remedy rather than the rule.
  if (code === 'SESSION_NOT_FRESH' || /session is not fresh/i.test(msg)) {
    return 'この操作には最近のログインが必要です。一度ログアウトしてから、ログインし直してお試しください。';
  }
  if (
    code === 'INVALID_CREDENTIALS' ||
    /invalid (username|email|password|credentials)/i.test(msg)
  ) {
    return 'ID またはパスワードが正しくありません。';
  }
  if (
    code === 'USER_ALREADY_EXISTS' ||
    /already (exists|registered)/i.test(msg)
  ) {
    return 'この ID は既に使われています。';
  }
  if (
    code === 'USERNAME_ALREADY_EXISTS' ||
    code === 'USERNAME_IS_ALREADY_TAKEN' ||
    /username.*(exists|taken)/i.test(msg)
  ) {
    return 'この ID は既に使われています。';
  }
  if (code === 'INVALID_USERNAME' || /username is invalid/i.test(msg)) {
    return 'ID に使えるのは半角英数字と _ . のみです。';
  }
  if (code === 'PASSWORD_TOO_SHORT' || /password.*(short|min)/i.test(msg)) {
    return 'パスワードは 8 文字以上で入力してください。';
  }
  if (code === 'PASSWORD_TOO_LONG' || /password.*(long|max)/i.test(msg)) {
    return 'パスワードは 128 文字以下で入力してください。';
  }
  if (code === 'USERNAME_TOO_SHORT' || /username.*(short|min)/i.test(msg)) {
    return 'ID は 3 文字以上で入力してください。';
  }
  if (code === 'USERNAME_TOO_LONG' || /username.*(long|max)/i.test(msg)) {
    return 'ID は 32 文字以下で入力してください。';
  }
  if (msg) return msg;
  return '認証エラーが発生しました。時間をおいて再度お試しください。';
}

/**
 * Better Auth's generic-oauth routes report failures by redirecting to the
 * error URL with `?error=<code>`. Surfacing the code matters: the provider
 * side of a failed exchange is only visible in its server log, so an opaque
 * message here means the real cause cannot be reached from the browser.
 */
export function translateOAuthError(code: string | null): string {
  switch (code) {
    case 'invalid_client':
    case 'oauth_code_verification_failed':
      return 'Kazamitte ID との通信に失敗しました。設定を確認してください。';
    case 'issuer_mismatch':
    case 'issuer_missing':
      return 'Kazamitte ID の応答が想定と異なります。設定を確認してください。';
    case 'email_is_missing':
    case 'name_is_missing':
    case 'user_info_is_missing':
      return 'Kazamitte ID から必要な情報を取得できませんでした。';
    case "email_doesn't_match":
      return 'ログイン中のアカウントと異なる Kazamitte ID です。';
    case 'account_already_linked_to_different_user':
      return 'この Kazamitte ID は既に別のアカウントと連携されています。';
    case 'account_not_linked':
      return 'この Kazamitte ID は連携されていません。設定画面から連携してください。';
    case 'signup_disabled':
      return 'Kazamitte ID での新規登録は現在受け付けていません。';
    case 'unable_to_link_account':
    case 'unable_to_create_user':
    case 'unable_to_create_session':
      return 'アカウントの作成に失敗しました。時間をおいて再度お試しください。';
    case null:
    case '':
      return '認証エラーが発生しました。時間をおいて再度お試しください。';
    default:
      // Unknown codes are shown verbatim so a report names the real failure.
      return `Kazamitte ID でのログインに失敗しました (${code})`;
  }
}

/**
 * `account_already_linked_to_different_user` means the Kazamitte ID belongs
 * to another Gittinglish account. Never resolve or display which one — that
 * would be an account-enumeration leak — but the user is not stuck: they can
 * sign out and sign in with that Kazamitte ID directly, or stay on the
 * account they are already using. Callers use this to decide whether to
 * offer that choice alongside the translated message.
 */
export function isAccountAlreadyLinkedError(
  code: string | null | undefined
): boolean {
  return code === 'account_already_linked_to_different_user';
}
