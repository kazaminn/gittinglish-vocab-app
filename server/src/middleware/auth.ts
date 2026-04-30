// Phase A: Firebase Admin 依存を削除済み。Phase C で Better Auth に置換予定。
// 現状はダミー実装で「常にローカルユーザーで認証成功」とする。

import { createMiddleware } from 'hono/factory';

export type AuthEnv = {
  Variables: {
    userId: string;
    userEmail: string | undefined;
    userDisplayName: string | undefined;
  };
};

const FALLBACK_USER_ID = 'local-user';

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  c.set('userId', FALLBACK_USER_ID);
  c.set('userEmail', undefined);
  c.set('userDisplayName', 'Local User');
  await next();
});
