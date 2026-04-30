import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, type AuthEnv } from './middleware/auth.js';
import answerRoutes from './routes/answers.js';
import sessionRoutes from './routes/sessions.js';
import userRoutes from './routes/users.js';
import { ApiError } from './utils/api-error.js';
import { err } from './utils/response.js';

const app = new Hono<AuthEnv>();
const allowedOrigin = process.env.CORS_ORIGIN;

app.use(
  '/api/*',
  cors(
    allowedOrigin
      ? {
          origin: allowedOrigin,
          allowMethods: ['GET', 'POST', 'OPTIONS'],
          allowHeaders: ['Content-Type', 'Authorization'],
        }
      : undefined
  )
);

// Public
app.get('/api/health', (c) =>
  c.json({
    ok: true,
    env: {
      hasTursoUrl: !!process.env.TURSO_URL,
      // Phase C で Better Auth 環境変数チェックに置換
      hasBetterAuthUrl: !!process.env.BETTER_AUTH_URL,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
    },
  })
);

// Protected routes
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

  return c.json(
    err('INTERNAL', 'Internal server error'),
    500
  );
});

export default app;
