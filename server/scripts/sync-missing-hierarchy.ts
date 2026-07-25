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

async function getOrCreateFirebaseUser(user: { email: string; firstName: string; lastName: string }) {
  // Try sign up first
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

    if (signUpRes.ok && signUpData.idToken) {
      // Update Display Name
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: signUpData.idToken,
          displayName: `${user.firstName} ${user.lastName}`,
          returnSecureToken: false
        })
      });
      return { status: 'created', uid: signUpData.localId };
    }

    const errorMsg = signUpData.error?.message || '';

    // If email already exists, sign in to retrieve localId
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
        return { status: 'existed', uid: signInData.localId };
      }
      return { status: 'existed_unauthenticated', message: signInData.error?.message || 'Email exists but sign-in failed' };
    }

    return { status: 'failed', message: errorMsg };
  } catch (e: any) {
    return { status: 'failed', message: e.message };
  }
}

async function main() {
  console.log("=== SYNCING ALL HIERARCHY ACCOUNTS & UPDATING POSTGRES REAL FIREBASE UIDs ===");
  const allUsers = await db.select({
    id: users.id,
    firebaseUid: users.firebaseUid,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    jobTitle: users.jobTitle,
    managerId: users.managerId,
    role: roles.name,
    department: departments.name,
  })
  .from(users)
  .leftJoin(roles, eq(users.roleId, roles.id))
  .leftJoin(departments, eq(users.departmentId, departments.id));

  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Extended list of accounts across all departments
  const accountsToSync = [
    // Executive Leadership
    'james.munene@movitgroup.com',
    'simpson.birungi@movitgroup.com',
    'bruce.mpamizo@movitgroup.com',
    'adard.mukiibi@movitgroup.com',
    'evelyn.atieno@movitgroup.internal',
    'david.ssenyonga@movitgroup.internal',
    'emmy.musasizi@movitgroup.com',

    // Super Admin
    'christianekarel@gmail.com',

    // Managers
    'john.kato@movitgroup.internal',
    'ronald.mayanja@movitgroup.internal',
    'senteza.mwesigye@movitgroup.internal',

    // Supervisors
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

  const targetUsers = allUsers.filter(u => accountsToSync.includes(u.email));

  let created = 0;
  let existed = 0;
  let updatedInPostgres = 0;

  for (let i = 0; i < targetUsers.length; i++) {
    const user = targetUsers[i];
    const res = await getOrCreateFirebaseUser(user);

    if (res.uid) {
      // Update PostgreSQL user firebaseUid with real Firebase UID
      await db.update(users).set({ firebaseUid: res.uid }).where(eq(users.id, user.id));
      updatedInPostgres++;
      if (res.status === 'created') {
        created++;
        console.log(`[${i + 1}/${targetUsers.length}] [NEWLY CREATED] ${user.firstName} ${user.lastName} <${user.email}> -> UID: ${res.uid}`);
      } else {
        existed++;
        console.log(`[${i + 1}/${targetUsers.length}] [EXISTING ACC LINKED] ${user.firstName} ${user.lastName} <${user.email}> -> UID: ${res.uid}`);
      }
    } else {
      console.log(`[${i + 1}/${targetUsers.length}] [NOTICE] ${user.firstName} ${user.lastName} <${user.email}>: ${res.message}`);
    }

    await sleep(250);
  }

  console.log(`\n=====================================================`);
  console.log(`FIREBASE MIGRATION SUMMARY:`);
  console.log(`  Total Accounts Evaluated: ${targetUsers.length}`);
  console.log(`  Newly Created in Firebase: ${created}`);
  console.log(`  Existing Accounts Linked: ${existed}`);
  console.log(`  Updated in PostgreSQL DB: ${updatedInPostgres}`);
  console.log(`  Default Password: Password123!`);
  console.log(`=====================================================\n`);

  process.exit(0);
}

main().catch(console.error);
