import { Router } from 'express';
import { db } from '../db/index.js';
import { evidence, reports, tasks, users, departments } from '../db/schema.js';
import { eq, desc, and, or, sql, count } from 'drizzle-orm';
import { verifyToken } from '../middleware/auth.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';

const router = Router();
router.use(verifyToken);

// Evidence analytics
router.get('/analytics', async (req: any, res: any) => {
  try {
    const [stats] = await db.select({
      total: count(),
      verified: sql<number>`SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN verification_status = 'PENDING' THEN 1 ELSE 0 END)`,
      rejected: sql<number>`SUM(CASE WHEN verification_status IN ('REJECTED', 'FLAGGED') THEN 1 ELSE 0 END)`,
      estimatedStorageBytes: sql<number>`SUM(
        CASE 
          WHEN media_type = 'VIDEO' THEN 10 * 1024 * 1024
          WHEN media_type = 'DOCUMENT' THEN 500 * 1024
          ELSE 2 * 1024 * 1024
        END
      )`
    }).from(evidence);

    res.json({
      totalEvidence: Number(stats?.total || 0),
      verifiedEvidence: Number(stats?.verified || 0),
      pendingVerification: Number(stats?.pending || 0),
      rejectedEvidence: Number(stats?.rejected || 0),
      estimatedStorageBytes: Number(stats?.estimatedStorageBytes || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch evidence analytics' });
  }
});

// Evidence search / library
router.get('/', async (req: any, res: any) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const list = await db.query.evidence.findMany({
      with: { report: { with: { task: true, submitter: true } } },
      orderBy: [desc(evidence.capturedAt)],
      limit,
      offset
    });
    
    const [totalRows] = await db.select({ count: count() }).from(evidence);

    res.json(buildPaginatedResponse(list, Number(totalRows.count), page, limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

export default router;
