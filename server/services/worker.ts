import { db } from '../db/index.js';
import { processNextJob, markJobComplete, markJobFailed, enqueueJob } from './queue.js';
import { handleAiJob } from './jobs/ai.js';
import { handleSlaJob } from './jobs/sla.js';
import { handleNotificationJob } from './jobs/notification.js';
import { handleIntegrationJob } from './jobs/integration.js';

const QUEUES = ['ai', 'sla', 'notifications', 'integration'];
let isRunning = false;

export async function startWorker() {
  if (isRunning) return;
  isRunning = true;
  console.log('[Worker] Starting background processing engine...');
  
  // Start polling loops for each queue
  QUEUES.forEach(queue => pollQueue(queue));
}

async function pollQueue(queueName: string) {
  while (isRunning) {
    try {
      const job = await processNextJob(queueName);
      
      if (job) {
        // console.log(`[Worker] Processing job ${job.id} from queue ${queueName} (${job.jobType})`);
        
        try {
          let result;
          switch (queueName) {
            case 'ai':
              result = await handleAiJob(job);
              break;
            case 'sla':
              result = await handleSlaJob(job);
              break;
            case 'notifications':
              result = await handleNotificationJob(job);
              break;
            case 'integration':
              result = await handleIntegrationJob(job);
              break;
            default:
              throw new Error(`Unknown queue: ${queueName}`);
          }
          
          await markJobComplete(job.id, result);
        } catch (jobError: any) {
          console.error(`[Worker] Job ${job.id} failed:`, jobError);
          await markJobFailed(job.id, jobError, job.attempts, job.maxAttempts);
        }
      } else {
        // No job found, wait before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (pollError) {
      console.error(`[Worker] Polling error on queue ${queueName}:`, pollError);
      await new Promise(resolve => setTimeout(resolve, 5000)); // longer backoff on DB error
    }
  }
}

export function stopWorker() {
  isRunning = false;
  console.log('[Worker] Stopping background processing engine...');
}
