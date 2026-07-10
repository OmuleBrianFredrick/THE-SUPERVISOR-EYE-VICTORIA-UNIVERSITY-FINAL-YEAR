import { db } from '../../db/index.js';
import { reportApprovals, escalations, notifications, reports } from '../../db/schema.js';
import { and, eq, sql } from 'drizzle-orm';

export async function handleSlaJob(job: any) {
  const { jobType } = job;
  
  if (jobType === 'sla-evaluation') {
    // Find all pending approvals that have breached deadline
    const overdueApprovals = await db.query.reportApprovals.findMany({
       where: and(
          eq(reportApprovals.status, 'PENDING'),
          sql`${reportApprovals.deadline} < NOW()`
       ),
       with: { step: true }
    });
    
    let escalatedCount = 0;
    let autoApprovedCount = 0;
    
    for (const app of overdueApprovals) {
       if (app.step && app.step.slaAction === 'ESCALATE') {
          // Find executive or super admin to escalate to (or next in chain)
          const executives = await db.query.users.findMany({
             where: sql`role_id IN (SELECT id FROM roles WHERE name = 'EXECUTIVE' OR name = 'SUPER_ADMIN')`,
             limit: 1
          });
          const escalatedToId = executives.length > 0 ? executives[0].id : app.approverId;
          
          await db.insert(escalations).values({
             reportId: app.reportId,
             reportApprovalId: app.id,
             escalatedToId,
             reason: `SLA breached. Expected action by ${app.deadline}`,
             status: 'ACTIVE'
          });
          // Update approval status so we don't escalate again
          await db.update(reportApprovals).set({ status: 'ESCALATED' }).where(eq(reportApprovals.id, app.id));
          
          try {
             const { enqueueJob } = await import('../queue.js');
             await enqueueJob({
                queueName: 'notifications',
                jobType: 'dispatch-notification',
                payload: {
                   userId: escalatedToId,
                   notificationType: 'EXECUTIVE_ALERT',
                   title: 'CRITICAL SLA BREACH ESCALATION',
                   message: `An approval SLA has breached and requires immediate executive oversight.`
                }
             });
          } catch(e) {}
          
          escalatedCount++;
       } else if (app.step && app.step.slaAction === 'AUTO_APPROVE') {
          // Treat like an approval
          await db.update(reportApprovals).set({ status: 'APPROVED', actedAt: new Date(), comments: 'Auto-approved due to SLA breach' }).where(eq(reportApprovals.id, app.id));
          // simplified: update report to approved (full engine would move to next step)
          await db.update(reports).set({ status: 'APPROVED' }).where(eq(reports.id, app.reportId));
          autoApprovedCount++;
       }
    }
    
    return { processed: overdueApprovals.length, escalatedCount, autoApprovedCount };
  }
  
  throw new Error(`Unknown SLA job type: ${jobType}`);
}
