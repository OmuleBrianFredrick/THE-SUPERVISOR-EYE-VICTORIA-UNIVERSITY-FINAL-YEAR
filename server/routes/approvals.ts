import { Router } from 'express';
import { db } from '../db/index.js';
import { approvalChains, approvalSteps, reportApprovals, escalations, delegations, users, reports, evidence, tasks, auditLogs, notifications } from '../db/schema.js';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate, approvalDecisionSchema, createChainSchema, createChainStepSchema, createDelegationSchema } from '../validations/index.js';

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
router.patch('/:id/decision', validate(approvalDecisionSchema), async (req: any, res: any) => {
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
router.get('/escalations', requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
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
router.patch('/escalations/:id/resolve', requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
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

// 5. Admin: Get all approval chains
router.get('/chains', requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), async (req: any, res: any) => {
   try {
      const chains = await db.query.approvalChains.findMany({
         with: {
            department: true
         },
         orderBy: [desc(approvalChains.createdAt)]
      });
      // fetch steps for each chain
      const chainsWithSteps = await Promise.all(chains.map(async (chain) => {
         const steps = await db.query.approvalSteps.findMany({
            where: eq(approvalSteps.chainId, chain.id),
            with: { role: true, user: true },
            orderBy: (approvalSteps, { asc }) => [asc(approvalSteps.stepOrder)]
         });
         return { ...chain, steps };
      }));
      res.json(chainsWithSteps);
   } catch(e) {
      res.status(500).json({ error: 'Failed' });
   }
});

// 6. Admin: Create approval chain
router.post('/chains', requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']), validate(createChainSchema), async (req: any, res: any) => {
   try {
      const { name, departmentId, taskType, steps } = req.body;
      const newChain = await db.insert(approvalChains).values({
         name,
         departmentId: departmentId || null,
         taskType: taskType || null
      }).returning();
      
      if (steps && steps.length > 0) {
         const stepsToInsert = steps.map((s: any, idx: number) => ({
            chainId: newChain[0].id,
            stepOrder: idx + 1,
            roleId: s.roleId || null,
            userId: s.userId || null,
            slaHours: s.slaHours || 24,
            slaAction: s.slaAction || 'ESCALATE'
         }));
         await db.insert(approvalSteps).values(stepsToInsert);
      }
      res.json(newChain[0]);
   } catch(e) {
      res.status(500).json({ error: 'Failed' });
   }
});

// 7. Get Delegations
router.get('/delegations', async (req: any, res: any) => {
   try {
      // If admin, show all, otherwise just for user
      const condition = ['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN'].includes(req.dbUser.role?.name || '') ? undefined : 
         sql`${delegations.delegatorId} = ${req.dbUser.id} OR ${delegations.delegateeId} = ${req.dbUser.id}`;
         
      const results = await db.query.delegations.findMany({
         where: condition,
         with: {
            delegator: true,
            delegatee: true
         },
         orderBy: [desc(delegations.createdAt)]
      });
      res.json(results);
   } catch(e) {
      res.status(500).json({ error: 'Failed' });
   }
});

// 8. Create Delegation
router.post('/delegations', validate(createDelegationSchema), async (req: any, res: any) => {
   try {
      const { delegateeId, startDate, endDate } = req.body;
      const delegatorId = ['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN'].includes(req.dbUser.role?.name || '') && req.body.delegatorId ? req.body.delegatorId : req.dbUser.id;
      
      const newDelegation = await db.insert(delegations).values({
         delegatorId,
         delegateeId,
         startDate: new Date(startDate),
         endDate: new Date(endDate),
         isActive: true
      }).returning();
      res.json(newDelegation[0]);
   } catch(e) {
      res.status(500).json({ error: 'Failed' });
   }
});

// 9. Audit Log fetching strictly for approvals
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

// 10. Background Job: SLA Checker
router.post('/cron/sla-check', async (req: any, res: any) => {
   try {
      const { enqueueJob } = await import('../services/queue.js');
      
      const job = await enqueueJob({
         queueName: 'sla',
         jobType: 'sla-evaluation',
         payload: {},
      });
      
      res.json({ success: true, jobId: job.id, message: 'SLA evaluation queued.' });
   } catch(e) {
      console.error('SLA Queue Error:', e);
      res.status(500).json({ error: 'Failed to queue SLA check' });
   }
});

export default router;
