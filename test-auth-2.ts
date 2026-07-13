import { db } from './server/db/index.js';
import { users } from './server/db/schema.js';

async function run() {
  const allUsers = await db.select().from(users);
  console.log("Total users:", allUsers.length);
  const falseOnboarding = allUsers.filter(u => !u.onboardingComplete);
  console.log("False onboarding:", falseOnboarding.length);
  process.exit(0);
}
run().catch(console.error);
