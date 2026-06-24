import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Standard list of Ugandan & East African Names for authentic feel
const FIRST_NAMES_EA = [
  'Kato', 'Okello', 'Namuli', 'Babirye', 'Mukasa', 'Ssewankambo', 'Nsubuga', 'Atieno', 'Otieno', 'Kamau', 
  'Mwangi', 'Wanjiku', 'Cherotich', 'Chemutai', 'Nakato', 'Ssenyonga', 'Kembabazi', 'Musoke', 'Kabasinguzi', 
  'Mugisha', 'Birungi', 'Mpamizo', 'Mukiibi', 'Ochieng', 'Onyango', 'Kiprotich', 'Limo', 'Baraza', 'Nabirye', 
  'Namukasa', 'Wasswa', 'Kizza', 'Nakimera', 'Ouma', 'Ssebakijje', 'Njoroge', 'Achieng', 'Odhiambo', 'Nekesa'
];

const LAST_NAMES_EA = [
  'Kato', 'Okello', 'Namuli', 'Mukasa', 'Ssewankambo', 'Nsubuga', 'Atieno', 'Otieno', 'Kamau', 'Mwangi', 
  'Wanjiku', 'Cherotich', 'Chemutai', 'Ssenyonga', 'Kembabazi', 'Musoke', 'Mugisha', 'Birungi', 'Mpamizo', 
  'Mukiibi', 'Ochieng', 'Onyango', 'Kiprotich', 'Limo', 'Baraza', 'Nabirye', 'Namukasa', 'Ssebakijje', 
  'Wasswa', 'Kizza', 'Nakimera', 'Senteza', 'Mayanja', 'Kigozi', 'Lubega', 'Ssewankambo', 'Mwesigye', 'Asiimwe'
];

const FIRST_NAMES_INT = [
  'James', 'John', 'Sarah', 'Grace', 'Peter', 'Evelyn', 'David', 'Diana', 'Arthur', 'Robert', 'Mary', 
  'Michael', 'Thomas', 'Joseph', 'Elizabeth', 'William', 'Susan', 'Paul', 'Linda', 'George', 'Charles', 
  'Patricia', 'Christopher', 'Daniel', 'Richard', 'Nancy', 'Karen', 'Barbara', 'Sandra', 'Steven'
];

const LAST_NAMES_INT = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 
  'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres'
];

// Helper to generate a random name
function generateUniqueName(usedNames: Set<string>): { firstName: string, lastName: string } {
  let attempts = 0;
  while (attempts < 5000) {
    const isEAFirst = Math.random() < 0.65;
    const isEALast = Math.random() < 0.65;
    
    const firstName = isEAFirst 
      ? FIRST_NAMES_EA[Math.floor(Math.random() * FIRST_NAMES_EA.length)] 
      : FIRST_NAMES_INT[Math.floor(Math.random() * FIRST_NAMES_INT.length)];
      
    const lastName = isEALast 
      ? LAST_NAMES_EA[Math.floor(Math.random() * LAST_NAMES_EA.length)] 
      : LAST_NAMES_INT[Math.floor(Math.random() * LAST_NAMES_INT.length)];
      
    const fullName = `${firstName} ${lastName}`;
    if (!usedNames.has(fullName)) {
      usedNames.add(fullName);
      return { firstName, lastName };
    }
    attempts++;
  }
  return { firstName: 'Employee', lastName: `User-${randomUUID().substring(0, 5)}` };
}

