import { db } from './server/db/index.js';
import { users } from './server/db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const result = await db.select().from(users).where(eq(users.email, 'christianekarel@gmail.com'));
  console.log(result);
  process.exit(0);
}
run().catch(console.error);
