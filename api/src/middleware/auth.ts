// Better Auth セッション (cookie) を検証して userId 等を Hono Context に注入する middleware。
// クライアントは fetch を `credentials: 'include'` で叩くこと。

import { createMiddleware } from 'hono/factory';
import { auth } from '../auth/index.js';
import { isDevAuthSkipActive, TEST_USER } from '../auth/dev-skip.js';
import { err } from '../utils/response.js';

export type AuthEnv = {
  Variables: {
    userId: string;
    username: string | undefined;
    userDisplayName: string | undefined;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  if (isDevAuthSkipActive(c.req.raw)) {
    c.set('userId', TEST_USER.id);
    c.set('username', TEST_USER.username);
    c.set('userDisplayName', TEST_USER.name);
    await next();
    return;
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json(err('UNAUTHORIZED', 'No active session'), 401);
  }

  c.set('userId', session.user.id);
  c.set('username', session.user.username ?? undefined);
  c.set('userDisplayName', session.user.name ?? undefined);
  await next();
});
