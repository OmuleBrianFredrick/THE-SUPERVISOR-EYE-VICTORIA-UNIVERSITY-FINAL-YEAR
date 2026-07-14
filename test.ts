import { db } from './server/db/index.js';
import { sql, eq } from 'drizzle-orm';
import { users } from './server/db/schema.js';

async function t() {
  const ds = await db.query.users.findFirst({ where: eq(users.firstName, 'Daniel') });
  console.log(ds);
  process.exit(0);
}
t();
