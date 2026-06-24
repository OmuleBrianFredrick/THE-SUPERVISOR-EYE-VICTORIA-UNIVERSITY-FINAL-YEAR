import { Router } from 'express';
import { db } from '../db/index.js';
import { approvalChains, approvalSteps, reportApprovals, escalations, delegations, users, reports, evidence, tasks, auditLogs } from '../db/schema.js';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

// 1. Get Pending Approvals for current user (including delegated)
router.get('/pending', async (req: any, res: any) => {
  try {
    const activeDelegations = await db.query.delegations.findMany({
       where: and(
         eq(delegations.delegateeId, req.dbUser.id),
         eq(delegations.isActive, true)
       )
    });
    
    const validDelegatorIds = activeDelegations.map(d => d.delegatorId);
    
    // We can't easily query with SQL 'IN' on arrays using ORM simplistic eq unless we use `inArray`.
    // It's easier fetching all pending and filtering manually if not too many, or just use sql`approver_id IN (...)`
    const { inArray } = await import('drizzle-orm');
    
    const userIds = [req.dbUser.id, ...validDelegatorIds];
    
    const pending = await db.query.reportApprovals.findMany({
       where: and(
         eq(reportApprovals.status, 'PENDING'),
         inArray(reportApprovals.approverId, userIds)
       ),
       with: {
         report: {
           with: {
             submitter: true,
             task: true,
             evidence: true
           }
         }
       },
       orderBy: [desc(reportApprovals.assignedAt)]
    });
    
    res.json(pending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

// 2. Execute Approval/Rejection Decision
router.patch('/:id/decision', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body; // 'APPROVED', 'REJECTED'

    const updated = await db.update(reportApprovals).set({
      status: decision,
      comments,
      actedAt: new Date()
    }).where(eq(reportApprovals.id, id)).returning();
    
    if (updated.length > 0) {
       // Find if there is a next step in the chain
       const currentStep = updated[0];
       let nextStepOrder = 2; // Default if we infer 1
       if (currentStep.stepId) {
          const step = await db.query.approvalSteps.findFirst({ where: eq(approvalSteps.id, currentStep.stepId) });
          if (step) nextStepOrder = step.stepOrder + 1;
       }
       
       if (decision === 'REJECTED') {
          // Immediately reject report
          await db.update(reports).set({ status: 'REJECTED' }).where(eq(reports.id, currentStep.reportId));
       } else if (decision === 'APPROVED') {
          // Check for next steps
          if (currentStep.stepId) {
             const step = await db.query.approvalSteps.findFirst({ where: eq(approvalSteps.id, currentStep.stepId) });
             if (step) {
                const nextStep = await db.query.approvalSteps.findFirst({ 
                    where: and(
                       eq(approvalSteps.chainId, step.chainId),
                       eq(approvalSteps.stepOrder, nextStepOrder)
                    )
                });
                
                if (nextStep) {
                   // Assign to next step (need to find user for role if role-based, or specific user)
                   let nextApproverId = nextStep.userId;
                   if (!nextApproverId && nextStep.roleId) {
                      // find a user with this role
                      const usersWithRole = await db.query.users.findMany({ where: eq(users.roleId, nextStep.roleId) });
                      if (usersWithRole.length > 0) nextApproverId = usersWithRole[0].id;
                   }
                   if (nextApproverId) {
                      // Create new approval
                      await db.insert(reportApprovals).values({
                         reportId: currentStep.reportId,
                         stepId: nextStep.id,
                         approverId: nextApproverId,
                         deadline: new Date(Date.now() + nextStep.slaHours * 3600 * 1000)
                      });
                   }
                } else {
                   // End of chain -> Fully Approved
                   await db.update(reports).set({ status: 'APPROVED' }).where(eq(reports.id, currentStep.reportId));
                }
             }
          } else {
             // Single step
             await db.update(reports).set({ status: 'APPROVED' }).where(eq(reports.id, currentStep.reportId));
          }
       }
       
       res.json(updated[0]);
    } else {
       res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
     res.status(500).json({ error: 'Failed' });
  }
});

// 3. Get Escalations (Admin/Exec View)
router.get('/escalations', requireRole(['SUPER_ADMIN', 'EXECUTIVE']), async (req: any, res: any) => {
   try {
     const results = await db.query.escalations.findMany({
        with: {
           report: {
             with: { task: true, submitter: true }
           }
        },
        orderBy: [desc(escalations.createdAt)]
     });
     res.json(results);
   } catch (e) {
     res.status(500).json({ error: 'Failed' });
   }
});

// 4. Resolve Escalation
router.patch('/escalations/:id/resolve', requireRole(['SUPER_ADMIN', 'EXECUTIVE']), async (req: any, res: any) => {
   try {
      const { id } = req.params;
      const updated = await db.update(escalations).set({
         status: 'RESOLVED',
         resolvedAt: new Date()
      }).where(eq(escalations.id, id)).returning();
      res.json(updated[0]);
   } catch(e) {
      res.status(500).json({ error: 'Failed' });
   }
});

// 5. Audit Log fetching strictly for approvals
router.get('/audit', async (req: any, res: any) => {
    // For demo purposes, fetch recent decisions
    try {
        const decisions = await db.query.reportApprovals.findMany({
            where: sql`status IN ('APPROVED', 'REJECTED', 'ESCALATED')`,
            orderBy: [desc(reportApprovals.actedAt)],
            limit: 50,
            with: { report: true }
        });
        res.json(decisions);
    } catch(e) {
        res.status(500).json({ error: 'Failed' });
    }
});

export default router;
