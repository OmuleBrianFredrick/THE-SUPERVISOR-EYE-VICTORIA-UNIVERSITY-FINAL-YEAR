import { Router } from 'express';
import { db } from '../db/index.js';
import { apiKeys, webhooks, webhookLogs, integrationSyncLogs } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { verifyToken, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';
import { validate, createApiKeySchema, createWebhookSchema, idParamSchema } from '../validations/index.js';

const router = Router();

// Middleware to verify API key
const verifyApiKey = async (req: any, res: any, next: any) => {
   const authHeader = req.headers.authorization;
   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid API key' });
   }
   
   const key = authHeader.split(' ')[1];
   const keyPrefix = key.substring(0, 8);
   const keyHash = crypto.createHash('sha256').update(key).digest('hex');
   
   const existingKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyPrefix, keyPrefix)
   });
   
   if (!existingKey || existingKey.keyHash !== keyHash || !existingKey.isActive) {
      return res.status(401).json({ error: 'Invalid API key' });
   }
   
   await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, existingKey.id));
   req.apiKey = existingKey;
   next();
};

// API Key Management (Admin only)
router.get('/api-keys', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const keys = await db.query.apiKeys.findMany({
         orderBy: [desc(apiKeys.createdAt)]
      });
      res.json(keys.map(k => ({ ...k, keyHash: undefined }))); // hide hash
   } catch (e) {
      res.status(500).json({ error: 'Failed to fetch API keys' });
   }
});

router.post('/api-keys', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), validate(createApiKeySchema), async (req: any, res: any) => {
   try {
      const { name, scopes } = req.body;
      const rawKey = 'sk_' + crypto.randomBytes(32).toString('hex');
      const keyPrefix = rawKey.substring(0, 8);
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
      
      const newKey = await db.insert(apiKeys).values({
         name,
         keyPrefix,
         keyHash,
         scopes: scopes || [],
         createdBy: req.dbUser.id
      }).returning();
      
      res.json({
         id: newKey[0].id,
         name: newKey[0].name,
         key: rawKey // Only shown once!
      });
   } catch (e) {
      res.status(500).json({ error: 'Failed to create API key' });
   }
});

router.patch('/api-keys/:id/revoke', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), validate(idParamSchema), async (req: any, res: any) => {
   try {
      const { id } = req.params;
      await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, id));
      res.json({ success: true });
   } catch (e) {
      res.status(500).json({ error: 'Failed to revoke API key' });
   }
});

// Webhook Management
router.get('/webhooks', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const results = await db.query.webhooks.findMany({
         orderBy: [desc(webhooks.createdAt)]
      });
      res.json(results);
   } catch (e) {
      res.status(500).json({ error: 'Failed to fetch webhooks' });
   }
});

router.post('/webhooks', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), validate(createWebhookSchema), async (req: any, res: any) => {
   try {
      const { name, endpointUrl, events } = req.body;
      const secret = 'whsec_' + crypto.randomBytes(32).toString('hex');
      
      const newWebhook = await db.insert(webhooks).values({
         name,
         endpointUrl,
         events: events || [],
         secret,
         createdBy: req.dbUser.id
      }).returning();
      
      res.json(newWebhook[0]);
   } catch (e) {
      res.status(500).json({ error: 'Failed to create webhook' });
   }
});

router.patch('/webhooks/:id/toggle', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const { id } = req.params;
      const { isActive } = req.body;
      await db.update(webhooks).set({ isActive }).where(eq(webhooks.id, id));
      res.json({ success: true });
   } catch (e) {
      res.status(500).json({ error: 'Failed to toggle webhook' });
   }
});

// Webhook Logs
router.get('/webhook-logs', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const logs = await db.query.webhookLogs.findMany({
         orderBy: [desc(webhookLogs.sentAt)],
         limit: 100
      });
      res.json(logs);
   } catch (e) {
      res.status(500).json({ error: 'Failed to fetch webhook logs' });
   }
});

// Sync Logs
router.get('/sync-logs', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const logs = await db.query.integrationSyncLogs.findMany({
         orderBy: [desc(integrationSyncLogs.syncedAt)],
         limit: 100
      });
      res.json(logs);
   } catch (e) {
      res.status(500).json({ error: 'Failed to fetch sync logs' });
   }
});

// External API endpoints (Protected by verifyApiKey)
router.post('/incoming-sync', verifyApiKey, async (req: any, res: any) => {
   try {
      const { systemName, payload } = req.body;
      
      const { enqueueJob } = await import('../services/queue.js');
      
      const job = await enqueueJob({
         queueName: 'integration',
         jobType: 'erp-sync',
         payload: { systemName: systemName || 'ERP', syncType: 'INBOUND', itemsToSync: payload ? Object.keys(payload).length : 0 },
      });
      
      res.json({ success: true, jobId: job.id, message: 'Inbound sync queued.' });
   } catch (e) {
      res.status(500).json({ error: 'Failed to process sync' });
   }
});

router.post('/trigger-webhook', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const { webhookId, event, payload } = req.body;
      
      const { enqueueJob } = await import('../services/queue.js');
      
      const job = await enqueueJob({
         queueName: 'integration',
         jobType: 'dispatch-webhook',
         payload: { webhookId, event, payload },
      });
      
      res.json({ success: true, jobId: job.id, message: 'Webhook dispatch queued.' });
   } catch (e) {
      res.status(500).json({ error: 'Failed to trigger webhook' });
   }
});

router.post('/export', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const { entity, format } = req.body;
      
      // Simulate data generation
      let data = [];
      if (entity === 'users') {
         data = await db.query.users.findMany({ limit: 100 });
      } else if (entity === 'reports') {
         data = await db.query.reports.findMany({ limit: 100 });
      }
      
      res.json({
         success: true,
         format,
         entity,
         count: data.length,
         url: 'https://example.com/download/export-' + Date.now() + '.' + format
      });
   } catch (e) {
      res.status(500).json({ error: 'Failed to export data' });
   }
});

router.post('/import', verifyToken, requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const { entity, format, url } = req.body;
      // Simulate import job enqueueing
      res.json({
         success: true,
         message: `Import job for ${entity} queued from ${url}`
      });
   } catch(e) {
      res.status(500).json({ error: 'Failed to queue import' });
   }
});

export default router;
