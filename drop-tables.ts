import { db } from './server/db/index.js';
import { sql } from 'drizzle-orm';

async function drop() {
  await db.execute(sql`DROP TABLE executive_summaries CASCADE;`);
  await db.execute(sql`DROP TABLE ai_insights CASCADE;`);
  console.log('Dropped');
  process.exit(0);
}

drop().catch(console.error);
