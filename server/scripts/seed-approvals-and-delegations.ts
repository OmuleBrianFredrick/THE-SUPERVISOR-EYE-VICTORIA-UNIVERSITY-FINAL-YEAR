import { db } from '../db/index.js';
import { approvalChains, approvalSteps, delegations, users, roles, departments } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function seedApprovalsAndDelegations() {
  console.log('Seeding Approval Chains, Steps, and Delegations using actual DB entities...');

  // Fetch roles, departments, users
  const allRoles = await db.select().from(roles);
  const allDepts = await db.select().from(departments);
  const allUsers = await db.select().from(users);

  const roleMap = new Map(allRoles.map(r => [r.name, r.id]));
  const deptMap = new Map(allDepts.map(d => [d.name, d.id]));
  const userByEmail = new Map(allUsers.map(u => [u.email, u]));

  // Get Role IDs
  const supervisorRoleId = roleMap.get('Supervisor');
  const managerRoleId = roleMap.get('Manager');
  const execRoleId = roleMap.get('Executive');

  // Get Department IDs
  const salesDeptId = deptMap.get('Sales');
  const distDeptId = deptMap.get('Distribution');
  const ictDeptId = deptMap.get('ICT');
  const finDeptId = deptMap.get('Finance');

  // --- 1. SEED APPROVAL CHAINS ---
  console.log('Clearing old chains & delegations...');
  await db.delete(approvalSteps);
  await db.delete(approvalChains);
  await db.delete(delegations);

  // Chain A: Field Operations Multi-Tier Governance
  const [chain1] = await db.insert(approvalChains).values({
    name: 'Executive Field Operations & Quality Governance Chain',
    departmentId: salesDeptId || null,
    taskType: 'FIELD_AUDIT',
    isActive: true,
  }).returning();

  await db.insert(approvalSteps).values([
    {
      chainId: chain1.id,
      stepOrder: 1,
      roleId: supervisorRoleId || null,
      slaHours: 12,
      slaAction: 'ESCALATE',
    },
    {
      chainId: chain1.id,
      stepOrder: 2,
      roleId: managerRoleId || null,
      slaHours: 24,
      slaAction: 'ESCALATE',
    },
    {
      chainId: chain1.id,
      stepOrder: 3,
      roleId: execRoleId || null,
      slaHours: 48,
      slaAction: 'AUTO_APPROVE',
    },
  ]);

  // Chain B: Distribution & Logistics Dispatch Sign-off
  const [chain2] = await db.insert(approvalChains).values({
    name: 'Distribution & Logistics High-Value Verification Chain',
    departmentId: distDeptId || null,
    taskType: 'LOGISTICS_VERIFICATION',
    isActive: true,
  }).returning();

  const bruceUser = userByEmail.get('bruce.mpamizo@movitgroup.com');

  await db.insert(approvalSteps).values([
    {
      chainId: chain2.id,
      stepOrder: 1,
      roleId: supervisorRoleId || null,
      slaHours: 8,
      slaAction: 'ESCALATE',
    },
    {
      chainId: chain2.id,
      stepOrder: 2,
      roleId: managerRoleId || null,
      slaHours: 18,
      slaAction: 'ESCALATE',
    },
    {
      chainId: chain2.id,
      stepOrder: 3,
      userId: bruceUser?.id || null, // Specifically Operations Director
      slaHours: 36,
      slaAction: 'ESCALATE',
    },
  ]);

  // Chain C: ICT Infrastructure Security Compliance
  const [chain3] = await db.insert(approvalChains).values({
    name: 'ICT Security & Infrastructure Compliance Chain',
    departmentId: ictDeptId || null,
    taskType: 'SECURITY_AUDIT',
    isActive: true,
  }).returning();

  const davidUser = userByEmail.get('david.ssenyonga@movitgroup.internal');

  await db.insert(approvalSteps).values([
    {
      chainId: chain3.id,
      stepOrder: 1,
      roleId: supervisorRoleId || null,
      slaHours: 12,
      slaAction: 'ESCALATE',
    },
    {
      chainId: chain3.id,
      stepOrder: 2,
      userId: davidUser?.id || null, // ICT Director
      slaHours: 24,
      slaAction: 'AUTO_APPROVE',
    },
  ]);

  console.log('✅ Created 3 Multi-Tier Approval Chains with SLA steps!');

  // --- 2. SEED DELEGATIONS ---
  const execMpamizo = userByEmail.get('bruce.mpamizo@movitgroup.com');
  const mgrMayanja = userByEmail.get('ronald.mayanja@movitgroup.internal');
  const mgrKato = userByEmail.get('john.kato@movitgroup.internal');
  const supOkello = userByEmail.get('samuel.okello@movitgroup.internal');
  const execMukiibi = userByEmail.get('adard.mukiibi@movitgroup.com');
  const adminDiana = userByEmail.get('diana.kembabazi@movitgroup.internal');

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
  const inThreeWeeks = new Date(now.getTime() + 21 * 24 * 3600 * 1000);

  const delegationEntries = [];

  if (execMpamizo && mgrMayanja) {
    delegationEntries.push({
      delegatorId: execMpamizo.id,
      delegateeId: mgrMayanja.id,
      startDate: now,
      endDate: nextWeek,
      isActive: true,
    });
  }

  if (mgrKato && supOkello) {
    delegationEntries.push({
      delegatorId: mgrKato.id,
      delegateeId: supOkello.id,
      startDate: now,
      endDate: inThreeWeeks,
      isActive: true,
    });
  }

  if (execMukiibi && adminDiana) {
    delegationEntries.push({
      delegatorId: execMukiibi.id,
      delegateeId: adminDiana.id,
      startDate: now,
      endDate: nextWeek,
      isActive: true,
    });
  }

  if (delegationEntries.length > 0) {
    await db.insert(delegations).values(delegationEntries);
    console.log(`✅ Seeded ${delegationEntries.length} Active Authority Delegations!`);
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seedApprovalsAndDelegations().catch((e) => {
  console.error('Error seeding approvals and delegations:', e);
  process.exit(1);
});
