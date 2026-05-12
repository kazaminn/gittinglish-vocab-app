// Export the Hono app directly so Vercel's native Hono detection runs it via
// the Web Standard Request/Response path. Wrapping it in @hono/node-server's
// handle() conflicts with Vercel's automatic JSON body parsing on POST and
// hangs the function until the 60s timeout (honojs/node-server#306).
import app from './src/app.js';

export default app;
