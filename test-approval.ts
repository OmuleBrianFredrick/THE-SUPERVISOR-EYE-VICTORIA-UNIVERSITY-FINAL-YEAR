import { db } from './server/db/index.js';
import { sql } from 'drizzle-orm';
import { reports } from './server/db/schema.js';

async function test() {
  const pendingReports = await db.execute(sql`SELECT id FROM reports WHERE status = 'PENDING_REVIEW' LIMIT 1`);
  const reportId = pendingReports.rows[0].id;
  console.log("Report ID:", reportId);
  process.exit(0);
}
test();
