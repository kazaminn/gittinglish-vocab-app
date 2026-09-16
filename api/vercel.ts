// The only file under `api/`, and deliberately so: Vercel turns every file in
// this directory into a Serverless Function, and the app needs exactly one.
// The implementation lives in `server/`, where it is plain source rather than
// a deployment surface.
//
// Exported directly so Vercel's native Hono detection runs it via the Web
// Standard Request/Response path. Wrapping it in @hono/node-server's handle()
// conflicts with Vercel's automatic JSON body parsing on POST and hangs the
// function until the 60s timeout (honojs/node-server#306).
import app from '../server/src/app.js';

export default app;