// Generate consistent Firebase UID for mock login matching frontend `btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 40)`
function generateFirebaseUid(email: string): string {
  const encoded = Buffer.from(email).toString('base64');
  const clean = encoded.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
  return `mock-uid-${clean}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  console.log('Successfully connected to Neon PostgreSQL.');
  
  try {
    // 1. Fetch existing Roles in the database
    console.log('Resolving roles...');
    const rolesRes = await client.query('SELECT id, name FROM roles;');
    let dbRoles = rolesRes.rows;
    
    let adminRoleId = dbRoles.find(r => r.name === 'Administrator')?.id;
    let managerRoleId = dbRoles.find(r => r.name === 'Manager')?.id;
    let supervisorRoleId = dbRoles.find(r => r.name === 'Supervisor')?.id;
    let staffRoleId = dbRoles.find(r => r.name === 'Field Staff')?.id;
    let superAdminRoleId = dbRoles.find(r => r.name === 'SUPER_ADMIN')?.id;
    let executiveRoleId = dbRoles.find(r => r.name === 'Executive')?.id;

    if (!executiveRoleId) {
      console.log('Creating Executive role...');
      const result = await client.query(`
        INSERT INTO roles (id, name, permissions) 
        VALUES ($1, 'Executive', '{"viewAnalytics": true}') 
        RETURNING id;
      `, [randomUUID()]);
      executiveRoleId = result.rows[0].id;
    }

    // 2. Clear transactional tables & history tables to avoid FK constraint issues
    console.log('Clearing old transaction and history data...');
    
    // Set foreign key head_user_id in departments to NULL first
    try {
      await client.query('UPDATE departments SET head_user_id = NULL;');
    } catch (e) {}

    // List of tables to clear in reverse dependency order
    const tablesToClear = [
      'delegations', 'escalations', 'report_approvals', 'approval_steps', 
      'approval_chains', 'notifications', 'approvals', 'evidence', 
      'reports', 'tasks', 'ai_insight_feedback', 'ai_insights', 
      'org_health_metrics', 'department_intelligence', 'user_intelligence', 
      'department_assignment_history', 'audit_logs'
    ];

    for (const table of tablesToClear) {
      try {
        await client.query(`TRUNCATE TABLE ${table} CASCADE;`);
        console.log(`Cleared table: ${table}`);
      } catch (err: any) {
        // If table doesn't exist or error, try normal delete
        try {
          await client.query(`DELETE FROM ${table};`);
          console.log(`Cleared table (fallback): ${table}`);
        } catch (innerErr: any) {
          console.warn(`Could not clear table ${table}: ${innerErr.message}`);
        }
      }
    }

    // 3. Fetch current users to preserve
    console.log('Reading existing users to preserve...');
    const existingUsersRes = await client.query(`
      SELECT id, firebase_uid, email, first_name, last_name, role_id, status 
      FROM users;
    `);
    const preservedUsers = existingUsersRes.rows;
    console.log(`Found ${preservedUsers.length} existing users. We will preserve them.`);

    // Delete users
    console.log('Rebuilding user base cleanly...');
    try {
      await client.query('TRUNCATE TABLE users CASCADE;');
    } catch (e) {
      await client.query('DELETE FROM users;');
    }

    // 4. Create Departments
    console.log('Generating departments...');
    const targetDeptNames = [
      'Sales', 'Distribution', 'Marketing', 'Manufacturing', 'Logistics', 
      'Finance', 'Human Resources', 'Procurement', 'ICT', 'Quality Assurance'
    ];

    // Clear old departments
    try {
      await client.query('DELETE FROM departments;');
    } catch (e) {
      console.log('Retrying department deletion...');
      await client.query('UPDATE departments SET head_user_id = NULL;');
      await client.query('DELETE FROM departments;');
    }

    const deptMap: Record<string, string> = {}; // Name -> ID
    for (const dName of targetDeptNames) {
      const deptId = randomUUID();
      await client.query(`
        INSERT INTO departments (id, name, created_at) 
        VALUES ($1, $2, NOW());
      `, [deptId, dName]);
      deptMap[dName] = deptId;
    }
    console.log(`Generated ${Object.keys(deptMap).length} departments.`);

    // 5. Structure Workforce Generation
    const usedNames = new Set<string>();
    const usedEmails = new Set<string>();
    const usedPhones = new Set<string>();
    const usedEmpNumbers = new Set<string>();
    const usedFirebaseUids = new Set<string>();

    const generatedUsers: any[] = [];
    const assignmentHistoryRecords: any[] = [];
    const auditLogsRecords: any[] = [];

    // Helper for unique values
    function getUniqueEmail(first: string, last: string): string {
      let emailBase = `${first.toLowerCase()}.${last.toLowerCase()}`;
      let email = `${emailBase}@movitgroup.internal`;
      let firebaseUid = generateFirebaseUid(email);
      let counter = 2;
      
      while (usedEmails.has(email) || usedFirebaseUids.has(firebaseUid)) {
        // We append a larger random/counter-based suffix to ensure base64 prefixes differ significantly
        email = `${emailBase}${counter}_${Math.floor(100 + Math.random() * 900)}@movitgroup.internal`;
        firebaseUid = generateFirebaseUid(email);
        counter++;
      }
      
      usedEmails.add(email);
      usedFirebaseUids.add(firebaseUid);
      return email;
    }

    function getUniquePhone(): string {
      let phone = `+256 7${Math.floor(10000000 + Math.random() * 90000000)}`;
      while (usedPhones.has(phone)) {
        phone = `+256 7${Math.floor(10000000 + Math.random() * 90000000)}`;
      }
      usedPhones.add(phone);
      return phone;
    }

    function getUniqueEmpNumber(): string {
      let num = `MV-${Math.floor(10000 + Math.random() * 90000)}`;
      while (usedEmpNumbers.has(num)) {
        num = `MV-${Math.floor(10000 + Math.random() * 90000)}`;
      }
      usedEmpNumbers.add(num);
      return num;
    }

    // Prepare preservation for existing users
    const preservedOwner = preservedUsers.find(u => u.email === 'christianekarel@gmail.com');
    const preservedSysAdmin = preservedUsers.find(u => u.email === 'admin@movitgroup.internal');
    const preservedManager = preservedUsers.find(u => u.email === 'john.kato@movitgroup.internal');
    const preservedSupervisor = preservedUsers.find(u => u.email === 'samuel.okello@movitgroup.internal');
    const preservedStaff = preservedUsers.find(u => u.email === 'sarah.namuli@movitgroup.internal');

    // Make sure we reserve these emails and names and firebaseUids
    const registerManualUser = (email: string, firstName: string, lastName: string, explicitUid?: string) => {
      usedEmails.add(email);
      usedNames.add(`${firstName} ${lastName}`);
      usedFirebaseUids.add(explicitUid || generateFirebaseUid(email));
    };

    if (preservedOwner) {
      registerManualUser(preservedOwner.email, preservedOwner.first_name, preservedOwner.last_name, preservedOwner.firebase_uid);
    } else {
      registerManualUser('christianekarel@gmail.com', 'Christian', 'E.');
    }

    if (preservedSysAdmin) {
      registerManualUser(preservedSysAdmin.email, preservedSysAdmin.first_name, preservedSysAdmin.last_name, preservedSysAdmin.firebase_uid);
    } else {
      registerManualUser('admin@movitgroup.internal', 'System', 'Admin');
    }

    if (preservedManager) {
      registerManualUser(preservedManager.email, preservedManager.first_name, preservedManager.last_name, preservedManager.firebase_uid);
    } else {
      registerManualUser('john.kato@movitgroup.internal', 'John', 'Kato');
    }

    if (preservedSupervisor) {
      registerManualUser(preservedSupervisor.email, preservedSupervisor.first_name, preservedSupervisor.last_name, preservedSupervisor.firebase_uid);
    } else {
      registerManualUser('samuel.okello@movitgroup.internal', 'Samuel', 'Okello');
    }

    if (preservedStaff) {
      registerManualUser(preservedStaff.email, preservedStaff.first_name, preservedStaff.last_name, preservedStaff.firebase_uid);
    } else {
      registerManualUser('sarah.namuli@movitgroup.internal', 'Sarah', 'Namuli');
    }

    // Also register the Executive spec emails
    const execSpecs = [
      { firstName: 'James', lastName: 'Munene', title: 'Chief Executive Officer (CEO)', email: 'james.munene@movitgroup.com', dept: null },
      { firstName: 'Simpson', lastName: 'Birungi', title: 'Managing Director', email: 'simpson.birungi@movitgroup.com', dept: null },
      { firstName: 'Bruce', lastName: 'Mpamizo', title: 'Operations Director', email: 'bruce.mpamizo@movitgroup.com', dept: 'Distribution' },
      { firstName: 'Adard', lastName: 'Mukiibi', title: 'Finance Director', email: 'adard.mukiibi@movitgroup.com', dept: 'Finance' },
      { firstName: 'Evelyn', lastName: 'Atieno', title: 'Human Resource Director', email: 'evelyn.atieno@movitgroup.internal', dept: 'Human Resources' },
      { firstName: 'David', lastName: 'Ssenyonga', title: 'ICT Director', email: 'david.ssenyonga@movitgroup.internal', dept: 'ICT' }
    ];

    for (const spec of execSpecs) {
      registerManualUser(spec.email, spec.firstName, spec.lastName);
    }

    const execUsers: any[] = [];
    
    // Create CEO first as the root
    const ceoSpec = execSpecs[0];
    const ceoId = randomUUID();
    const ceoUser = {
      id: ceoId,
      firebaseUid: generateFirebaseUid(ceoSpec.email),
      employeeNumber: getUniqueEmpNumber(),
      firstName: ceoSpec.firstName,
      lastName: ceoSpec.lastName,
      email: ceoSpec.email,
      phone: getUniquePhone(),
      jobTitle: ceoSpec.title,
      roleId: executiveRoleId,
      departmentId: null,
      managerId: null,
      hierarchyPath: `/${ceoId}`,
      status: 'ACTIVE',
      onboardingComplete: true,
      onboardingCompletedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000), // 360 days ago
      dateJoinedDepartment: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000),
      lastDepartmentChangeAt: null,
      createdAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000)
    };
    generatedUsers.push(ceoUser);
    execUsers.push(ceoUser);
    usedEmails.add(ceoSpec.email);
    usedNames.add(`${ceoSpec.firstName} ${ceoSpec.lastName}`);

    // Create the other 5 executives reporting to the CEO
    for (let i = 1; i < execSpecs.length; i++) {
      const spec = execSpecs[i];
      const execId = randomUUID();
      const execUser = {
        id: execId,
        firebaseUid: generateFirebaseUid(spec.email),
        employeeNumber: getUniqueEmpNumber(),
        firstName: spec.firstName,
        lastName: spec.lastName,
        email: spec.email,
        phone: getUniquePhone(),
        jobTitle: spec.title,
        roleId: executiveRoleId,
        departmentId: spec.dept ? deptMap[spec.dept] : null,
        managerId: ceoId,
        hierarchyPath: `/${ceoId}/${execId}`,
        status: 'ACTIVE',
        onboardingComplete: true,
        onboardingCompletedAt: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000), // 340 days ago
        dateJoinedDepartment: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000),
        lastDepartmentChangeAt: null,
        createdAt: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000)
      };
      generatedUsers.push(execUser);
      execUsers.push(execUser);
      usedEmails.add(spec.email);
      usedNames.add(`${spec.firstName} ${spec.lastName}`);
    }

    // B. ADMINISTRATORS (5 Users + 1 Preserved SUPER_ADMIN)
    console.log('Configuring Administrators...');
    
    // Existing owner (christianekarel@gmail.com)
    const ownerId = preservedOwner ? preservedOwner.id : randomUUID();
    const ownerUser = {
      id: ownerId,
      firebaseUid: preservedOwner ? preservedOwner.firebase_uid : generateFirebaseUid('christianekarel@gmail.com'),
      employeeNumber: getUniqueEmpNumber(),
      firstName: preservedOwner ? preservedOwner.first_name : 'Christian',
      lastName: preservedOwner ? preservedOwner.last_name : 'E.',
      email: 'christianekarel@gmail.com',
      phone: getUniquePhone(),
      jobTitle: 'IT Support & Platform Owner',
      roleId: superAdminRoleId || adminRoleId,
      departmentId: deptMap['ICT'],
      managerId: ceoId,
      hierarchyPath: `/${ceoId}/${ownerId}`,
      status: 'ACTIVE',
      onboardingComplete: true,
      onboardingCompletedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000),
      dateJoinedDepartment: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000),
      lastDepartmentChangeAt: null,
      createdAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000)
    };
    generatedUsers.push(ownerUser);

    // Existing system admin (admin@movitgroup.internal)
    const sysAdminId = preservedSysAdmin ? preservedSysAdmin.id : randomUUID();
    const sysAdminUser = {
      id: sysAdminId,
      firebaseUid: preservedSysAdmin ? preservedSysAdmin.firebase_uid : generateFirebaseUid('admin@movitgroup.internal'),
      employeeNumber: getUniqueEmpNumber(),
      firstName: preservedSysAdmin ? preservedSysAdmin.first_name : 'System',
      lastName: preservedSysAdmin ? preservedSysAdmin.last_name : 'Admin',
      email: 'admin@movitgroup.internal',
      phone: getUniquePhone(),
      jobTitle: 'Lead System Administrator',
      roleId: adminRoleId,
      departmentId: deptMap['ICT'],
      managerId: ownerId,
      hierarchyPath: `/${ceoId}/${ownerId}/${sysAdminId}`,
      status: 'ACTIVE',
      onboardingComplete: true,
      onboardingCompletedAt: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000),
      dateJoinedDepartment: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000),
      lastDepartmentChangeAt: null,
      createdAt: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000)
    };
    generatedUsers.push(sysAdminUser);

    // Add 2 more Platform Administrators
    const adminSpecs = [
      { first: 'Grace', last: 'Nakato', title: 'Platform Security Officer' },
      { first: 'Peter', last: 'Ssewankambo', title: 'HR Platform Systems Auditor' }
    ];
    for (const spec of adminSpecs) {
      const adminId = randomUUID();
      const email = getUniqueEmail(spec.first, spec.last);
      const adminUsr = {
        id: adminId,
        firebaseUid: generateFirebaseUid(email),
        employeeNumber: getUniqueEmpNumber(),
        firstName: spec.first,
        lastName: spec.last,
        email: email,
        phone: getUniquePhone(),
        jobTitle: spec.title,
        roleId: adminRoleId,
        departmentId: deptMap['ICT'],
        managerId: sysAdminId,
        hierarchyPath: `/${ceoId}/${ownerId}/${sysAdminId}/${adminId}`,
        status: 'ACTIVE',
        onboardingComplete: true,
        onboardingCompletedAt: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000),
        dateJoinedDepartment: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000),
        lastDepartmentChangeAt: null,
        createdAt: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000)
      };
      generatedUsers.push(adminUsr);
    }

    // Add 2 Executive Administration Officers
    const execAdminSpecs = [
      { first: 'Diana', last: 'Kembabazi', title: 'Executive Operations Officer' },
      { first: 'Arthur', last: 'Musoke', title: 'Strategic Planning Coordinator' }
    ];
    for (const spec of execAdminSpecs) {
      const officerId = randomUUID();
      const email = getUniqueEmail(spec.first, spec.last);
      const officerUsr = {
        id: officerId,
        firebaseUid: generateFirebaseUid(email),
        employeeNumber: getUniqueEmpNumber(),
        firstName: spec.first,
        lastName: spec.last,
        email: email,
        phone: getUniquePhone(),
        jobTitle: spec.title,
        roleId: adminRoleId,
        departmentId: deptMap['Human Resources'],
        managerId: ceoId, // Reports to CEO directly
        hierarchyPath: `/${ceoId}/${officerId}`,
        status: 'ACTIVE',
        onboardingComplete: true,
        onboardingCompletedAt: new Date(Date.now() - 220 * 24 * 60 * 60 * 1000),
        dateJoinedDepartment: new Date(Date.now() - 220 * 24 * 60 * 60 * 1000),
        lastDepartmentChangeAt: null,
        createdAt: new Date(Date.now() - 220 * 24 * 60 * 60 * 1000)
      };
      generatedUsers.push(officerUsr);
    }

    // C. DEPARTMENT MANAGERS (15 Managers)
    console.log('Generating Department Managers...');
    
    // Let's create one manager for each of the 10 departments, plus 5 functional managers
    const managers: any[] = [];
    
    // Mapping which Director each manager reports to:
    // Sales, Distribution, Logistics, Manufacturing, Procurement -> Bruce Mpamizo (Operations Director)
    // Marketing -> Simpson Birungi (MD)
    // Finance -> Adard Mukiibi (Finance Director)
    // HR -> Evelyn Atieno (HR Director)
    // ICT -> David Ssenyonga (ICT Director)
    // Quality Assurance -> Bruce Mpamizo (Operations Director)
    const directorMapping: Record<string, string> = {
      'Sales': execSpecs.find(s => s.title === 'Operations Director')!.email,
      'Distribution': execSpecs.find(s => s.title === 'Operations Director')!.email,
      'Marketing': execSpecs.find(s => s.title === 'Managing Director')!.email,
      'Manufacturing': execSpecs.find(s => s.title === 'Operations Director')!.email,
      'Logistics': execSpecs.find(s => s.title === 'Operations Director')!.email,
      'Finance': execSpecs.find(s => s.title === 'Finance Director')!.email,
      'Human Resources': execSpecs.find(s => s.title === 'Human Resource Director')!.email,
      'Procurement': execSpecs.find(s => s.title === 'Operations Director')!.email,
      'ICT': execSpecs.find(s => s.title === 'ICT Director')!.email,
      'Quality Assurance': execSpecs.find(s => s.title === 'Operations Director')!.email,
    };

    const getDirectorId = (deptName: string) => {
      const email = directorMapping[deptName] || 'bruce.mpamizo@movitgroup.com';
      return execUsers.find(u => u.email === email)!.id;
    };

    // Keep John Kato as Sales Manager!
    const johnKatoId = preservedManager ? preservedManager.id : randomUUID();
    const johnKatoUser = {
      id: johnKatoId,
      firebaseUid: preservedManager ? preservedManager.firebase_uid : generateFirebaseUid('john.kato@movitgroup.internal'),
      employeeNumber: getUniqueEmpNumber(),
      firstName: preservedManager ? preservedManager.first_name : 'John',
      lastName: preservedManager ? preservedManager.last_name : 'Kato',
      email: 'john.kato@movitgroup.internal',
      phone: getUniquePhone(),
      jobTitle: 'Sales Department Manager',
      roleId: managerRoleId,
      departmentId: deptMap['Sales'],
      managerId: getDirectorId('Sales'),
      hierarchyPath: `/${ceoId}/${getDirectorId('Sales')}/${johnKatoId}`,
      status: 'ACTIVE',
      onboardingComplete: true,
      onboardingCompletedAt: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000),
      dateJoinedDepartment: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000),
      lastDepartmentChangeAt: null,
      createdAt: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000)
    };
    generatedUsers.push(johnKatoUser);
    managers.push(johnKatoUser);

    // Create Managers for the other 9 departments
    const deptManagerSpecs = [
      { dept: 'Distribution', first: 'Ronald', last: 'Mayanja' },
      { dept: 'Marketing', first: 'Senteza', last: 'Mwesigye' },
      { dept: 'Manufacturing', first: 'Josephine', last: 'Lubega' },
      { dept: 'Logistics', first: 'Steven', last: 'Kigozi' },
      { dept: 'Finance', first: 'Betty', last: 'Asiimwe' },
      { dept: 'Human Resources', first: 'Phiona', last: 'Nakimera' },
      { dept: 'Procurement', first: 'Hassan', last: 'Ouma' },
      { dept: 'ICT', first: 'Martin', last: 'Senteza' },
      { dept: 'Quality Assurance', first: 'Juliet', last: 'Kabasinguzi' }
    ];

    for (const spec of deptManagerSpecs) {
      const managerId = randomUUID();
      const email = getUniqueEmail(spec.first, spec.last);
      const dirId = getDirectorId(spec.dept);
      const mgrUser = {
        id: managerId,
        firebaseUid: generateFirebaseUid(email),
        employeeNumber: getUniqueEmpNumber(),
        firstName: spec.first,
        lastName: spec.last,
        email: email,
        phone: getUniquePhone(),
        jobTitle: `${spec.dept} Department Manager`,
        roleId: managerRoleId,
        departmentId: deptMap[spec.dept],
        managerId: dirId,
        hierarchyPath: `/${ceoId}/${dirId}/${managerId}`,
        status: 'ACTIVE',
        onboardingComplete: true,
        onboardingCompletedAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
        dateJoinedDepartment: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
        lastDepartmentChangeAt: null,
        createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000)
      };
      generatedUsers.push(mgrUser);
      managers.push(mgrUser);
    }

    // Create 5 additional managers (Regional/Brand)
    const extraManagerSpecs = [
      { dept: 'Sales', first: 'William', last: 'Ochieng', title: 'Regional Operations Manager - West' },
      { dept: 'Distribution', first: 'Andrew', last: 'Mwangi', title: 'Regional Logistics Coordinator - East' },
      { dept: 'Marketing', first: 'Florence', last: 'Wanjiku', title: 'Brand Manager - Movit Care' },
      { dept: 'Finance', first: 'Richard', last: 'Kizza', title: 'Treasury & Audit Manager' },
      { dept: 'Manufacturing', first: 'Nicholas', last: 'Onyango', title: 'Plant Shift Manager - Kampala' }
    ];

    for (const spec of extraManagerSpecs) {
      const managerId = randomUUID();
      const email = getUniqueEmail(spec.first, spec.last);
      const dirId = getDirectorId(spec.dept);
      const mgrUser = {
        id: managerId,
        firebaseUid: generateFirebaseUid(email),
        employeeNumber: getUniqueEmpNumber(),
        firstName: spec.first,
        lastName: spec.last,
        email: email,
        phone: getUniquePhone(),
        jobTitle: spec.title,
        roleId: managerRoleId,
        departmentId: deptMap[spec.dept],
        managerId: dirId,
        hierarchyPath: `/${ceoId}/${dirId}/${managerId}`,
        status: 'ACTIVE',
        onboardingComplete: true,
        onboardingCompletedAt: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000),
        dateJoinedDepartment: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000),
        lastDepartmentChangeAt: null,
        createdAt: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000)
      };
      generatedUsers.push(mgrUser);
      managers.push(mgrUser);
    }

    // D. SUPERVISORS (40 Supervisors)
    console.log('Generating Supervisors...');
    const supervisors: Record<string, any[]> = {}; // deptId -> list of supervisors
    for (const dName of targetDeptNames) {
      supervisors[deptMap[dName]] = [];
    }

    // Keep Samuel Okello as Sales Supervisor!
    const samOkelloId = preservedSupervisor ? preservedSupervisor.id : randomUUID();
    const salesDeptMgr = managers.find(m => m.departmentId === deptMap['Sales']);
    const samOkelloUser = {
      id: samOkelloId,
      firebaseUid: preservedSupervisor ? preservedSupervisor.firebase_uid : generateFirebaseUid('samuel.okello@movitgroup.internal'),
      employeeNumber: getUniqueEmpNumber(),
      firstName: preservedSupervisor ? preservedSupervisor.first_name : 'Samuel',
      lastName: preservedSupervisor ? preservedSupervisor.last_name : 'Okello',
      email: 'samuel.okello@movitgroup.internal',
      phone: getUniquePhone(),
      jobTitle: 'Sales Field Supervisor',
      roleId: supervisorRoleId,
      departmentId: deptMap['Sales'],
      managerId: salesDeptMgr.id,
      hierarchyPath: `${salesDeptMgr.hierarchyPath}/${samOkelloId}`,
      status: 'ACTIVE',
      onboardingComplete: true,
      onboardingCompletedAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000),
      dateJoinedDepartment: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000),
      lastDepartmentChangeAt: null,
      createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000)
    };
    generatedUsers.push(samOkelloUser);
    supervisors[deptMap['Sales']].push(samOkelloUser);

    // We need 4 supervisors per department -> 40 supervisors total.
    // Samuel is already 1 for Sales. Let's generate remaining 39.
    for (const dName of targetDeptNames) {
      const deptId = deptMap[dName];
      const deptMgr = managers.find(m => m.departmentId === deptId) || managers[0];
      const targetCount = dName === 'Sales' ? 3 : 4;
      
      for (let s = 0; s < targetCount; s++) {
        const { firstName, lastName } = generateUniqueName(usedNames);
        const email = getUniqueEmail(firstName, lastName);
        const supId = randomUUID();
        const supUser = {
          id: supId,
          firebaseUid: generateFirebaseUid(email),
          employeeNumber: getUniqueEmpNumber(),
          firstName,
          lastName,
          email,
          phone: getUniquePhone(),
          jobTitle: `${dName} Division Supervisor`,
          roleId: supervisorRoleId,
          departmentId: deptId,
          managerId: deptMgr.id,
          hierarchyPath: `${deptMgr.hierarchyPath}/${supId}`,
          status: 'ACTIVE',
          onboardingComplete: true,
          onboardingCompletedAt: new Date(Date.now() - (200 + s * 10) * 24 * 60 * 60 * 1000),
          dateJoinedDepartment: new Date(Date.now() - (200 + s * 10) * 24 * 60 * 60 * 1000),
          lastDepartmentChangeAt: null,
          createdAt: new Date(Date.now() - (200 + s * 10) * 24 * 60 * 60 * 1000)
        };
        generatedUsers.push(supUser);
        supervisors[deptId].push(supUser);
      }
    }

    // E. FIELD STAFF (250 Field Staff)
    console.log('Generating Field Staff and scheduling onboarding dates over 12 months for workforce growth trends...');
    
    // We will generate 250 Field Staff (including Sarah Namuli as 1).
    // Let's distribute join dates systematically across 12 months (July 2025 to June 2026) to simulate organic, realistic workforce growth:
    // Let's declare our 12 months in reverse (or forward) chronological order
    const months = [
      { name: 'Jul 2025', daysAgoStart: 360, daysAgoEnd: 331, count: 18 },
      { name: 'Aug 2025', daysAgoStart: 330, daysAgoEnd: 301, count: 20 },
      { name: 'Sep 2025', daysAgoStart: 300, daysAgoEnd: 271, count: 21 },
      { name: 'Oct 2025', daysAgoStart: 270, daysAgoEnd: 241, count: 23 },
      { name: 'Nov 2025', daysAgoStart: 240, daysAgoEnd: 211, count: 25 },
      { name: 'Dec 2025', daysAgoStart: 210, daysAgoEnd: 181, count: 17 },
      { name: 'Jan 2026', daysAgoStart: 180, daysAgoEnd: 151, count: 25 },
      { name: 'Feb 2026', daysAgoStart: 150, daysAgoEnd: 121, count: 23 },
      { name: 'Mar 2026', daysAgoStart: 120, daysAgoEnd: 91,  count: 24 },
      { name: 'Apr 2026', daysAgoStart: 90,  daysAgoEnd: 61,  count: 22 },
      { name: 'May 2026', daysAgoStart: 60,  daysAgoEnd: 31,  count: 18 },
      { name: 'Jun 2026', daysAgoStart: 30,  daysAgoEnd: 1,   count: 14 }
    ];

    // Ensure total is exactly 250
    // Sarah Namuli is in Sales (so that's 1), let's keep her in Sales
    const sarahNamuliId = preservedStaff ? preservedStaff.id : randomUUID();
    const salesSups = supervisors[deptMap['Sales']];
    const sarahOkelloSup = salesSups.find(s => s.firstName === 'Samuel') || salesSups[0];
    
    const sarahNamuliUser = {
      id: sarahNamuliId,
      firebaseUid: preservedStaff ? preservedStaff.firebase_uid : generateFirebaseUid('sarah.namuli@movitgroup.internal'),
      employeeNumber: getUniqueEmpNumber(),
      firstName: preservedStaff ? preservedStaff.first_name : 'Sarah',
      lastName: preservedStaff ? preservedStaff.last_name : 'Namuli',
      email: 'sarah.namuli@movitgroup.internal',
      phone: getUniquePhone(),
      jobTitle: 'Sales Field Officer',
      roleId: staffRoleId,
      departmentId: deptMap['Sales'],
      managerId: sarahOkelloSup.id,
      hierarchyPath: `${sarahOkelloSup.hierarchyPath}/${sarahNamuliId}`,
      status: 'ACTIVE',
      onboardingComplete: true,
      onboardingCompletedAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000), // March 2026
      dateJoinedDepartment: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
      lastDepartmentChangeAt: null,
      createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000)
    };
    generatedUsers.push(sarahNamuliUser);

    // Let's build a roster of field staff specification to generate
    let staffToGenerateCount = 249; // 250 - Sarah
    const fieldStaffUsers: any[] = [];

    // Distribute them evenly across departments (approx 25 per department)
    // We will generate them and assign them a join date based on our monthly distribution
    let currentDeptIndex = 0;
    let currentMonthIndex = 0;
    let monthGeneratedCount = 0;

    for (let f = 0; f < staffToGenerateCount; f++) {
      // Rotate department
      const dName = targetDeptNames[currentDeptIndex];
      const deptId = deptMap[dName];
      currentDeptIndex = (currentDeptIndex + 1) % targetDeptNames.length;

      // Assign supervisor
      const deptSups = supervisors[deptId];
      const supervisor = deptSups[Math.floor(Math.random() * deptSups.length)] || salesSups[0];

      // Assign month of join to fit monthly workforce growth trends
      const mSpec = months[currentMonthIndex];
      monthGeneratedCount++;
      if (monthGeneratedCount >= mSpec.count) {
        currentMonthIndex = (currentMonthIndex + 1) % months.length;
        monthGeneratedCount = 0;
      }

      // Select random date within month boundaries
      const daysAgo = Math.floor(mSpec.daysAgoEnd + Math.random() * (mSpec.daysAgoStart - mSpec.daysAgoEnd));
      const joinDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const { firstName, lastName } = generateUniqueName(usedNames);
      const email = getUniqueEmail(firstName, lastName);
      const staffId = randomUUID();

      const staffUser = {
        id: staffId,
        firebaseUid: generateFirebaseUid(email),
        employeeNumber: getUniqueEmpNumber(),
        firstName,
        lastName,
        email,
        phone: getUniquePhone(),
        jobTitle: `${dName} Field Representative`,
        roleId: staffRoleId,
        departmentId: deptId,
        managerId: supervisor.id,
        hierarchyPath: `${supervisor.hierarchyPath}/${staffId}`,
        status: 'ACTIVE',
        onboardingComplete: true,
        onboardingCompletedAt: joinDate,
        dateJoinedDepartment: joinDate,
        lastDepartmentChangeAt: null,
        createdAt: joinDate
      };
      
      generatedUsers.push(staffUser);
      fieldStaffUsers.push(staffUser);
    }

    console.log(`Structured user database has: ${generatedUsers.length} total users.`);

    // 6. Generate Department Assignments History and Department Transfers (10% one transfer, 5% two+ transfers, 85% none)
    console.log('Generating Department Assignment History and Transfer logs...');
    
    // Total employees to apply transfers is the 250 field staff
    // 85% -> No transfers. We just insert their initial onboarding assignment.
    // 10% -> 1 transfer.
    // 5% -> 2 transfers.
    const totalStaff = fieldStaffUsers.length; // 249
    const oneTransferCount = Math.floor(totalStaff * 0.10); // 24 users
    const twoTransferCount = Math.floor(totalStaff * 0.05); // 12 users
    const noTransferCount = totalStaff - oneTransferCount - twoTransferCount;

    // Shuffle field staff to pick transfer candidates randomly
    const shuffledStaff = [...fieldStaffUsers].sort(() => Math.random() - 0.5);

    const reasons = [
      { tag: 'Promotion', desc: 'Promotion: Promoted and reassigned due to exceptional performance review' },
      { tag: 'Internal Transfer', desc: 'Internal Transfer: Departmental transfer for cross-functional synergy' },
      { tag: 'Temporary Assignment', desc: 'Temporary Assignment: Transferred to assist during temporary peak distribution season' },
      { tag: 'Department Expansion', desc: 'Department Expansion: Strategic relocation to support regional growth' },
      { tag: 'Workforce Rebalancing', desc: 'Workforce Rebalancing: Reassigned to optimize team headcount ratios' },
      { tag: 'Leadership Development', desc: 'Leadership Development: Rotational program assignment' },
      { tag: 'Skills Realignment', desc: 'Skills Realignment: Relocated to align with specialized domain competencies' },
      { tag: 'Department Restructuring', desc: 'Department Restructuring: Reassigned due to operations realignment' }
    ];

    // We will use one of our platform admins (e.g., Peter Ssewankambo or System Admin) to authorize transfers
    const adminAuthorizer = generatedUsers.find(u => u.email === 'admin@movitgroup.internal' || u.jobTitle === 'HR Platform Systems Auditor') || sysAdminUser;

    // Helper to log initial assignment record
    const logInitialAssignment = (u: any) => {
      assignmentHistoryRecords.push({
        id: randomUUID(),
        userId: u.id,
        previousDepartmentId: null,
        newDepartmentId: u.departmentId,
        assignedBy: u.id, // Self-assigned during onboarding registration
        assignmentReason: 'Onboarding Self-Enrollment Department Assignment',
        effectiveDate: u.onboardingCompletedAt,
        createdAt: u.onboardingCompletedAt
      });
      
      auditLogsRecords.push({
        id: randomUUID(),
        userId: u.id,
        action: 'USER_ONBOARDING_COMPLETED',
        ipAddress: '192.168.1.15',
        timestamp: u.onboardingCompletedAt,
        metadata: { departmentId: u.departmentId }
      });
    };

    // Process No-Transfers (85%)
    console.log(`Processing ${noTransferCount} staff with no transfer history...`);
    const noTransferStaff = shuffledStaff.slice(0, noTransferCount);
    for (const u of noTransferStaff) {
      logInitialAssignment(u);
    }

    // Process One-Transfer (10%)
    console.log(`Processing ${oneTransferCount} staff with exactly 1 transfer history record...`);
    const oneTransferStaff = shuffledStaff.slice(noTransferCount, noTransferCount + oneTransferCount);
    for (const u of oneTransferStaff) {
      // Initial assignment
      const originalDeptId = u.departmentId;
      const originalOnboardingTime = u.onboardingCompletedAt;
      
      // Let's pick a new department to transfer to
      const otherDepts = targetDeptNames.filter(name => deptMap[name] !== originalDeptId);
      const newDeptName = otherDepts[Math.floor(Math.random() * otherDepts.length)];
      const newDeptId = deptMap[newDeptName];

      // Transfer date is random between onboarding and now
      const onboardingDaysAgo = Math.floor((Date.now() - originalOnboardingTime.getTime()) / (24 * 60 * 60 * 1000));
      const transferDaysAgo = Math.floor(onboardingDaysAgo * 0.4); // Transfer happened at some mid-point
      const transferDate = new Date(Date.now() - (transferDaysAgo > 0 ? transferDaysAgo : 5) * 24 * 60 * 60 * 1000);

      // 1. Initial Assignment Record (Original Dept)
      assignmentHistoryRecords.push({
        id: randomUUID(),
        userId: u.id,
        previousDepartmentId: null,
        newDepartmentId: originalDeptId,
        assignedBy: u.id,
        assignmentReason: 'Onboarding Self-Enrollment Department Assignment',
        effectiveDate: originalOnboardingTime,
        createdAt: originalOnboardingTime
      });

      auditLogsRecords.push({
        id: randomUUID(),
        userId: u.id,
        action: 'USER_ONBOARDING_COMPLETED',
        ipAddress: '192.168.1.18',
        timestamp: originalOnboardingTime,
        metadata: { departmentId: originalDeptId }
      });

      // 2. Transfer Assignment Record (New Dept)
      const reasonSpec = reasons[Math.floor(Math.random() * reasons.length)];
      assignmentHistoryRecords.push({
        id: randomUUID(),
        userId: u.id,
        previousDepartmentId: originalDeptId,
        newDepartmentId: newDeptId,
        assignedBy: adminAuthorizer.id,
        assignmentReason: reasonSpec.desc,
        effectiveDate: transferDate,
        createdAt: transferDate
      });

      auditLogsRecords.push({
        id: randomUUID(),
        userId: adminAuthorizer.id,
        action: 'DEPARTMENT_TRANSFER',
        ipAddress: '192.168.1.100',
        timestamp: transferDate,
        metadata: {
          targetUserId: u.id,
          previousDepartmentId: originalDeptId,
          newDepartmentId: newDeptId,
          reason: reasonSpec.tag
        }
      });

      // 3. Update active user current state in-memory so they are inserted with updated department!
      u.departmentId = newDeptId;
      u.lastDepartmentChangeAt = transferDate;
      u.dateJoinedDepartment = transferDate;
      u.jobTitle = `${newDeptName} Field Representative`;
    }

    // Process Two-Transfers (5%)
    console.log(`Processing ${twoTransferCount} staff with 2+ transfer history records...`);
    const twoTransferStaff = shuffledStaff.slice(noTransferCount + oneTransferCount);
    for (const u of twoTransferStaff) {
      const onboardingDeptId = u.departmentId;
      const onboardingTime = u.onboardingCompletedAt;

      // First Transfer
      const deptsForTransfer1 = targetDeptNames.filter(name => deptMap[name] !== onboardingDeptId);
      const dept1Name = deptsForTransfer1[Math.floor(Math.random() * deptsForTransfer1.length)];
      const dept1Id = deptMap[dept1Name];

      // Second Transfer
      const deptsForTransfer2 = targetDeptNames.filter(name => deptMap[name] !== dept1Id);
      const dept2Name = deptsForTransfer2[Math.floor(Math.random() * deptsForTransfer2.length)];
      const dept2Id = deptMap[dept2Name];

      const onboardingDaysAgo = Math.floor((Date.now() - onboardingTime.getTime()) / (24 * 60 * 60 * 1000));
      const transfer1DaysAgo = Math.floor(onboardingDaysAgo * 0.6); // transfer 1 at 60% age
      const transfer2DaysAgo = Math.floor(onboardingDaysAgo * 0.2); // transfer 2 at 20% age

      const transfer1Date = new Date(Date.now() - (transfer1DaysAgo > 0 ? transfer1DaysAgo : 15) * 24 * 60 * 60 * 1000);
      const transfer2Date = new Date(Date.now() - (transfer2DaysAgo > 0 ? transfer2DaysAgo : 5) * 24 * 60 * 60 * 1000);

      // 1. Initial Assignment Record
      assignmentHistoryRecords.push({
        id: randomUUID(),
        userId: u.id,
        previousDepartmentId: null,
        newDepartmentId: onboardingDeptId,
        assignedBy: u.id,
        assignmentReason: 'Onboarding Self-Enrollment Department Assignment',
        effectiveDate: onboardingTime,
        createdAt: onboardingTime
      });

      auditLogsRecords.push({
        id: randomUUID(),
        userId: u.id,
        action: 'USER_ONBOARDING_COMPLETED',
        ipAddress: '192.168.1.25',
        timestamp: onboardingTime,
        metadata: { departmentId: onboardingDeptId }
      });

      // 2. Transfer 1 Record
      const reason1 = reasons[Math.floor(Math.random() * reasons.length)];
      assignmentHistoryRecords.push({
        id: randomUUID(),
        userId: u.id,
        previousDepartmentId: onboardingDeptId,
        newDepartmentId: dept1Id,
        assignedBy: adminAuthorizer.id,
        assignmentReason: `Interim Transfer: ${reason1.desc}`,
        effectiveDate: transfer1Date,
        createdAt: transfer1Date
      });

      auditLogsRecords.push({
        id: randomUUID(),
        userId: adminAuthorizer.id,
        action: 'DEPARTMENT_TRANSFER',
        ipAddress: '192.168.1.100',
        timestamp: transfer1Date,
        metadata: {
          targetUserId: u.id,
          previousDepartmentId: onboardingDeptId,
          newDepartmentId: dept1Id,
          reason: 'ROTATIONAL'
        }
      });

      // 3. Transfer 2 Record (Current active dept)
      const reason2 = reasons[Math.floor(Math.random() * reasons.length)];
      assignmentHistoryRecords.push({
        id: randomUUID(),
        userId: u.id,
        previousDepartmentId: dept1Id,
        newDepartmentId: dept2Id,
        assignedBy: adminAuthorizer.id,
        assignmentReason: `Final Transfer: ${reason2.desc}`,
        effectiveDate: transfer2Date,
        createdAt: transfer2Date
      });

      auditLogsRecords.push({
        id: randomUUID(),
        userId: adminAuthorizer.id,
        action: 'DEPARTMENT_TRANSFER',
        ipAddress: '192.168.1.100',
        timestamp: transfer2Date,
        metadata: {
          targetUserId: u.id,
          previousDepartmentId: dept1Id,
          newDepartmentId: dept2Id,
          reason: reason2.tag
        }
      });

      // 4. Update active user current state in-memory so they are inserted with updated department!
      u.departmentId = dept2Id;
      u.lastDepartmentChangeAt = transfer2Date;
      u.dateJoinedDepartment = transfer2Date;
      u.jobTitle = `${dept2Name} Field Representative`;
    }

    // Ensure Sarah Namuli's initial assignment is logged
    logInitialAssignment(sarahNamuliUser);

    // Ensure managers & supervisors & executives also have initial assignments logged
    console.log('Logging initial assignments for executives, admins, managers, and supervisors...');
    for (const u of generatedUsers) {
      if (u.roleId !== staffRoleId && u.departmentId) {
        assignmentHistoryRecords.push({
          id: randomUUID(),
          userId: u.id,
          previousDepartmentId: null,
          newDepartmentId: u.departmentId,
          assignedBy: u.id,
          assignmentReason: 'Onboarding Self-Enrollment Department Assignment',
          effectiveDate: u.onboardingCompletedAt || u.createdAt,
          createdAt: u.onboardingCompletedAt || u.createdAt
        });
        
        auditLogsRecords.push({
          id: randomUUID(),
          userId: u.id,
          action: 'USER_ONBOARDING_COMPLETED',
          ipAddress: '192.168.1.1',
          timestamp: u.onboardingCompletedAt || u.createdAt,
          metadata: { departmentId: u.departmentId }
        });
      }
    }

    // 7. Write Data to Database using highly optimized Batch Insertion
    console.log('Inserting user profiles into Neon Database in batches...');
    
    // Batch insert users (50 at a time to prevent statement size limits)
    const userBatchSize = 50;
    for (let i = 0; i < generatedUsers.length; i += userBatchSize) {
      const batch = generatedUsers.slice(i, i + userBatchSize);
      const valuePlaceholders = batch.map((_, idx) => {
        const offset = idx * 18;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18})`;
      }).join(', ');

      const flatValues: any[] = [];
      batch.forEach(u => {
        flatValues.push(
          u.id, u.firebaseUid, u.employeeNumber, u.firstName, u.lastName, 
          u.email, u.phone, u.jobTitle, null, u.roleId, 
          u.departmentId, u.managerId, u.hierarchyPath, u.status, u.onboardingComplete, 
          u.onboardingCompletedAt, u.dateJoinedDepartment, u.lastDepartmentChangeAt
        );
      });

      await client.query(`
        INSERT INTO users (
          id, firebase_uid, employee_number, first_name, last_name, 
          email, phone, job_title, profile_photo_url, role_id, 
          department_id, manager_id, hierarchy_path, status, onboarding_complete, 
          onboarding_completed_at, date_joined_department, last_department_change_at
        ) VALUES ${valuePlaceholders};
      `, flatValues);
    }
    console.log(`Inserted ${generatedUsers.length} user profiles.`);

    // Set Head of Department (first manager of department becomes Head)
    console.log('Configuring Department Heads...');
    for (const dName of targetDeptNames) {
      const deptId = deptMap[dName];
      const deptMgr = managers.find(m => m.departmentId === deptId);
      if (deptMgr) {
        await client.query('UPDATE departments SET head_user_id = $1 WHERE id = $2;', [deptMgr.id, deptId]);
      }
    }

    // Insert Department Assignment History records in batches
    console.log('Inserting Department Assignment History records...');
    const historyBatchSize = 100;
    for (let i = 0; i < assignmentHistoryRecords.length; i += historyBatchSize) {
      const batch = assignmentHistoryRecords.slice(i, i + historyBatchSize);
      const valuePlaceholders = batch.map((_, idx) => {
        const offset = idx * 8;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
      }).join(', ');

      const flatValues: any[] = [];
      batch.forEach(r => {
        flatValues.push(
          r.id, r.userId, r.previousDepartmentId, r.newDepartmentId,
          r.assignedBy, r.assignmentReason, r.effectiveDate, r.createdAt
        );
      });

      await client.query(`
        INSERT INTO department_assignment_history (
          id, user_id, previous_department_id, new_department_id,
          assigned_by, assignment_reason, effective_date, created_at
        ) VALUES ${valuePlaceholders};
      `, flatValues);
    }
    console.log(`Inserted ${assignmentHistoryRecords.length} assignment history records.`);

    // Insert Audit Logs in batches
    console.log('Inserting Audit Logs...');
    const auditBatchSize = 100;
    for (let i = 0; i < auditLogsRecords.length; i += auditBatchSize) {
      const batch = auditLogsRecords.slice(i, i + auditBatchSize);
      const valuePlaceholders = batch.map((_, idx) => {
        const offset = idx * 6;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
      }).join(', ');

      const flatValues: any[] = [];
      batch.forEach(l => {
        flatValues.push(
          l.id, l.userId, l.action, l.ipAddress, l.timestamp, JSON.stringify(l.metadata)
        );
      });

      await client.query(`
        INSERT INTO audit_logs (
          id, user_id, action, ip_address, timestamp, metadata
        ) VALUES ${valuePlaceholders};
      `, flatValues);
    }
    console.log(`Inserted ${auditLogsRecords.length} audit log records.`);

    // Generate workforce inventory file for reference
    console.log('Generating JSON inventory file...');
    const inventoryData = generatedUsers.map(u => ({
      fullName: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: dbRoles.find(r => r.id === u.roleId)?.name || 'Field Staff',
      department: targetDeptNames.find(n => deptMap[n] === u.departmentId) || 'Unassigned',
      jobTitle: u.jobTitle,
      employeeNumber: u.employeeNumber,
      phone: u.phone,
      tempPassword: 'Movit2026Password!',
      firebaseUid: u.firebaseUid
    }));

    const outputDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'workforce_inventory.json'), 
      JSON.stringify(inventoryData, null, 2)
    );
    console.log('Created public/workforce_inventory.json containing full credentials list.');

  } catch (err: any) {
    console.error('An error occurred during data generation:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log('✅ Enterprise workforce data population successfully completed.');
}

main();
