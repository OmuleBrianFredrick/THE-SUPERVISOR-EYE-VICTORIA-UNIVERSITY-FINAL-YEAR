import { Router } from 'express';
import { db } from '../db/index.js';
import { tasks, reports, departments, users, executiveSummaries } from '../db/schema.js';
import { eq, desc, sql, count, avg } from 'drizzle-orm';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

router.get('/executive-summary', async (req: any, res: any) => {
  try {
    const [tasksStats] = await db.select({
      activeTasks: sql<number>`SUM(CASE WHEN ${tasks.status} != 'COMPLETED' THEN 1 ELSE 0 END)`,
      completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'COMPLETED' THEN 1 ELSE 0 END)`,
    }).from(tasks);

    const [reportsStats] = await db.select({
      totalReports: count(),
      approvedReports: sql<number>`SUM(CASE WHEN ${reports.status} = 'APPROVED' THEN 1 ELSE 0 END)`,
      averagePerformanceScore: avg(reports.performanceScore),
    }).from(reports);
    
    const [userStats] = await db.select({
      totalStaff: sql<number>`SUM(CASE WHEN ${users.status} = 'ACTIVE' THEN 1 ELSE 0 END)`,
    }).from(users);

    const latestSummary = await db.query.executiveSummaries.findFirst({
      orderBy: [desc(executiveSummaries.createdAt)]
    });

    res.json({
      activeTasks: Number(tasksStats?.activeTasks || 0),
      completedTasks: Number(tasksStats?.completedTasks || 0),
      totalReports: Number(reportsStats?.totalReports || 0),
      approvedReports: Number(reportsStats?.approvedReports || 0),
      averagePerformanceScore: Number(reportsStats?.averagePerformanceScore || 0),
      totalStaff: Number(userStats?.totalStaff || 0),
      executiveSummaryText: latestSummary?.summaryText || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch executive summary' });
  }
});

export default router;
