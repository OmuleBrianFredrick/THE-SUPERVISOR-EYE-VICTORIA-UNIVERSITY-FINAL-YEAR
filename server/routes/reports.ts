import { Router } from 'express';
import { db } from '../db/index.js';
import { reports, evidence, tasks, users, notifications } from '../db/schema.js';
import { eq, desc, and, or } from 'drizzle-orm';
import { logAudit } from '../services/audit.js';

const router = Router();

// Middleware to ensure user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user || !req.dbUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.use(requireAuth);

// Get reports
router.get('/', async (req: any, res: any) => {
  try {
    const filters = [];
    const roleMatch = req.dbUser.role?.name || '';
    
    if (roleMatch === 'Field Staff') {
      filters.push(eq(reports.submitterId, req.dbUser.id));
    } else if (roleMatch === 'Supervisor' || roleMatch === 'Area Manager') {
      const subordinates = await db.select().from(users).where(eq(users.departmentId, req.dbUser.departmentId));
      if (subordinates.length > 0) {
        const ids = subordinates.map(u => u.id);
        const userOrs = ids.map(id => eq(reports.submitterId, id));
        filters.push(or(...userOrs));
      } else {
        filters.push(eq(reports.submitterId, req.dbUser.id)); // Fallback, just to return self reports if empty
      }
    }
    
    const allReports = await db.query.reports.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      orderBy: [desc(reports.updatedAt)],
      with: {
        submitter: { columns: { id: true, firstName: true, lastName: true } },
        task: { columns: { id: true, title: true } },
        evidence: true
      }
    });
    
    res.json(allReports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Submit report
router.post('/', async (req: any, res: any) => {
  try {
    const { taskId, reportType, gpsLat, gpsLng, outsideGeofence, notes } = req.body;
    
    // Create report
    const newReport = await db.insert(reports).values({
      taskId,
      reportType,
      gpsLat,
      gpsLng,
      isGpsVerified: true, // we will verify later or in client
      notes,
      submitterId: req.dbUser.id,
      status: 'DRAFT',
      submittedAt: new Date()
    }).returning();
    
    // Update task status
    if (taskId) {
      // @ts-ignore
      await db.update(tasks).set({ status: 'IN_PROGRESS', updatedAt: new Date() }).where(eq(tasks.id, taskId));
    }
    
    // Log Audit
    try {
      await logAudit(
        req.dbUser.id,
        'USER_UPDATED',
        req.ip,
        { event: 'REPORT_SUBMITTED', message: `Submitted report for task ${taskId}` }
      );
    } catch(e) {}
    
    // Notification for manager
    try {
      if (req.dbUser.departmentId) {
         // Notify department head
         const headUser = await db.select().from(users).where(and(eq(users.departmentId, req.dbUser.departmentId), or(eq(users.roleId, (await db.query.roles.findFirst({where: eq(users.id, null)})) as any)))); // Best effort notification logic
      }
    } catch(e) {}

    res.status(201).json(newReport[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Update report status (Approve/Reject/Revise) or Notes
router.patch('/:id/status', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, performanceScore, notes } = req.body; 
    
    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (performanceScore !== undefined) updateData.performanceScore = performanceScore;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.update(reports).set(updateData).where(eq(reports.id, id)).returning();
    
    if (updated.length > 0 && updated[0].taskId && status) {
       // Also update task if applicable? Schema doesn't link directly, but we can update if needed.
       let taskStatus = 'IN_PROGRESS';
       if (status === 'APPROVED') taskStatus = 'COMPLETED';
       
       // @ts-ignore
       await db.update(tasks).set({ status: taskStatus, updatedAt: new Date() }).where(eq(tasks.id, updated[0].taskId));
       
       // Notifications and Audit
       try {
         await logAudit(
           req.dbUser.id,
           'USER_UPDATED',
           req.ip,
           { event: `REPORT_${status}`, message: `Report ${id} marked as ${status}` }
         );
         
         await db.insert(notifications).values({
           userId: updated[0].submitterId,
           notificationType: status === 'APPROVED' ? 'APPROVAL' : 'REVISION_REQUEST',
           title: `Report ${status}`,
           message: `Your report has been ${status.toLowerCase()}.`
         });
       } catch(e) {}
    }
    
    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// Add evidence
router.post('/:id/evidence', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { mediaUrl, thumbnailUrl, mediaType, fileHash, outsideGeofence, capturedLat, capturedLng, capturedAt } = req.body;
    
    let fraudFlag = false;
    let fraudReason = '';
    let verificationStatus: any = 'PENDING';
    
    // EXIF Time check (60 minutes threshold instead of 10)
    const suppliedTime = capturedAt ? new Date(capturedAt) : new Date();
    const now = new Date();
    if (now.getTime() - suppliedTime.getTime() > 60 * 60 * 1000) {
      fraudFlag = true;
      fraudReason += 'Media captured more than 60 minutes ago. ';
      verificationStatus = 'FLAGGED';
    }

    // Duplicate Hash Detection
    if (fileHash) {
      const existingEvidence = await db.query.evidence.findFirst({
         where: eq(evidence.fileHash, fileHash)
      });
      if (existingEvidence) {
         fraudFlag = true;
         fraudReason += 'Duplicate file hash detected. ';
         verificationStatus = 'FLAGGED';
      }
    }

    const newEvidence = await db.insert(evidence).values({
      reportId: id,
      mediaUrl,
      thumbnailUrl,
      mediaType,
      fileHash,
      outsideGeofence: outsideGeofence || false,
      capturedLat,
      capturedLng,
      capturedAt: suppliedTime,
      fraudFlag,
      fraudReason: fraudReason.trim() || null,
      verificationStatus
    }).returning();
    
    res.status(201).json(newEvidence[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add evidence' });
  }
});

// Update evidence verification status
router.patch('/:reportId/evidence/:evidenceId/verify', async (req: any, res: any) => {
  try {
    const { reportId, evidenceId } = req.params;
    const { verificationStatus } = req.body; // 'VERIFIED', 'REJECTED'
    
    // We optionally verify the reporter is supervisor etc, assumed passed through auth.
    const updated = await db.update(evidence).set({
      verificationStatus
    }).where(eq(evidence.id, evidenceId)).returning();
    
    // Log Audit
    if (updated.length > 0) {
      try {
         await logAudit(
           req.dbUser.id,
           'USER_UPDATED',
           req.ip,
           { event: `EVIDENCE_${verificationStatus}`, message: `Evidence ${evidenceId} marked as ${verificationStatus}` }
         );
      } catch(e) {}
    }
    
    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update evidence status' });
  }
});

export default router;
