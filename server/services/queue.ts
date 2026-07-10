import { db } from '../db/index.js';
import { backgroundJobs } from '../db/schema.js';
import { eq, and, lte, asc, sql } from 'drizzle-orm';

export interface EnqueueOptions {
  queueName: string;
  jobType: string;
  payload: any;
  maxAttempts?: number;
  scheduledFor?: Date;
}

export async function enqueueJob(options: EnqueueOptions) {
  const [job] = await db.insert(backgroundJobs).values({
    queueName: options.queueName,
    jobType: options.jobType,
    payload: options.payload,
    maxAttempts: options.maxAttempts || 3,
    scheduledFor: options.scheduledFor || new Date(),
  }).returning();
  
  return job;
}

export async function processNextJob(queueName: string) {
  // Simple lock mechanism using Postgres UPDATE ... RETURNING
  // This simulates a transactional lock for pulling the next pending job
  const now = new Date();
  
  // Need to lock the row that is oldest, pending, and scheduled for <= now
  const query = sql`
    UPDATE background_jobs
    SET status = 'PROCESSING',
        locked_at = NOW(),
        locked_until = NOW() + INTERVAL '5 minutes',
        attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = (
      SELECT id FROM background_jobs
      WHERE queue_name = ${queueName}
        AND (status = 'PENDING' OR (status = 'PROCESSING' AND locked_until < NOW()))
        AND scheduled_for <= NOW()
      ORDER BY scheduled_for ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
  `;
  
  const result = await db.execute(query);
  const jobs: any[] = (result as any).rows || result;
  
  if (!jobs || jobs.length === 0) {
    return null;
  }
  
  return jobs[0];
}

export async function markJobComplete(jobId: string, resultData?: any) {
  await db.update(backgroundJobs)
    .set({
      status: 'COMPLETED',
      result: resultData || null,
      lockedAt: null,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(backgroundJobs.id, jobId));
}

export async function markJobFailed(jobId: string, error: Error, attempts: number, maxAttempts: number) {
  const isFinalFailure = attempts >= maxAttempts;
  const nextStatus = isFinalFailure ? 'FAILED' : 'PENDING';
  
  // Calculate exponential backoff if retrying
  const nextScheduled = new Date();
  if (!isFinalFailure) {
    nextScheduled.setSeconds(nextScheduled.getSeconds() + Math.pow(2, attempts) * 30);
  }
  
  await db.update(backgroundJobs)
    .set({
      status: nextStatus,
      errorReason: error.message || String(error),
      lockedAt: null,
      lockedUntil: null,
      scheduledFor: nextScheduled,
      updatedAt: new Date(),
    })
    .where(eq(backgroundJobs.id, jobId));
}
