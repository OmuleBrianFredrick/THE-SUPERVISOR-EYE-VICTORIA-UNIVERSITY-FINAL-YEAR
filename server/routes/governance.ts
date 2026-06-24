import { Router } from 'express';
import { db } from '../db/index.js';
import { reports, evidence, tasks, users, auditLogs, departments } from '../db/schema.js';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);
router.use(requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director']));

// Storage Analytics
router.get('/storage-analytics', async (req: any, res: any) => {
  try {
    const evidenceList = await db.select().from(evidence);
    
    let totalPhotos = 0;
    let totalVideos = 0;
    let totalDocuments = 0;
    let totalStorageConsumptioBytes = 0; // Simulated since we didn't store bytes size

    evidenceList.forEach(e => {
       if (e.mediaType === 'PHOTO') { totalPhotos++; totalStorageConsumptioBytes += 2.5 * 1024 * 1024; }
       if (e.mediaType === 'VIDEO') { totalVideos++; totalStorageConsumptioBytes += 45 * 1024 * 1024; }
       if (e.mediaType === 'DOCUMENT') { totalDocuments++; totalStorageConsumptioBytes += 1.2 * 1024 * 1024; }
    });

    res.json({
       totalFiles: evidenceList.length,
       totalPhotos,
       totalVideos,
       totalDocuments,
       totalStorageGB: (totalStorageConsumptioBytes / (1024 * 1024 * 1024)).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storage analytics' });
  }
});

// Compliance & Geofence metrics
router.get('/compliance', async (req: any, res: any) => {
  try {
    const allEvidence = await db.select().from(evidence);
    
    let verified = 0;
    let flagged = 0;
    let rejected = 0;
    let geofenceViolations = 0;
    let fraudAlerts = 0;
    
    allEvidence.forEach(e => {
       if (e.verificationStatus === 'VERIFIED') verified++;
       if (e.verificationStatus === 'FLAGGED') flagged++;
       if (e.verificationStatus === 'REJECTED') rejected++;
       if (e.outsideGeofence) geofenceViolations++;
       if (e.fraudFlag) fraudAlerts++;
    });

    res.json({
       totalEvidence: allEvidence.length,
       verified,
       flagged,
       rejected,
       geofenceViolations,
       fraudAlerts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Media Governance (All Evidence list)
router.get('/media', async (req: any, res: any) => {
  try {
    // In production, add pagination
    const allEvidence = await db.query.evidence.findMany({
       with: {
         report: {
           with: { submitter: { columns: { firstName: true, lastName: true } } }
         }
       },
       orderBy: [desc(evidence.capturedAt)],
       limit: 100
    });
    
    res.json(allEvidence);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Audit Logs
router.get('/audit', async (req: any, res: any) => {
  try {
    const logs = await db.query.auditLogs.findMany({
       with: {
         user: { columns: { firstName: true, lastName: true, email: true } }
       },
       orderBy: [desc(auditLogs.timestamp)],
       limit: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
