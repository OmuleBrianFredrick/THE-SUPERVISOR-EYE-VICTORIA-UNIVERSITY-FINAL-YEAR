import { db } from './server/db/index.js';
import { users } from './server/db/schema.js';

async function run() {
  const allUsers = await db.select().from(users);
  const simpson = allUsers.find(u => u.email.toLowerCase().includes('simpson'));
  console.log(simpson?.email);
  process.exit(0);
}
run().catch(console.error);
