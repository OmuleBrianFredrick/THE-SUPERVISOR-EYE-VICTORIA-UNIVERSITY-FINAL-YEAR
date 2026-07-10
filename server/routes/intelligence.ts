import { Router } from 'express';
import { db } from '../db/index.js';
import { 
  aiInsights, executiveSummaries, orgHealthMetrics, 
  departmentIntelligence, userIntelligence, users, departments,
  aiInsightFeedback, auditLogs, tasks, reports
} from '../db/schema.js';
import { desc, eq, and, sql } from 'drizzle-orm';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate, simulateGenerationSchema, feedbackSchema } from '../validations/index.js';

const router = Router();

router.use(verifyToken);
// Restrict all intelligence data to Super Admins and Executives
router.use(requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']));

router.get('/insights', async (req: any, res: any) => {
  try {
    const data = await db.query.aiInsights.findMany({
      orderBy: [desc(aiInsights.createdAt)],
      limit: 50,
      with: {
        feedback: {
          with: { executive: true },
          orderBy: [desc(aiInsightFeedback.createdAt)]
        }
      }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

router.post('/insights/:id/feedback', validate(feedbackSchema), async (req: any, res: any) => {
  try {
    const { status, comments, actionTaken } = req.body;
    const insightId = req.params.id;
    const executiveId = req.user.id;

    // Check if feedback already exists for this executive and insight
    const existing = await db.query.aiInsightFeedback.findFirst({
      where: and(eq(aiInsightFeedback.insightId, insightId), eq(aiInsightFeedback.executiveId, executiveId))
    });

    if (existing) {
      await db.update(aiInsightFeedback)
        .set({ status, comments, actionTaken, updatedAt: new Date() })
        .where(eq(aiInsightFeedback.id, existing.id));
    } else {
      await db.insert(aiInsightFeedback)
        .values({ insightId, executiveId, status, comments, actionTaken });
    }

    // Update the main insight to reflect the latest status
    await db.update(aiInsights)
      .set({ feedbackStatus: status })
      .where(eq(aiInsights.id, insightId));

    await db.insert(auditLogs).values({
      userId: executiveId,
      action: 'AI_INSIGHT_FEEDBACK_UPDATED',
      ipAddress: req.ip,
      metadata: { insightId, status, actionTaken }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

router.get('/insights/feedback-stats', async (req: any, res: any) => {
  try {
    const totalInsightsResult = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(aiInsights);
    const feedbackStats = await db.select({
      status: aiInsightFeedback.status,
      count: sql<number>`cast(count(*) as int)`
    }).from(aiInsightFeedback).groupBy(aiInsightFeedback.status);

    const result = {
      totalInsights: totalInsightsResult[0].count,
      useful: 0,
      notUseful: 0,
      investigating: 0,
      dismissed: 0,
      averageConfidence: 89, // mocked calculation for demo
      averageRating: 4.2 // mocked
    };

    feedbackStats.forEach(stat => {
      if (stat.status === 'USEFUL') result.useful = stat.count;
      if (stat.status === 'NOT_USEFUL') result.notUseful = stat.count;
      if (stat.status === 'INVESTIGATING') result.investigating = stat.count;
      if (stat.status === 'DISMISSED') result.dismissed = stat.count;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feedback stats' });
  }
});

router.get('/summaries', async (req: any, res: any) => {
  try {
    const data = await db.query.executiveSummaries.findMany({
      orderBy: [desc(executiveSummaries.createdAt)],
      limit: 10
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

router.get('/health', async (req: any, res: any) => {
  try {
    const data = await db.query.orgHealthMetrics.findFirst({
      orderBy: [desc(orgHealthMetrics.calculatedAt)]
    });
    res.json(data || { healthScore: 0, complianceScore: 0, productivityScore: 0, efficiencyScore: 0, slaScore: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/departments', async (req: any, res: any) => {
  try {
    const data = await db.query.departmentIntelligence.findMany({
      orderBy: [desc(departmentIntelligence.calculatedAt)],
      limit: 20,
      with: {
        department: true
      }
    });
    
    // Group by unique departments (in a real app, only fetch latest per dept)
    const uniqueMap = new Map();
    for (const d of data) {
       if (!uniqueMap.has(d.departmentId)) {
          uniqueMap.set(d.departmentId, d);
       }
    }
    res.json(Array.from(uniqueMap.values()));
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/staff', async (req: any, res: any) => {
   try {
     const data = await db.query.userIntelligence.findMany({
       with: {
         user: true
       },
       orderBy: [desc(userIntelligence.calculatedAt)],
       limit: 100
     });
     
     const uniqueMap = new Map();
     for (const d of data) {
        if (!uniqueMap.has(d.userId)) {
           uniqueMap.set(d.userId, d);
        }
     }
     res.json(Array.from(uniqueMap.values()));
   } catch(err) {
     res.status(500).json({ error: 'Failed' });
   }
});

// Generate intelligence insights using Gemini (Asynchronous via Queue)
router.post('/simulate-generation', validate(simulateGenerationSchema), async (req: any, res: any) => {
   try {
     const { enqueueJob } = await import('../services/queue.js');
     
     const job = await enqueueJob({
       queueName: 'ai',
       jobType: 'simulate-generation',
       payload: req.body,
     });
     
     res.json({ success: true, jobId: job.id, message: 'Intelligence generation queued.' });
   } catch (err) {
     console.error("Queue Job Error:", err);
     res.status(500).json({ error: 'Failed to queue intelligence generation' });
   }
});

export default router;
