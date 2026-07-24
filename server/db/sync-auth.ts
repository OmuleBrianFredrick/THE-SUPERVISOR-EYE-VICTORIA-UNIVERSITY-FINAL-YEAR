import { adminAuth } from '../lib/firebase-admin.js';
import { db } from './index.js';
import { users } from './schema.js';

export async function syncMockUsersToFirebase() {
  console.log('Fetching users from PostgreSQL to sync with Firebase Auth...');
  
  const allUsers = await db.select().from(users);
  let successCount = 0;
  let errorCount = 0;

  for (const user of allUsers) {
    try {
      // Check if user already exists
      try {
        await adminAuth.getUser(user.firebaseUid);
        console.log(`User ${user.email} already exists in Firebase Auth. Skipping.`);
        continue; // User exists
      } catch (e: any) {
        if (e.code !== 'auth/user-not-found') {
          throw e; // re-throw if it's not a 'not-found' error
        }
      }

      // Create the user in Firebase Auth
      await adminAuth.createUser({
        uid: user.firebaseUid,
        email: user.email,
        password: 'Password123!', // Default password for all mock users
        displayName: `${user.firstName} ${user.lastName}`,
      });
      console.log(`Successfully created Firebase Auth user for ${user.email}`);
      successCount++;
    } catch (error: any) {
      console.error(`Failed to create Firebase Auth user for ${user.email}:`, error.message);
      errorCount++;
    }
  }

  console.log(`Sync complete! Created ${successCount} new users, ${errorCount} failed.`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncMockUsersToFirebase().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
