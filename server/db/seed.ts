import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('Seeding database...');
  
  // Create roles
  const [adminRole] = await db.insert(schema.roles).values({
    name: 'Administrator',
    permissions: { all: true }
  }).returning();

  const [managerRole] = await db.insert(schema.roles).values({
    name: 'Manager',
    permissions: { viewReports: true, approveReports: true }
  }).returning();

  const [supervisorRole] = await db.insert(schema.roles).values({
    name: 'Supervisor',
    permissions: { viewReports: true, createTasks: true }
  }).returning();

  const [staffRole] = await db.insert(schema.roles).values({
    name: 'Field Staff',
    permissions: { createReports: true }
  }).returning();

  // Create departments
  const [salesDept] = await db.insert(schema.departments).values({
    name: 'Sales & Distribution',
  }).returning();

  const [auditDept] = await db.insert(schema.departments).values({
    name: 'Field Audit',
  }).returning();

  // Create users
  const [adminUser] = await db.insert(schema.users).values({
    firebaseUid: 'firebase_admin_uid',
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@movitgroup.internal',
    roleId: adminRole.id,
    departmentId: auditDept.id,
    employeeNumber: 'EMP-0001',
    jobTitle: 'System Administrator'
  }).returning();

  const [managerUser] = await db.insert(schema.users).values({
    firebaseUid: 'firebase_manager_uid',
    firstName: 'John',
    lastName: 'Kato',
    email: 'john.kato@movitgroup.internal',
    roleId: managerRole.id,
    departmentId: salesDept.id,
    employeeNumber: 'EMP-0002',
    jobTitle: 'General Manager - Field Ops'
  }).returning();

  const [supervisorUser] = await db.insert(schema.users).values({
    firebaseUid: 'firebase_supervisor_uid',
    firstName: 'Samuel',
    lastName: 'Okello',
    email: 'samuel.okello@movitgroup.internal',
    roleId: supervisorRole.id,
    departmentId: salesDept.id,
    managerId: managerUser.id,
    employeeNumber: 'EMP-0003',
    jobTitle: 'Regional Supervisor'
  }).returning();

  const [staffUser] = await db.insert(schema.users).values({
    firebaseUid: 'firebase_staff_uid',
    firstName: 'Sarah',
    lastName: 'Namuli',
    email: 'sarah.namuli@movitgroup.internal',
    roleId: staffRole.id,
    departmentId: salesDept.id,
    managerId: supervisorUser.id,
    employeeNumber: 'EMP-0004',
    jobTitle: 'Merchandising Officer'
  }).returning();

  // Set department head
  await db.update(schema.departments)
    .set({ headUserId: managerUser.id })
    .where(eq(schema.departments.id, salesDept.id));

  // Create tasks
  const [task] = await db.insert(schema.tasks).values({
    title: 'Weekly Stock Audit - Jinja Route',
    description: 'Ensure all stock levels are accurate for the current week.',
    taskType: 'STOCK_AUDIT',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    assignedTo: staffUser.id,
    createdBy: supervisorUser.id,
    status: 'IN_PROGRESS'
  }).returning();

  // Create reports
  const [report] = await db.insert(schema.reports).values({
    taskId: task.id,
    submitterId: staffUser.id,
    reportType: 'STOCK_AUDIT',
    status: 'PENDING_REVIEW',
    gpsLat: '0.4477',
    gpsLng: '33.2026',
    isGpsVerified: true,
    notes: 'Audit completed successfully. Found a few discrepancies recorded in the attached document.',
    submittedAt: new Date()
  }).returning();

  // Create evidence
  await db.insert(schema.evidence).values({
    reportId: report.id,
    mediaUrl: 'https://storage.googleapis.com/movit-eye/example-evidence.pdf',
    mediaType: 'DOCUMENT',
    capturedLat: '0.4477',
    capturedLng: '33.2026',
    capturedAt: new Date()
  });

  // Create approvals
  await db.insert(schema.approvals).values({
    reportId: report.id,
    approverId: supervisorUser.id,
    decision: 'APPROVED',
    comments: 'Looks good. Follow up on the discrepancies next week.',
  });

  // Create notifications
  await db.insert(schema.notifications).values({
    userId: managerUser.id,
    title: 'Audit Report Approved',
    message: 'Supervisor Samuel Okello has approved the weekly stock audit for Jinja Route.',
    notificationType: 'APPROVAL',
  });

  console.log('Seeding completed.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
