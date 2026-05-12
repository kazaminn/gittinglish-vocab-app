export function translateAuthError(input: {
  code?: string;
  message?: string;
}): string {
  const code = input.code ?? '';
  const msg = input.message ?? '';

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
    /username.*(exists|taken)/i.test(msg)
  ) {
    return 'この ID は既に使われています。';
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
