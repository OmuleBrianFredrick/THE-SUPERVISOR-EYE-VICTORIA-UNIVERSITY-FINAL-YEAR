import { Router } from 'express';
import { db } from '../db/index.js';
import { tasks, reports, departments, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Middleware to ensure user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user || !req.dbUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.use(requireAuth);

router.get('/executive-summary', async (req: any, res: any) => {
  try {
    const allUsers = await db.select().from(users);
    const allTasks = await db.select().from(tasks);
    const allReports = await db.select().from(reports);
    
    // Compute aggregations
    const activeTasks = allTasks.filter(t => t.status !== 'COMPLETED').length;
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
    const totalReports = allReports.length;
    const approvedReports = allReports.filter(r => r.status === 'APPROVED').length;
    
    let avgScore = 0;
    const scoredReports = allReports.filter(r => r.performanceScore);
    if (scoredReports.length > 0) {
      avgScore = scoredReports.reduce((acc, r) => acc + Number(r.performanceScore), 0) / scoredReports.length;
    }
    
    res.json({
      activeTasks,
      completedTasks,
      totalReports,
      approvedReports,
      averagePerformanceScore: avgScore,
      totalStaff: allUsers.filter(u => u.status === 'ACTIVE').length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch executive summary' });
  }
});

export default router;
