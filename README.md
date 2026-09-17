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

**`api/` must hold that one file and nothing else.** Vercel turns every file
under it into a Serverless Function, and the Hobby plan caps a deployment at
12 — so a second file there costs a function slot even though only the entry
ever serves a request. Application code belongs in `server/`.

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
| `KAZAMITTE_AUTH_CLIENT_ID` | OAuth client ID issued by kazamitte-auth. |
| `KAZAMITTE_AUTH_CLIENT_SECRET` | Matching secret. Shown once at creation. |
| `KAZAMITTE_AUTH_ISSUER` | Optional. Defaults to `https://auth.kazamitte.com/api/auth`. |

OAuth (`GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`) is wired up in code
but currently disabled — planned to be enabled in a future iteration.

### Kazamitte SSO

`auth.kazamitte.com` is the shared identity provider for kazamitte apps. It is
registered here as a generic OAuth provider (`providerId: kazamitte`), enabled
only when both `KAZAMITTE_AUTH_CLIENT_ID` and `KAZAMITTE_AUTH_CLIENT_SECRET`
are set, so a half-configured deployment simply keeps password login.

Endpoints are read from the issuer's discovery document rather than hardcoded.
The one value that is fixed on both sides is the redirect URI, which
kazamitte-auth matches exactly:

```text
https://gittinglish.kazamitte.com/api/auth/oauth2/callback/kazamitte
```

That path comes from better-auth's generic-oauth plugin on the 1.6 line. It
moves to `/api/auth/callback/kazamitte` on 1.7, so upgrading means registering
the new URI with kazamitte-auth first. `web/tests/lib/auth-client.test.ts` pins
the current paths so the change cannot pass unnoticed. `BETTER_AUTH_URL` must
be the production origin for the redirect URI to line up.

**Only `openid` is requested.** kazamitte-auth never puts email in its ID
token and gittinglish never needed the profile/email claims it was receiving
from UserInfo, so nothing but the subject is asked for. A `mapProfileToUser`
on the provider config synthesizes what Better Auth still requires to create
a user — `<subject>@local.invalid` for the email, the subject itself for the
name — directly from that subject, before the request ever reaches the
provider's UserInfo endpoint for real profile data.

**Linking is always explicit.** `user.email` is always a synthesized
`@local.invalid` address (see above, and the password signup form), so it can
never equal a real address and no account is ever matched automatically at
sign-in — `kazamitte` is deliberately absent from `trustedProviders`. Existing
users attach their identity from `/app/settings` while signed in, which is
what proves the local account is theirs; that endpoint rejects a mismatched
address unless `accountLinking.allowDifferentEmails` is set, which is why it
is. Signing in with an unlinked Kazamitte identity creates a new account.

**A Kazamitte sign-up is only half an account.** The subject is all that's
available, so it stands in for both the name and the email local part.
`/app/setup` is where the user picks their real ID; the sign-in call points
`newUserCallbackURL` at it, and `ProtectedRoute` keeps sending them back until
`user.username` exists, so a reload or a bookmark cannot strand a half-created
account. It is also the only place a Kazamitte sign-up is shown the terms,
which the password form asks for at sign-up. A `databaseHooks.user.create`
guard also forces `image` to `null` unconditionally, so a future scope change
or a second SSO provider can't reintroduce an avatar without a deliberate
change to that hook, and refuses (rather than stores) any user row that still
carries a real, non-`@local.invalid` email.

**A Kazamitte-only account has exactly one login method.** Its only `account`
row is `providerId: kazamitte`, and Better Auth refuses to unlink a user's
last remaining method, so that user can never detach from Kazamitte ID as
things stand. `POST /api/users/password` (behind `authMiddleware`) gives them
a way out: it sets a password, which becomes a second method. It exists as
its own route because Better Auth's `auth.api.setPassword` on this
better-auth version is a real function but is never mounted over HTTP — its
`createAuthEndpoint()` call passes no path, so better-call's router skips it.
The route calls that function directly, forwarding the request headers so
Better Auth resolves the session itself; a `PASSWORD_ALREADY_SET` response
means the account already has one.

**No provider tokens are ever stored.** Gittinglish only uses Kazamitte ID
(and, if enabled later, Google/GitHub) to establish who's signing in — it
never calls a provider's API on the user's behalf. A
`databaseHooks.account.create`/`update` guard blanks `accessToken`,
`refreshToken`, `idToken`, and both expiry columns before every account row is
written, including on every re-sign-in, so nothing unencrypted and unused
sits in the database as a liability.

### Account deletion

`DELETE /api/users/me` (behind `authMiddleware`) permanently deletes the
signed-in Gittinglish account: the `user` row, its `session`/`account` rows
(cascade via FK), and every row in `session_writes`, `drill_progress`,
`answer_logs` and `user_activities` — those four carry a plain `user_id` with
no FK to `user`, so they're deleted explicitly, in one `db.transaction()`
alongside the `user` row. The request body must include `confirmUsername`
matching the caller's own `username`, taken from the session — never from the
body — so a mismatch (or someone else's id) is rejected before anything is
touched. This does **not** delete the Kazamitte ID account: that identity
lives in kazamitte-auth and is shared with other Kazamitte apps, and deleting
a Gittinglish account never reaches it.

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