import { db } from '../db/index.js';
import { users, roles, departments } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

async function main() {
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    jobTitle: users.jobTitle,
    managerId: users.managerId,
    hierarchyPath: users.hierarchyPath,
    role: roles.name,
    department: departments.name,
  })
  .from(users)
  .leftJoin(roles, eq(users.roleId, roles.id))
  .leftJoin(departments, eq(users.departmentId, departments.id));

  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // 1. All 6 Executives + 1 Admin
  const execs = allUsers.filter(u => u.role === 'Executive' || u.role === 'SUPER_ADMIN' || u.role === 'Administrator').slice(0, 7);

  // 2. Select Managers (3-4 key departments: Sales, Distribution, Manufacturing, HR)
  const managers = allUsers.filter(u => u.role === 'Manager').slice(0, 4);

  // 3. Select Supervisors reporting to those managers or in those departments
  const managerIds = new Set(managers.map(m => m.id));
  let supervisors = allUsers.filter(u => u.role === 'Supervisor' && u.managerId && managerIds.has(u.managerId));
  if (supervisors.length < 4) {
    supervisors = [...supervisors, ...allUsers.filter(u => u.role === 'Supervisor').slice(0, 5 - supervisors.length)];
  }

  // 4. Select Field Staff reporting to those supervisors
  const supervisorIds = new Set(supervisors.map(s => s.id));
  let fieldStaff = allUsers.filter(u => u.role === 'Field Staff' && u.managerId && supervisorIds.has(u.managerId));
  if (fieldStaff.length < 4) {
    fieldStaff = [...fieldStaff, ...allUsers.filter(u => u.role === 'Field Staff').slice(0, 5 - fieldStaff.length)];
  }

  // Combine into demo accounts (~16-18 total)
  const demoAccounts = [...execs, ...managers, ...supervisors, ...fieldStaff].slice(0, 18);

  console.log(`\n=== SELECTED DEMO HIERARCHY (${demoAccounts.length} ACCOUNTS) ===\n`);
  demoAccounts.forEach((u, i) => {
    const mgr = u.managerId ? userMap.get(u.managerId) : null;
    const mgrText = mgr ? `${mgr.firstName} ${mgr.lastName} (${mgr.role})` : 'None (Top Level)';
    console.log(`${i + 1}. [${u.role?.toUpperCase()}] ${u.firstName} ${u.lastName} <${u.email}>`);
    console.log(`   Title: ${u.jobTitle} | Dept: ${u.department || 'Executive'}`);
    console.log(`   Reports To: ${mgrText}`);
    console.log(`----------------------------------------------------------------`);
  });

}

main().catch(console.error);
