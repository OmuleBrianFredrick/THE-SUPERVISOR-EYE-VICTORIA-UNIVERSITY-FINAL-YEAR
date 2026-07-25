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

async function getOrCreateFirebaseUserUid(user: { email: string; firstName: string; lastName: string }) {
  // Step 1: Try signInWithPassword first (fast & avoids sign-up rate limits for existing users)
  try {
    const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'Password123!', returnSecureToken: true })
    });
    const signInData = await signInRes.json();

    if (signInRes.ok && signInData.localId) {
      return { uid: signInData.localId, status: 'existed' };
    }

    const errorMsg = signInData.error?.message || '';

    // Step 2: If EMAIL_NOT_FOUND, create new Firebase Auth user
    if (errorMsg.includes('EMAIL_NOT_FOUND') || errorMsg.includes('INVALID_LOGIN_CREDENTIALS')) {
      const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: 'Password123!', returnSecureToken: true })
      });
      const signUpData = await signUpRes.json();

      if (signUpRes.ok && signUpData.localId) {
        if (signUpData.idToken) {
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
        return { uid: signUpData.localId, status: 'created' };
      }
      return { uid: null, error: signUpData.error?.message || 'SignUp failed' };
    }

    return { uid: null, error: errorMsg };
  } catch (err: any) {
    return { uid: null, error: err.message };
  }
}

async function run() {
  console.log("=== STARTING SMART HIERARCHY FIREBASE SYNC ===");

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

  // Targeted accounts across all departments and hierarchy tiers
  const targetEmails = [
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

    // Department Managers (3)
    'john.kato@movitgroup.internal',
    'ronald.mayanja@movitgroup.internal',
    'senteza.mwesigye@movitgroup.internal',

    // Supervisors (4)
    'samuel.okello@movitgroup.internal',
    'namuli.ssewankambo@movitgroup.internal',
    'mukasa.onyango@movitgroup.internal',
    'william.jones@movitgroup.internal',

    // Field Representatives & Staff across Sales, Distribution, Marketing, Manufacturing, Logistics, HR, Finance, Procurement, Quality Assurance, ICT
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

  const targetUsers = allUsers.filter(u => targetEmails.includes(u.email));

  console.log(`Evaluating and syncing ${targetUsers.length} accounts...`);

  let newlyCreated = 0;
  let linkedExisted = 0;
  let updatedInPostgres = 0;

  for (let i = 0; i < targetUsers.length; i++) {
    const user = targetUsers[i];
    const res = await getOrCreateFirebaseUserUid(user);

    if (res.uid) {
      await db.update(users).set({ firebaseUid: res.uid }).where(eq(users.id, user.id));
      updatedInPostgres++;
      if (res.status === 'created') {
        newlyCreated++;
        console.log(`[${i + 1}/${targetUsers.length}] [CREATED & LINKED] ${user.firstName} ${user.lastName} <${user.email}> -> ${res.uid}`);
      } else {
        linkedExisted++;
        console.log(`[${i + 1}/${targetUsers.length}] [FOUND & LINKED] ${user.firstName} ${user.lastName} <${user.email}> -> ${res.uid}`);
      }
    } else {
      console.log(`[${i + 1}/${targetUsers.length}] [SKIPPED/NOTICE] ${user.firstName} ${user.lastName} <${user.email}>: ${res.error}`);
    }

    await sleep(400);
  }

  console.log(`\n=====================================================`);
  console.log(`SYNC COMPLETE!`);
  console.log(`  Total Evaluated: ${targetUsers.length}`);
  console.log(`  Newly Created in Firebase: ${newlyCreated}`);
  console.log(`  Existed & Linked to Postgres: ${linkedExisted}`);
  console.log(`  Total Postgres UIDs Updated: ${updatedInPostgres}`);
  console.log(`  Default Password: Password123!`);
  console.log(`=====================================================\n`);

  process.exit(0);
}

run().catch(console.error);
