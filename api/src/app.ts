import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth/index.js';
import { authMiddleware, type AuthEnv } from './middleware/auth.js';
import answerRoutes from './routes/answers.js';
import sessionRoutes from './routes/sessions.js';
import userRoutes from './routes/users.js';
import { ApiError } from './utils/api-error.js';
import { err } from './utils/response.js';

const app = new Hono<AuthEnv>();
const isDev = process.env.NODE_ENV !== 'production';
// In production CORS_ORIGIN must be set explicitly; in dev fall back to the
// Vite dev server (5173). credentials:true requires a concrete origin string,
// not '*', because cookies are part of the auth flow.
const allowedOrigin =
  process.env.CORS_ORIGIN ?? (isDev ? 'http://localhost:5173' : undefined);

app.use(
  '/api/*',
  cors(
    allowedOrigin
      ? {
          origin: allowedOrigin,
          credentials: true,
          allowMethods: ['GET', 'POST', 'OPTIONS'],
          allowHeaders: ['Content-Type'],
        }
      : undefined
  )
);

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    env: {
      hasTursoUrl: !!process.env.TURSO_URL,
      hasBetterAuthUrl: !!process.env.BETTER_AUTH_URL,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
    },
  })
);

app.use('/api/sessions/*', authMiddleware);
app.use('/api/sessions', authMiddleware);
app.use('/api/answers/*', authMiddleware);
app.use('/api/answers', authMiddleware);
app.use('/api/users/*', authMiddleware);

app.route('/api/sessions', sessionRoutes);
app.route('/api/answers', answerRoutes);
app.route('/api/users', userRoutes);

app.onError((e, c) => {
  console.error('Unhandled error:', e);
  if (e instanceof ApiError) {
    return c.json(err(e.code, e.message), e.status);
  }

  return c.json(err('INTERNAL', 'Internal server error'), 500);
});

export default app;
