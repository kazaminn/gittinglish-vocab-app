# gittinglish

A small learning project: a vocab drill app for **85 hand-picked English verbs**
that show up a lot when you read Git / GitHub / engineering English. CLI-flavored
UI, SM-2 spaced repetition, and a deliberately boring stack so the code stays
readable.

Live demo: <https://gittinglish.kazamitte.com>

## Motivation

Reading Git / GitHub docs in English gets draining when a handful of verbs keep
tripping you up — _amend, rebase, squash, supersede, propagate, deprecate, …_.

This project tackles that friction with a daily 5-minute drill, backed by a
hand-curated dataset informed by a frequency analysis of 118,234 commits from
public repositories. The dataset, the stack, and the deploy plumbing are all
designed as parts of a single end-to-end learning project.

## Stack

- **Frontend**: React 19 + Vite + TanStack Query + Tailwind CSS v4
- **Backend**: Hono on Vercel Functions (Node.js runtime, native Hono export)
- **Auth**: [Better Auth](https://better-auth.com/) with the username plugin (cookie session, no email)
- **Database**: Turso (libsql) + Drizzle ORM, SQLite locally
- **Spaced repetition**: SM-2
- **Package manager**: pnpm workspaces

## Architecture

Three layers, each independently swappable:

```
UI layer (web/src/components, features)
   └─ presentational only, no service imports

Logic layer (web/src/hooks, web/src/lib)
   └─ wires UI to data, owns SM-2 calculation

Data / API layer (web/src/service, server/src)
   └─ Hono REST endpoints, Drizzle queries, Better Auth handlers
```

The Vercel function entry (`api/vercel.ts`) re-exports the Hono app as a
Web-Standard handler — Vercel's native Hono detection takes care of the
runtime adapter, so there is no `@hono/node-server` glue in the deploy path.

## Project layout

```
.
├── api/        Vercel function entry (re-exports Hono app)
├── data/       gitverbs85 problem JSON (word → meaning, meaning → word, cloze)
├── server/     Hono app, Better Auth, Drizzle schema + migrations
├── shared/     Cross-package types and domain constants
├── web/        Vite SPA (React 19)
├── vercel.json Function config + SPA fallback rewrites
└── docs/       Design notes
```

## Quick start

```bash
pnpm install

# 1. Apply the SQLite schema to the local Drizzle DB (first time only)
pnpm -C server exec drizzle-kit push

# 2. Run API (port 3001) and web (port 5173) in two terminals
pnpm dev:api
pnpm dev:web
```

Open <http://localhost:5173>. Vite proxies `/api/*` to the Hono server on
`:3001`. With no environment variables set, the server falls back to a local
SQLite file (`server/local.db`) and dev-only auth secrets — fine for local
work, never use as-is in production.

### Skipping auth in local dev

If you just want to poke at the UI without going through signup, flip
`SKIP_AUTHENTIFICATION` to `true` in **both** `server/src/auth/dev-skip.ts` and
`web/src/lib/dev-auth.ts`, then seed a `testuser` row:

```bash
pnpm -C server seed:dev
```

The skip is gated by hostname (`localhost` / `127.0.0.1`) and dev mode, so it
cannot accidentally activate in a production build. The seed only inserts a
`user` row — it never writes a password, hashed or otherwise, so there is no
credential to leak.

### Environment variables (server)

Only required when deploying or pointing at a real Turso DB:

| Var | Purpose |
| --- | --- |
| `TURSO_URL` | libsql URL of the Turso DB. Use the `https://…` form for serverless deploys. |
| `TURSO_AUTH_TOKEN` | Turso auth token. |
| `BETTER_AUTH_URL` | Public base URL of the deployment. |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32`. |
| `EMAIL_HASH_SECRET` | `openssl rand -base64 32`. Used to hash OAuth emails so plaintext is never stored. |
| `CORS_ORIGIN` | Optional. Set when serving the SPA from a different origin than the API. |

OAuth (`GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`) is wired up in code
but currently disabled — planned to be enabled in a future iteration.

## Deploy

This repo is set up for Vercel. The `vercel.json` declares a single function
(`api/vercel.ts`, 1 GB / 60 s) and rewrites `/api/*` to it; everything else
falls through to the SPA build at `web/dist`. After flipping the project to a
real Turso DB, run `drizzle-kit push` once against the production URL to apply
the schema.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Commits follow
`<emoji> <type>(<scope>): <subject>` (commitlint-enforced) and PRs target `main`.

## Credits

The 85 verbs were curated by hand, informed by a frequency analysis of public
GitHub repositories. Definitions and example sentences were drafted by
**Claude Opus 4.7**.

## License

MIT — see [LICENSE](./LICENSE).