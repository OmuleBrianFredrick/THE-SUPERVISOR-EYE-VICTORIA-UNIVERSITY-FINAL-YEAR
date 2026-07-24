import { db } from '../db/index.js';
import { users, roles, departments } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import firebaseConfig from '../../firebase-applet-config.json' assert { type: 'json' };

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
          console.log(`[RATE LIMIT] Waiting ${4 * attempt}s before retrying for ${user.email}...`);
          await sleep(4000 * attempt);
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
      await sleep(2000);
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

  // 1. Executive Leadership (6)
  const execEmails = [
    'james.munene@movitgroup.com',       // CEO
    'simpson.birungi@movitgroup.com',    // Managing Director
    'bruce.mpamizo@movitgroup.com',      // Operations Director
    'adard.mukiibi@movitgroup.com',      // Finance Director
    'evelyn.atieno@movitgroup.internal', // HR Director
    'david.ssenyonga@movitgroup.internal'// ICT Director
  ];

  // 2. Super Admin (1)
  const adminEmails = [
    'christianekarel@gmail.com'
  ];

  // 3. Department Managers (3)
  const managerEmails = [
    'john.kato@movitgroup.internal',      // Sales Manager
    'ronald.mayanja@movitgroup.internal', // Distribution Manager
    'senteza.mwesigye@movitgroup.internal'// Marketing Manager
  ];

  // 4. Supervisors (4)
  const supervisorEmails = [
    'samuel.okello@movitgroup.internal',      // Sales Supervisor
    'namuli.ssewankambo@movitgroup.internal', // Sales Division Supervisor
    'mukasa.onyango@movitgroup.internal',     // Distribution Supervisor
    'william.jones@movitgroup.internal'       // Logistics Supervisor
  ];

  // 5. Field Staff (4)
  const fieldStaffUsers = allUsers.filter(u => u.role === 'Field Staff' && u.email).slice(0, 4);

  const selectedEmails = [
    ...execEmails,
    ...adminEmails,
    ...managerEmails,
    ...supervisorEmails,
    ...fieldStaffUsers.map(f => f.email)
  ];

  const demoUsers = allUsers.filter(u => selectedEmails.includes(u.email));

  console.log(`\n=====================================================`);
  console.log(`MIGRATING ${demoUsers.length} SELECT DEMO HIERARCHY ACCOUNTS TO FIREBASE`);
  console.log(`=====================================================\n`);

  let createdCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < demoUsers.length; i++) {
    const user = demoUsers[i];
    const mgr = user.managerId ? userMap.get(user.managerId) : null;
    const mgrName = mgr ? `${mgr.firstName} ${mgr.lastName} (${mgr.jobTitle})` : 'Top Executive';

    console.log(`[${i + 1}/${demoUsers.length}] Processing ${user.firstName} ${user.lastName} <${user.email}>`);
    console.log(`  Role: ${user.role} | Job Title: ${user.jobTitle} | Dept: ${user.department || 'Executive'}`);
    console.log(`  Reports To: ${mgrName}`);

    const res = await signUpWithRetry(user);

    if (res.status === 'created') {
      createdCount++;
      if (res.uid && res.uid !== user.firebaseUid) {
        await db.update(users).set({ firebaseUid: res.uid }).where(eq(users.id, user.id));
      }
      console.log(`  └─ [SUCCESS] Created in Firebase Auth (Password: Password123!)\n`);
    } else if (res.status === 'skipped') {
      skippedCount++;
      console.log(`  └─ [SKIPPED] ${res.message}\n`);
    } else {
      failedCount++;
      console.error(`  └─ [ERROR] ${res.message}\n`);
    }

    // Gentle delay to prevent client REST rate-limits
    await sleep(1200);
  }

  console.log(`\n=====================================================`);
  console.log(`DEMO MIGRATION SUMMARY:`);
  console.log(`  Total Accounts: ${demoUsers.length}`);
  console.log(`  Successfully Created: ${createdCount}`);
  console.log(`  Already Existed: ${skippedCount}`);
  console.log(`  Failed: ${failedCount}`);
  console.log(`  Default Password for all: Password123!`);
  console.log(`=====================================================\n`);

  process.exit(0);
}

run().catch(console.error);
