import { Router } from 'express';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import tasksRoutes from './tasks.js';
import reportsRoutes from './reports.js';
import analyticsRoutes from './analytics.js';
import governanceRoutes from './governance.js';
import approvalsRoutes from './approvals.js';
import intelligenceRoutes from './intelligence.js';
import { db } from '../db/index.js';
import { homepageContent } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/governance', governanceRoutes);
router.use('/approvals', approvalsRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/tasks', tasksRoutes);
router.use('/reports', reportsRoutes);
router.use('/analytics', analyticsRoutes);

// Public homepage info route
router.get('/public/homepage', async (req, res) => {
  try {
    const content = await db.select().from(homepageContent).where(eq(homepageContent.id, 'master')).limit(1);
    res.json(content[0] || {});
  } catch (err) {
    res.json({});
  }
});

export default router;