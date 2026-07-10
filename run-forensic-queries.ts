import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function runForensic() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const client = await pool.connect();

  console.log('--- STARTING POST-GENERATION DATABASE FORENSIC AUDIT ---');

  try {
    // 1. Get exact counts of all major tables
    const tables = [
      'tasks',
      'reports',
      'evidence',
      'approvals',
      'report_approvals',
      'escalations',
      'notifications',
      'executive_summaries',
      'user_intelligence',
      'audit_logs',
      'org_health_metrics',
      'department_intelligence',
      'users',
      'departments',
      'roles'
    ];

    console.log('\n--- 1. DATABASE POPULATION STATUS (EXACT COUNTS) ---');
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM "${table}";`);
        console.log(`Table "${table}": ${res.rows[0].count} records`);
      } catch (err: any) {
        console.log(`Table "${table}": Query failed (${err.message})`);
      }
    }

    // 2. Random record inspection
    console.log('\n--- 2. RANDOM RECORD SAMPLES ---');

    console.log('\n[TASKS SAMPLES] (Limit 3)');
    try {
      const res = await client.query(`
        SELECT id, title, task_type, priority, status, assigned_to, created_at 
        FROM tasks 
        LIMIT 3;
      `);
      console.log(JSON.stringify(res.rows, null, 2));
    } catch (err: any) {
      console.log(`Failed to fetch tasks: ${err.message}`);
    }

    console.log('\n[REPORTS SAMPLES] (Limit 3)');
    try {
      const res = await client.query(`
        SELECT id, task_id, submitter_id, report_type, status, is_gps_verified, performance_score, submitted_at 
        FROM reports 
        LIMIT 3;
      `);
      console.log(JSON.stringify(res.rows, null, 2));
    } catch (err: any) {
      console.log(`Failed to fetch reports: ${err.message}`);
    }

    console.log('\n[ESCALATIONS SAMPLES] (Limit 3)');
    try {
      const res = await client.query(`
        SELECT id, report_id, report_approval_id, escalated_to_id, reason, status, created_at 
        FROM escalations 
        LIMIT 3;
      `);
      console.log(JSON.stringify(res.rows, null, 2));
    } catch (err: any) {
      console.log(`Failed to fetch escalations: ${err.message}`);
    }

    console.log('\n[NOTIFICATIONS SAMPLES] (Limit 3)');
    try {
      const res = await client.query(`
        SELECT id, user_id, title, message, notification_type, is_read, created_at 
        FROM notifications 
        LIMIT 3;
      `);
      console.log(JSON.stringify(res.rows, null, 2));
    } catch (err: any) {
      console.log(`Failed to fetch notifications: ${err.message}`);
    }

    // 3. Relational integrity audits
    console.log('\n--- 3. RELATIONAL INTEGRITY CHECKS ---');
    
    // Check for orphan reports (reports without valid submitter)
    const orphanReportsRes = await client.query(`
      SELECT COUNT(*) 
      FROM reports r 
      LEFT JOIN users u ON r.submitter_id = u.id 
      WHERE u.id IS NULL;
    `);
    console.log(`Orphan Reports (No valid submitter): ${orphanReportsRes.rows[0].count}`);

    // Check for orphan evidence (evidence without valid report)
    const orphanEvidenceRes = await client.query(`
      SELECT COUNT(*) 
      FROM evidence e 
      LEFT JOIN reports r ON e.report_id = r.id 
      WHERE r.id IS NULL;
    `);
    console.log(`Orphan Evidence (No valid report): ${orphanEvidenceRes.rows[0].count}`);

    // Check for orphan escalations
    const orphanEscalationsRes = await client.query(`
      SELECT COUNT(*) 
      FROM escalations e 
      LEFT JOIN reports r ON e.report_id = r.id 
      WHERE r.id IS NULL;
    `);
    console.log(`Orphan Escalations (No valid report): ${orphanEscalationsRes.rows[0].count}`);

    // Check report approval step distributions
    const raDistRes = await client.query(`
      SELECT status, COUNT(*) 
      FROM report_approvals 
      GROUP BY status;
    `);
    console.log('Report Approval Steps Distribution:');
    raDistRes.rows.forEach(r => {
      console.log(`  - Status "${r.status}": ${r.count}`);
    });

  } catch (err: any) {
    console.error('Forensic Script Critical Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runForensic();
