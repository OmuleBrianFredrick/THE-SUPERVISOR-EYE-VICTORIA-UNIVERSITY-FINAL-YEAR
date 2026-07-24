import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import firebaseConfig from '../../firebase-applet-config.json' assert { type: 'json' };

const projectId = firebaseConfig?.projectId || "supervisor-eye-movit";

try {
  initializeApp({
    projectId: projectId
  });
} catch (e) {
  // App might already be initialized
}

async function run() {
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users in PostgreSQL.`);
  
  const auth = getAuth();
  
  let success = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    try {
      await auth.createUser({
        uid: user.id,
        email: user.email,
        emailVerified: true,
        password: 'Password123!',
        displayName: `${user.firstName} ${user.lastName}`
      });
      success++;
      console.log(`[${i + 1}/${allUsers.length}] [OK] Created ${user.email}`);
    } catch (e: any) {
      if (e.code === 'auth/email-already-exists' || e.code === 'auth/uid-already-exists') {
        skipped++;
        console.log(`[${i + 1}/${allUsers.length}] [SKIP] ${user.email} already exists`);
      } else {
        failed++;
        console.error(`[${i + 1}/${allUsers.length}] [ERROR] ${user.email}: ${e.message}`);
      }
    }
  }
  
  console.log(`Migration Complete: ${success} created, ${skipped} skipped, ${failed} failed.`);
  process.exit(0);
}

run().catch(console.error);



