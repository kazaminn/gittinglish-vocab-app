// Seed for the local dev auth bypass (SKIP_AUTHENTIFICATION).
// Inserts a single user row idempotently; deliberately writes NO row to the
// account table, so no password (plaintext or hashed) is ever stored. The
// bypass middleware is the only path that treats this user as authenticated.
//
// Run: pnpm -C server seed:dev
import { eq } from 'drizzle-orm';
import { TEST_USER } from '../src/auth/dev-skip.js';
import { user } from '../src/db/auth-schema.js';
import { db } from '../src/db/client.js';

const existing = await db
  .select({ id: user.id })
  .from(user)
  .where(eq(user.id, TEST_USER.id));

if (existing.length === 0) {
  await db.insert(user).values({
    id: TEST_USER.id,
    name: TEST_USER.name,
    email: TEST_USER.email,
    username: TEST_USER.username,
    displayUsername: TEST_USER.username,
  });
  console.log(`Inserted ${TEST_USER.id}`);
} else {
  console.log(`${TEST_USER.id} already exists`);
}

process.exit(0);
