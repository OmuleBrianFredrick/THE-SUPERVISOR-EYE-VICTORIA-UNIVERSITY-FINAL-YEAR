import { db } from '../db/index.js';
import { users, roles, departments } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const apiKey = firebaseConfig.apiKey;

if (!apiKey) {
  console.error("No apiKey found in firebase-applet-config.json");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function signUpWithRetry(user: { email: string; firstName: string; lastName: string }, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: 'Password123!',
          returnSecureToken: true
        })
      });

      const data = await signUpRes.json();

      if (!signUpRes.ok) {
        const errorMsg = data.error?.message || '';
        if (errorMsg.includes('EMAIL_EXISTS')) {
          return { status: 'skipped', message: 'Email already exists in Firebase Auth' };
        }
        if (errorMsg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          console.log(`[RATE LIMIT] Waiting ${3 * attempt}s before retrying for ${user.email}...`);
          await sleep(3000 * attempt);
          continue;
        }
        return { status: 'failed', message: errorMsg };
      }

      if (data.idToken) {
        await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: data.idToken,
            displayName: `${user.firstName} ${user.lastName}`,
            returnSecureToken: false
          })
        });
      }

      return { status: 'created', uid: data.localId };
    } catch (e: any) {
      if (attempt === retries) {
        return { status: 'failed', message: e.message };
      }
      await sleep(1500 * attempt);
    }
  }
  return { status: 'failed', message: 'Max retries exceeded' };
}

async function run() {
  console.log("Fetching users from PostgreSQL database...");
  const allUsers = await db.select({
    id: users.id,
    firebaseUid: users.firebaseUid,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    jobTitle: users.jobTitle,
    managerId: users.managerId,
    roleId: users.roleId,
    departmentId: users.departmentId,
    role: roles.name,
    department: departments.name,
  })
  .from(users)
  .leftJoin(roles, eq(users.roleId, roles.id))
  .leftJoin(departments, eq(users.departmentId, departments.id));

  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Let's ensure all users from the hierarchy chain are included:
  // Sarah Namuli, Baraza Kizza, Christopher Kiprotich, Ssewankambo Nsubuga,
  // Samuel Okello, Namuli Ssewankambo, Mukasa Onyango, William Jones,
  // John Kato, Ronald Mayanja, Senteza Mwesigye,
  // James Munene, Simpson Birungi, Bruce Mpamizo, Adard Mukiibi, Evelyn Atieno, David Ssenyonga, Emmy Musasizi,
  // Christian E. (admin)
  // Plus additional field representatives, supervisors, and managers across all departments!

  // Let's filter all users that have valid emails
  const validUsers = allUsers.filter(u => u.email && u.email.includes('@'));

  console.log(`\n=====================================================`);
  console.log(`MIGRATING ALL ${validUsers.length} HIERARCHY ACCOUNTS TO FIREBASE AUTH`);
  console.log(`=====================================================\n`);

  let createdCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < validUsers.length; i++) {
    const user = validUsers[i];
    const mgr = user.managerId ? userMap.get(user.managerId) : null;
    const mgrName = mgr ? `${mgr.firstName} ${mgr.lastName} (${mgr.jobTitle})` : 'Top Executive';

    const res = await signUpWithRetry(user);

    if (res.status === 'created') {
      createdCount++;
      if (res.uid) {
        await db.update(users).set({ firebaseUid: res.uid }).where(eq(users.id, user.id));
      }
      console.log(`[${i + 1}/${validUsers.length}] [CREATED] ${user.firstName} ${user.lastName} <${user.email}> (${user.jobTitle})`);
    } else if (res.status === 'skipped') {
      skippedCount++;
      console.log(`[${i + 1}/${validUsers.length}] [EXISTS] ${user.firstName} ${user.lastName} <${user.email}> (${user.jobTitle})`);
    } else {
      failedCount++;
      console.error(`[${i + 1}/${validUsers.length}] [FAILED] ${user.firstName} ${user.lastName} <${user.email}>: ${res.message}`);
    }

    await sleep(250);
  }

  console.log(`\n=====================================================`);
  console.log(`MIGRATION COMPLETE!`);
  console.log(`  Total Accounts Evaluated: ${validUsers.length}`);
  console.log(`  Newly Created in Firebase: ${createdCount}`);
  console.log(`  Already Existed in Firebase: ${skippedCount}`);
  console.log(`  Failed: ${failedCount}`);
  console.log(`  Default Password for all: Password123!`);
  console.log(`=====================================================\n`);

  process.exit(0);
}

run().catch(console.error);
