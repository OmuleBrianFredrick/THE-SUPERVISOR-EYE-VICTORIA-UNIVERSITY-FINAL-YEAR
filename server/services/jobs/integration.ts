import { db } from '../../db/index.js';
import { webhooks, webhookLogs, integrationSyncLogs } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export async function handleIntegrationJob(job: any) {
  const { jobType, payload } = job;
  
  if (jobType === 'dispatch-webhook') {
    const { webhookId, event, payload: webhookPayload } = payload;
    
    const webhook = await db.query.webhooks.findFirst({ where: eq(webhooks.id, webhookId) });
    if (!webhook) throw new Error('Webhook not found');
    
    // Simulate webhook dispatch
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const responseStatus = 200;
    const responseBody = 'OK';
    
    const log = await db.insert(webhookLogs).values({
       webhookId,
       event,
       payloadSnapshot: webhookPayload,
       status: responseStatus === 200 ? 'SUCCESS' : 'FAILED',
       responseStatus,
       responseBody
    }).returning();
    
    return { delivered: responseStatus === 200, logId: log[0].id };
  }
  
  if (jobType === 'erp-sync') {
    // Simulate ERP sync
    const { systemName, syncType, itemsToSync } = payload;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await db.insert(integrationSyncLogs).values({
       systemName,
       syncType,
       status: 'SUCCESS',
       payloadSnapshot: { itemCount: itemsToSync }
    });
    
    return { synced: true, itemsToSync };
  }
  
  throw new Error(`Unknown Integration job type: ${jobType}`);
}
