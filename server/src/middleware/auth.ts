// Better Auth セッション (cookie) を検証して userId 等を Hono Context に注入する middleware。
// クライアントは fetch を `credentials: 'include'` で叩くこと。

import { createMiddleware } from 'hono/factory';
import { auth } from '../auth/index.js';
import { err } from '../utils/response.js';

export type AuthEnv = {
  Variables: {
    userId: string;
    username: string | undefined;
    userDisplayName: string | undefined;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json(err('UNAUTHORIZED', 'No active session'), 401);
  }

  c.set('userId', session.user.id);
  c.set('username', session.user.username ?? undefined);
  c.set('userDisplayName', session.user.name ?? undefined);
  await next();
});
