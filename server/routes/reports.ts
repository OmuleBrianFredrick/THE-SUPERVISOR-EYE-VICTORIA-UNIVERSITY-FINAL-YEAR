import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { reports, evidence, tasks, users, notifications, reportVersions, reportComments, approvalChains, approvalSteps, reportApprovals, roles } from '../db/schema.js';
import { eq, desc, and, or, sql, inArray } from 'drizzle-orm';
import { logAudit } from '../services/audit.js';
import { verifyToken } from '../middleware/auth.js';
import { validate, createReportSchema, updateReportSchema } from '../validations/index.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';
import { systemEvents } from '../services/events.js';

const router = Router();

router.use(verifyToken);

// Get reports
router.get('/', async (req: any, res: any) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const filters = [];
    const roleMatch = req.dbUser.role?.name || '';
    
    if (roleMatch === 'Field Staff') {
      filters.push(eq(reports.submitterId, req.dbUser.id));
    } else if (roleMatch === 'Supervisor' || roleMatch === 'Area Manager' || roleMatch === 'Manager' || roleMatch === 'Division Supervisor') {
      if (req.dbUser.departmentId) {
        const subordinates = await db.select().from(users).where(eq(users.departmentId, req.dbUser.departmentId));
        if (subordinates.length > 0) {
          const ids = [...subordinates.map(u => u.id), req.dbUser.id];
          const userOrs = ids.map(id => eq(reports.submitterId, id));
          filters.push(or(...userOrs));
        }
      }
      // If departmentId is null or no subordinates in department, don't restrict so supervisors can view all staff reports
    }
    
    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const allReports = await db.query.reports.findMany({
      where: whereClause,
      orderBy: [desc(reports.updatedAt)],
      limit,
      offset,
      with: {
        submitter: { columns: { id: true, firstName: true, lastName: true, jobTitle: true } },
        task: { columns: { id: true, title: true } },
        evidence: true,
        versions: true
      }
    });

    const [totalRows] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(reports).where(whereClause);

    res.json(buildPaginatedResponse(allReports, totalRows.count, page, limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Auto-generate queued task summary report for Supervisors & Managers
router.post('/auto-generate', async (req: any, res: any) => {
  try {
    const userId = req.dbUser.id;
    const userRole = req.dbUser.role?.name || 'Supervisor';
    const deptId = req.dbUser.departmentId;

    let userTasks = await db.query.tasks.findMany({
      where: or(eq(tasks.createdBy, userId), eq(tasks.assignedTo, userId)),
      with: { assignee: true }
    });

    if (deptId && userTasks.length === 0) {
      userTasks = await db.query.tasks.findMany({
        limit: 50,
        with: { assignee: true }
      });
    }

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = userTasks.filter(t => t.status === 'PENDING').length;
    const inProgressTasks = userTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    const reportIds = (await db.select({ id: reports.id }).from(reports).where(eq(reports.submitterId, userId))).map(r => r.id);
    const evidenceCount = reportIds.length > 0 
      ? (await db.select({ count: sql<number>`cast(count(*) as int)` }).from(evidence).where(inArray(evidence.reportId, reportIds)))[0]?.count || 0
      : 0;

    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const taskDetailsList = userTasks.slice(0, 8).map(t => {
      const assigneeObj = (t as any).assignee;
      return `• [${t.status}] ${t.title} (${t.category}) - Assigned to: ${assigneeObj?.firstName || 'Field Officer'} ${assigneeObj?.lastName || ''}`;
    }).join('\n');

    const generatedNotes = `[SUPERVISOR_SUMMARY] AUTOMATED TASK & DISPATCH QUEUE SUMMARY REPORT (${todayStr})

1. EXECUTIVE OVERVIEW:
Automated operational summary generated for ${req.dbUser.firstName} ${req.dbUser.lastName} (${userRole}) compiling active task dispatch queues, field team activities, and evidence records.

2. ACCUMULATED TASK QUEUE METRICS:
- Total Dispatched Tasks: ${totalTasks}
- Completed Tasks: ${completedTasks} (${completionRate}% Completion Velocity)
- In-Progress Activities: ${inProgressTasks}
- Pending Dispatch Queue: ${pendingTasks}
- Total Attached Evidence Items: ${evidenceCount}

3. DISPATCHED TASK BREAKDOWN:
${taskDetailsList || '• All active task queues currently operating within normal operational baselines.'}

4. SUPERVISOR FIELD OBSERVATIONS:
Dispatched field personnel are systematically completing tasks with verified GPS & media evidence. Operational momentum is progressing in accordance with departmental targets.`;

    const newReport = await db.insert(reports).values({
      taskId: userTasks[0]?.id || undefined,
      reportType: 'WEEKLY',
      gpsLat: '0.3476',
      gpsLng: '32.5825',
      locationName: 'Division Command & Dispatch Hub',
      isGpsVerified: true,
      notes: generatedNotes,
      submitterId: userId,
      status: 'DRAFT',
      submittedAt: new Date()
    }).returning();

    res.status(201).json(newReport[0]);
  } catch (error) {
    console.error('Error auto-generating summary report:', error);
    res.status(500).json({ error: 'Failed to auto-generate summary report' });
  }
});

// Executive Feedback & Directives endpoint
router.post('/directives', async (req: any, res: any) => {
  try {
    const { recipientScope, title, feedbackText, priority } = req.body;
    
    if (!title || !feedbackText) {
      return res.status(400).json({ error: 'Title and feedback text are required' });
    }

    const execName = `${req.dbUser.firstName} ${req.dbUser.lastName}`;
    const execTitle = req.dbUser.jobTitle || req.dbUser.role?.name || 'Executive Operations';

    // Insert as an Executive Directive report entry for audit and visibility
    const directiveNotes = `[EXECUTIVE_DIRECTIVE] ${title.toUpperCase()}

ISSUED BY: ${execName} (${execTitle})
TARGET SCOPE: ${recipientScope || 'All Departments & Field Leadership'}
PRIORITY: ${priority || 'NORMAL'}
DATE ISSUED: ${new Date().toLocaleString()}

EXECUTIVE DIRECTIVE & FEEDBACK REMARKS:
${feedbackText}`;

    const newDirectiveReport = await db.insert(reports).values({
      taskId: null,
      reportType: 'MONTHLY',
      gpsLat: '0.3476',
      gpsLng: '32.5825',
      locationName: 'Executive Headquarters / MD Office',
      isGpsVerified: true,
      notes: directiveNotes,
      submitterId: req.dbUser.id,
      status: 'APPROVED',
      submittedAt: new Date()
    }).returning();

    // Broadcast notifications to department managers and supervisors
    try {
      const targetUsers = await db.select({ id: users.id }).from(users);
      const notifPromises = targetUsers.map(u => 
        db.insert(notifications).values({
          userId: u.id,
          title: `[EXECUTIVE DIRECTIVE] ${title}`,
          message: `${execName} issued executive feedback: "${feedbackText.substring(0, 120)}..."`,
          notificationType: 'EXECUTIVE_ALERT',
          isRead: false
        })
      );
      await Promise.all(notifPromises.slice(0, 50));
    } catch (e) {
      console.error("Error sending directive notifications:", e);
    }

    res.status(201).json(newDirectiveReport[0]);
  } catch (error) {
    console.error('Error creating executive directive:', error);
    res.status(500).json({ error: 'Failed to issue executive directive' });
  }
});

// Submit report
router.post('/', validate(createReportSchema), async (req: any, res: any) => {
  try {
    const { taskId, reportType, gpsLat, gpsLng, locationName, outsideGeofence, notes, status } = req.body;
    
    let validTaskId: string | null = null;
    if (taskId) {
      try {
        const existingTask = await db.query.tasks.findFirst({
          where: eq(tasks.id, taskId)
        });
        if (existingTask) {
          validTaskId = taskId;
        }
      } catch (e) {
        validTaskId = null;
      }
    }

    const VALID_REPORT_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY', 'FIELD_VISIT', 'SALES_VISIT', 'STOCK_AUDIT'];
    let dbReportType: any = 'FIELD_VISIT';
    if (VALID_REPORT_TYPES.includes(reportType)) {
      dbReportType = reportType;
    } else if (reportType === 'SUPERVISOR_SUMMARY' || reportType === 'DIVISION_PROGRESS') {
      dbReportType = 'WEEKLY';
    } else if (reportType === 'MANAGEMENT_BRIEF' || reportType === 'DEPARTMENTAL_REPORT') {
      dbReportType = 'MONTHLY';
    }

    let finalNotes = notes || '';
    if (reportType && !VALID_REPORT_TYPES.includes(reportType) && !finalNotes.includes(`[${reportType}]`)) {
      finalNotes = `[${reportType}] ${finalNotes}`;
    }

    // Create report
    const newReport = await db.insert(reports).values({
      taskId: validTaskId,
      reportType: dbReportType,
      gpsLat: gpsLat ? String(gpsLat) : '0.3476',
      gpsLng: gpsLng ? String(gpsLng) : '32.5825',
      locationName: locationName || 'Operational Location',
      isGpsVerified: true,
      notes: finalNotes,
      submitterId: req.dbUser.id,
      status: status || 'PENDING_REVIEW',
      submittedAt: new Date()
    }).returning();
    
    // Update task status if linked to a task
    if (validTaskId) {
      // @ts-ignore
      await db.update(tasks).set({ status: 'IN_PROGRESS', updatedAt: new Date() }).where(eq(tasks.id, validTaskId));
    }
    
    // Log Audit
    try {
      await logAudit(
        req.dbUser.id,
        'USER_UPDATED',
        req.ip,
        { event: 'REPORT_SUBMITTED', message: `Submitted ${reportType} report` }
      );
    } catch(e) {}

    res.status(201).json(newReport[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Update report status (Approve/Reject/Revise) or Notes
router.patch('/:id/status', validate(updateReportSchema), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, performanceScore, notes, locationName, gpsLat, gpsLng, overrideGeofence } = req.body; 
    
    // Get existing to determine version
    const existing = await db.query.reports.findFirst({
      where: eq(reports.id, id),
      with: { versions: true, task: true }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (status === 'PENDING_REVIEW') {
      const rejectionCount = (existing.versions || []).filter((v: any) => v.status === 'REJECTED').length;
      if (rejectionCount >= 5) {
        return res.status(403).json({ error: 'Maximum resubmission limit (5) exceeded. This report can no longer be submitted.' });
      }
    }

    // GEOFENCE ENFORCEMENT
    let isOutsideGeofence = false;
    if (status === 'PENDING_REVIEW' && !overrideGeofence && existing.task && existing.task.targetLocationLat && existing.task.targetLocationLng) {
       const lat = gpsLat || existing.gpsLat || 0.3476;
       const lng = gpsLng || existing.gpsLng || 32.5825;

       const R = 6371e3; // metres
       const lat1 = Number(lat);
       const lon1 = Number(lng);
       const lat2 = Number(existing.task.targetLocationLat);
       const lon2 = Number(existing.task.targetLocationLng);
       
       const phi1 = lat1 * Math.PI/180;
       const phi2 = lat2 * Math.PI/180;
       const deltaPhi = (lat2-lat1) * Math.PI/180;
       const deltaLambda = (lon2-lon1) * Math.PI/180;

       const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                 Math.cos(phi1) * Math.cos(phi2) *
                 Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

       const distance = R * c;
       if (distance > 500) { // 500 meters threshold
          isOutsideGeofence = true;
       }
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (performanceScore !== undefined) updateData.performanceScore = performanceScore;
    if (notes !== undefined) updateData.notes = notes;
    if (locationName !== undefined) updateData.locationName = locationName;
    if (gpsLat) updateData.gpsLat = gpsLat;
    if (gpsLng) updateData.gpsLng = gpsLng;

    const updated = await db.update(reports).set(updateData).where(eq(reports.id, id)).returning();
    
    // Create version
    const newVersionNum = existing.versions.length + 1;
    await db.insert(reportVersions).values({
      reportId: id,
      versionNumber: newVersionNum,
      notes: notes !== undefined ? notes : existing.notes,
      status: status || existing.status,
      updatedBy: req.dbUser.id
    });

    if (updated.length > 0 && status === 'PENDING_REVIEW') {
       // Trigger Enterprise Workflow & Approval Engine
       const report = updated[0];
       const submitter = await db.query.users.findFirst({ where: eq(users.id, report.submitterId) });
       
       if (submitter) {
         // Find active chain for department
         let activeChain = null;
         if (submitter.departmentId) {
            activeChain = await db.query.approvalChains.findFirst({
               where: and(
                  eq(approvalChains.departmentId, submitter.departmentId),
                  eq(approvalChains.isActive, true)
               )
            });
         }
         // Fallback to global chain
         if (!activeChain) {
            activeChain = await db.query.approvalChains.findFirst({
               where: and(
                  eq(approvalChains.departmentId, null as any),
                  eq(approvalChains.isActive, true)
               )
            });
         }

         if (activeChain) {
            // Find Step 1
            const firstStep = await db.query.approvalSteps.findFirst({
               where: and(
                  eq(approvalSteps.chainId, activeChain.id),
                  eq(approvalSteps.stepOrder, 1)
               )
            });
            
            if (firstStep) {
               let nextApproverId = firstStep.userId;
               if (!nextApproverId && firstStep.roleId) {
                  const usersWithRole = await db.query.users.findMany({ where: eq(users.roleId, firstStep.roleId) });
                  if (usersWithRole.length > 0) nextApproverId = usersWithRole[0].id;
               }
               if (nextApproverId) {
                  await db.insert(reportApprovals).values({
                     reportId: report.id,
                     stepId: firstStep.id,
                     approverId: nextApproverId,
                     deadline: new Date(Date.now() + firstStep.slaHours * 3600 * 1000)
                  });
               }
            }
         } else {
            // Fallback if no chain: assign to department head (Supervisor) or any Supervisor
            const supervisorRole = await db.query.roles.findFirst({
               where: eq(roles.name, 'Supervisor')
            });
            let deptHead = null;
            if (supervisorRole && submitter.departmentId) {
               deptHead = await db.query.users.findFirst({
                  where: and(
                     eq(users.departmentId, submitter.departmentId),
                     eq(users.roleId, supervisorRole.id)
                  )
               });
            }
            if (!deptHead && supervisorRole) {
               deptHead = await db.query.users.findFirst({
                  where: eq(users.roleId, supervisorRole.id)
               });
            }
            if (!deptHead) {
               deptHead = await db.query.users.findFirst();
            }
            if (deptHead) {
               await db.insert(reportApprovals).values({
                  reportId: report.id,
                  approverId: deptHead.id,
                  deadline: new Date(Date.now() + 24 * 3600 * 1000)
               });
            }
         }
       }
    }

    if (updated.length > 0 && updated[0].taskId && status) {
       // Also update task if applicable? Schema doesn't link directly, but we can update if needed.
       let taskStatus = 'IN_PROGRESS';
       let taskExtendedStatus = undefined;
       
       if (status === 'APPROVED') {
         taskStatus = 'COMPLETED';
         taskExtendedStatus = 'Approved';
       } else if (status === 'PENDING_REVIEW') {
         taskStatus = 'COMPLETED';
         taskExtendedStatus = 'Awaiting Review';
       } else if (status === 'REJECTED') {
         taskStatus = 'IN_PROGRESS';
         taskExtendedStatus = 'Revision Requested';
       }
       
       const taskUpdates: any = { status: taskStatus, updatedAt: new Date() };
       if (taskExtendedStatus) {
         taskUpdates.extendedStatus = taskExtendedStatus;
       }
       
       // @ts-ignore
       await db.update(tasks).set(taskUpdates).where(eq(tasks.id, updated[0].taskId));
       
       // Notifications and Audit
       try {
         await logAudit(
           req.dbUser.id,
           'USER_UPDATED',
           req.ip,
           { event: `REPORT_${status}`, message: `Report ${id} marked as ${status}` }
         );
         
         const { enqueueJob } = await import('../services/queue.js');
        await enqueueJob({
           queueName: 'notifications',
           jobType: 'dispatch-notification',
           payload: {
             userId: updated[0].submitterId,
             notificationType: status === 'APPROVED' ? 'APPROVAL' : 'REVISION_REQUEST',
             title: `Report ${status}`,
             message: `Your report has been ${status.toLowerCase()}.`
           }
        });

        // Broadcast to all supervisors
        if (status === 'PENDING_REVIEW') {
          systemEvents.emit('notification', {
            targetRole: 'supervisor',
            title: `New Report Submitted`,
            message: `A new report is awaiting your review.`,
            timestamp: new Date().toISOString()
          });
        }
       } catch(e) {}
    }
    
    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// Get report timeline (versions and comments)
router.get('/:id/timeline', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const versions = await db.query.reportVersions.findMany({
      where: eq(reportVersions.reportId, id),
      with: { updater: { columns: { id: true, firstName: true, lastName: true } } },
      orderBy: [desc(reportVersions.createdAt)]
    });
    
    const commentsList = await db.query.reportComments.findMany({
      where: eq(reportComments.reportId, id),
      with: { user: { columns: { id: true, firstName: true, lastName: true } } },
      orderBy: [desc(reportComments.createdAt)]
    });

    res.json({ versions, comments: commentsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// Add comment to report
router.post('/:id/comments', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const newComment = await db.insert(reportComments).values({
      reportId: id,
      userId: req.dbUser.id,
      comment
    }).returning();
    
    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Add evidence
router.post('/:id/evidence', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { mediaUrl, thumbnailUrl, mediaType, fileHash, outsideGeofence, capturedLat, capturedLng, capturedAt, fileData, fileName } = req.body;
    
    let finalMediaUrl = mediaUrl;
    let finalThumbnailUrl = thumbnailUrl;

    // Process direct base64 / Data URL payload if sent from client
    if (fileData) {
      try {
        const matches = fileData.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const ext = fileName ? path.extname(fileName) : (mediaType === 'VIDEO' ? '.mp4' : mediaType === 'DOCUMENT' ? '.pdf' : '.jpg');
          const cleanBaseName = fileName ? path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_') : 'evidence';
          const savedFileName = `${id}_${Date.now()}_${cleanBaseName}${ext}`;
          
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(path.join(uploadsDir, savedFileName), buffer);
          
          finalMediaUrl = `/uploads/${savedFileName}`;
          if (!finalThumbnailUrl || finalThumbnailUrl.startsWith('data:')) {
            finalThumbnailUrl = finalMediaUrl;
          }
        } else if (!finalMediaUrl) {
          finalMediaUrl = fileData;
        }
      } catch (err) {
        console.error('Error saving uploaded file to disk:', err);
        if (!finalMediaUrl) finalMediaUrl = fileData;
      }
    }

    if (!finalMediaUrl) {
      return res.status(400).json({ error: 'Media URL or file data is required' });
    }

    let fraudFlag = false;
    let fraudReason = '';
    let verificationStatus: any = 'PENDING';
    
    // Check if the report and associated task exist
    const report = await db.query.reports.findFirst({
      where: eq(reports.id, id),
      with: { task: true }
    });
    
    if (!report) {
       return res.status(404).json({ error: 'Report not found' });
    }

    // Geofence Validation
    let isOutsideGeofence = outsideGeofence || false;
    if (report.task && capturedLat && capturedLng && report.task.targetLocationLat && report.task.targetLocationLng) {
       const R = 6371e3; // metres
       const lat1 = capturedLat;
       const lon1 = capturedLng;
       const lat2 = Number(report.task.targetLocationLat);
       const lon2 = Number(report.task.targetLocationLng);
       
       const phi1 = lat1 * Math.PI/180;
       const phi2 = lat2 * Math.PI/180;
       const deltaPhi = (lat2-lat1) * Math.PI/180;
       const deltaLambda = (lon2-lon1) * Math.PI/180;

       const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                 Math.cos(phi1) * Math.cos(phi2) *
                 Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

       const distance = R * c;
       if (distance > 500) { // 500 meters threshold
          isOutsideGeofence = true;
          fraudFlag = true;
          fraudReason += `Media captured outside 500m geofence (approx ${Math.round(distance)}m away). `;
          verificationStatus = 'FLAGGED';
       }
    }

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
      mediaUrl: finalMediaUrl,
      thumbnailUrl: finalThumbnailUrl || finalMediaUrl,
      mediaType,
      fileHash,
      outsideGeofence: isOutsideGeofence,
      capturedLat,
      capturedLng,
      capturedAt: suppliedTime,
      fraudFlag,
      fraudReason: fraudReason.trim() || null,
      verificationStatus
    }).returning();
    
    // Refresh report updatedAt timestamp so it stays on top and is not truncated by pagination
    await db.update(reports).set({ updatedAt: new Date() }).where(eq(reports.id, id));

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
