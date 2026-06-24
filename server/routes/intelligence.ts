import { Router } from 'express';
import { db } from '../db/index.js';
import { 
  aiInsights, executiveSummaries, orgHealthMetrics, 
  departmentIntelligence, userIntelligence, users, departments,
  aiInsightFeedback, auditLogs 
} from '../db/schema.js';
import { desc, eq, and, sql } from 'drizzle-orm';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);
// Restrict all intelligence data to Super Admins and Executives
router.use(requireRole(['SUPER_ADMIN', 'EXECUTIVE']));

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

router.post('/insights/:id/feedback', async (req: any, res: any) => {
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

// A simulation route to generate new insights (in reality, triggered by a cron job interacting with Gemini)
router.post('/simulate-generation', async (req: any, res: any) => {
   try {
     // Generate some dummy intelligence data to simulate AI generated insights
     
     // 1. Health Math
     await db.insert(orgHealthMetrics).values({
        healthScore: 82,
        complianceScore: 78,
        productivityScore: 88,
        efficiencyScore: 85,
        slaScore: 76
     });
     
     // 2. Add an insight
     await db.insert(aiInsights).values({
        type: 'RISK',
        severity: 'HIGH',
        title: 'Geofence Compliance Drop in Western Region',
        explanation: 'The predictive engine detected a 14% drop in spatial compliance over the last 72 hours, correlating with 3 new field staff onboardings. The variance pattern indicates a potential training deficiency rather than gps-spoofing.',
        confidence: 89,
        recommendedAction: 'Trigger mandatory E-Training Module 4 (Location Governance) for new Western region hires.',
        sourceData: { affectedRegion: 'Western', usersCount: 3 }
     });

     await db.insert(aiInsights).values({
        type: 'TREND',
        severity: 'MEDIUM',
        title: 'SLA Approval Velocity Increasing',
        explanation: 'Approval chain bottlenecks have decreased by 18%. The automated SLA auto-escalation policy implemented last week is successfully routing idle approvals to secondary managers.',
        confidence: 94,
        recommendedAction: 'Maintain current SLA thresholds. Consider tightening Stock Audit Variance SLA from 24h to 12h.',
        sourceData: { velocityImprovement: 0.18 }
     });
     
     // 3. Exec Summary
     await db.insert(executiveSummaries).values({
        period: 'WEEKLY',
        summaryText: 'Overall organizational health is stable at 82/100. Productivity remains high with a 92% task completion rate. The primary risk factor is field geofence compliance in the Western Region, resulting in 12 automated fraud flags. The SLA auto-escalation engine successfully bypassed 44 stalled approvals, improving organizational velocity by 18%.'
     });
     
     // 4. Departments Intelligence
     const depts = await db.query.departments.findMany();
     if (depts.length > 0) {
        await db.insert(departmentIntelligence).values({
           departmentId: depts[0].id as string,
           healthScore: 92,
           riskScore: 8,
           taskCompletionRate: 95,
           complianceRate: 98,
           slaPerformance: 94
        });
        if (depts.length > 1) {
           await db.insert(departmentIntelligence).values({
              departmentId: depts[1].id as string,
              healthScore: 68,
              riskScore: 32,
              taskCompletionRate: 75,
              complianceRate: 60,
              slaPerformance: 70
           });
        }
     }
     
     // 5. Staff Intelligence
     const staff = await db.query.users.findMany({ limit: 5 });
     for (const s of staff) {
       await db.insert(userIntelligence).values({
          userId: s.id,
          roleType: 'FIELD_STAFF',
          productivityScore: Math.floor(Math.random() * 40) + 60,
          qualityScore: Math.floor(Math.random() * 40) + 60,
          complianceScore: Math.floor(Math.random() * 40) + 60,
          flags: Math.floor(Math.random() * 3)
       });
     }
     
     res.json({ success: true });
   } catch (err) {
     console.error(err);
     res.status(500).json({ error: 'Failed' });
   }
});

export default router;
