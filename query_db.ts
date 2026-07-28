import { db } from './server/db/index';
import { evidence, reports, tasks } from './server/db/schema';
async function run() {
  const allEvidence = await db.select().from(evidence).limit(5);
  console.log('Evidence:', allEvidence.length);
  const allReports = await db.select().from(reports).limit(5);
  console.log('Reports:', allReports.map(r => ({ id: r.id, status: r.status })));
  const allTasks = await db.select().from(tasks).limit(5);
  console.log('Tasks:', allTasks.map(t => ({ id: t.id, status: t.status, extendedStatus: t.extendedStatus })));
  process.exit(0);
}
run();
