import { db } from '../db/index.js';
import { users, roles, departments } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const apiKey = firebaseConfig.apiKey;

if (!apiKey) {
  console.error("No apiKey found in firebase-applet-config.json");
  process.exit(1);
}

async function getOrCreateFirebaseUid(user: { email: string; firstName: string; lastName: string }): Promise<string | null> {
  // 1. Try sign up
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
    const signUpData = await signUpRes.json();

    if (signUpRes.ok && signUpData.localId) {
      if (signUpData.idToken) {
        // Update display name
        await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: signUpData.idToken,
            displayName: `${user.firstName} ${user.lastName}`,
            returnSecureToken: false
          })
        });
      }
      return signUpData.localId;
    }

    const errorMsg = signUpData.error?.message || '';

    // 2. If email exists, sign in to retrieve localId
    if (errorMsg.includes('EMAIL_EXISTS')) {
      const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: 'Password123!',
          returnSecureToken: true
        })
      });
      const signInData = await signInRes.json();
      if (signInRes.ok && signInData.localId) {
        return signInData.localId;
      }
    }
  } catch (e) {
    console.error(`Error processing ${user.email}:`, e);
  }
  return null;
}

async function runBatch() {
  console.log("=== BATCH MIGRATING ALL MISSING HIERARCHY ACCOUNTS TO FIREBASE ===");

  const allUsers = await db.select({
    id: users.id,
    firebaseUid: users.firebaseUid,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    jobTitle: users.jobTitle,
    role: roles.name,
    department: departments.name,
  })
  .from(users)
  .leftJoin(roles, eq(users.roleId, roles.id))
  .leftJoin(departments, eq(users.departmentId, departments.id));

  // Targeted accounts list across all hierarchy levels & departments
  const accountsToMigrate = [
    // Executive Leadership (7)
    'james.munene@movitgroup.com',
    'simpson.birungi@movitgroup.com',
    'bruce.mpamizo@movitgroup.com',
    'adard.mukiibi@movitgroup.com',
    'evelyn.atieno@movitgroup.internal',
    'david.ssenyonga@movitgroup.internal',
    'emmy.musasizi@movitgroup.com',

    // Super Admin (1)
    'christianekarel@gmail.com',

    // Managers (3)
    'john.kato@movitgroup.internal',
    'ronald.mayanja@movitgroup.internal',
    'senteza.mwesigye@movitgroup.internal',

    // Supervisors (4)
    'samuel.okello@movitgroup.internal',
    'namuli.ssewankambo@movitgroup.internal',
    'mukasa.onyango@movitgroup.internal',
    'william.jones@movitgroup.internal',

    // Field Representatives & Staff
    'sarah.namuli@movitgroup.internal',
    'baraza.kizza@movitgroup.internal',
    'christopher.kiprotich@movitgroup.internal',
    'ssewankambo.nsubuga@movitgroup.internal',
    'mpamizo.harris@movitgroup.internal',
    'barbara.kizza@movitgroup.internal',
    'kamau.kiprotich@movitgroup.internal',
    'kizza.lubega@movitgroup.internal',
    'ouma.wanjiku@movitgroup.internal',
    'nabirye.davis@movitgroup.internal',
    'patricia.kembabazi@movitgroup.internal',
    'nabirye.williams@movitgroup.internal',
    'kabasinguzi.martin@movitgroup.internal',
    'wasswa.martin@movitgroup.internal',
    'patricia.harris@movitgroup.internal',
    'michael.mukiibi@movitgroup.internal',
    'diana.mayanja@movitgroup.internal',
    'michael.walker@movitgroup.internal',
    'otieno.king@movitgroup.internal',
    'kembabazi.mukiibi@movitgroup.internal',
    'mukiibi.wasswa@movitgroup.internal',
    'nsubuga.mukiibi@movitgroup.internal',
    'kiprotich.ssewankambo@movitgroup.internal',
    'ssewankambo.kamau@movitgroup.internal',
    'birungi.mukiibi@movitgroup.internal',
    'nabirye.mayanja@movitgroup.internal',
    'nekesa.otieno@movitgroup.internal',
    'nakimera.mukiibi@movitgroup.internal',
    'ssebakijje.otieno@movitgroup.internal',
    'ochieng.mukasa@movitgroup.internal',
    'mukiibi.king@movitgroup.internal',
    'mukiibi.mugisha@movitgroup.internal',
    'mukiibi.mukasa@movitgroup.internal',
    'mukiibi.musoke@movitgroup.internal',
    'mukiibi.limo@movitgroup.internal',
    'namukasa.mukiibi@movitgroup.internal'
  ];

  const targetUsers = allUsers.filter(u => accountsToMigrate.includes(u.email));
  console.log(`Processing ${targetUsers.length} accounts...`);

  // Process in chunks of 5 concurrently to avoid rate limits while staying fast
  const chunkSize = 5;
  let successCount = 0;

  for (let i = 0; i < targetUsers.length; i += chunkSize) {
    const chunk = targetUsers.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (user) => {
      const uid = await getOrCreateFirebaseUid(user);
      if (uid) {
        await db.update(users).set({ firebaseUid: uid }).where(eq(users.id, user.id));
        successCount++;
        console.log(`[SYNCED] ${user.firstName} ${user.lastName} <${user.email}> -> Firebase UID: ${uid}`);
      } else {
        console.log(`[SKIP/FAIL] ${user.firstName} ${user.lastName} <${user.email}>`);
      }
    }));
  }

  console.log(`\nDONE! Total synced to Firebase & PostgreSQL: ${successCount} / ${targetUsers.length}`);
  process.exit(0);
}

runBatch().catch(console.error);
