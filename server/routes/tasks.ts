import { Router } from 'express';
import { db } from '../db/index.js';
import { tasks, taskTemplates, departments, users, notifications } from '../db/schema.js';
import { eq, desc, and, or, like, ilike } from 'drizzle-orm';
import { logAudit } from '../services/audit.js';
import { verifyToken } from '../middleware/auth.js';
import { validate, createTaskSchema, updateTaskStatusSchema, getTasksSchema } from '../validations/index.js';

const router = Router();

router.use(verifyToken);

// Get all tasks (with filters based on role and query parameters)
router.get('/', validate(getTasksSchema), async (req: any, res: any) => {
  try {
    const filters = [];
    const roleMatch = req.dbUser.role?.name || '';
    
    if (roleMatch === 'Field Staff') {
      filters.push(eq(tasks.assignedTo, req.dbUser.id));
    } else if (roleMatch === 'Supervisor' || roleMatch === 'Area Manager' || roleMatch === 'Manager') {
      // Show tasks assigned to people in manager's department
      const subordinates = await db.select().from(users).where(eq(users.departmentId, req.dbUser.departmentId));
      if (subordinates.length > 0) {
        const ids = subordinates.map(u => u.id);
        const userOrs = ids.map(id => eq(tasks.assignedTo, id));
        filters.push(or(...userOrs));
      } else {
        filters.push(eq(tasks.assignedTo, req.dbUser.id)); // Fallback
      }
    }
    
    // Parse query params for advanced search and filters
    const { priority, extendedStatus, category, search } = req.query;
    
    if (priority) {
      filters.push(eq(tasks.priority, priority as any));
    }
    if (extendedStatus) {
      filters.push(eq(tasks.extendedStatus, extendedStatus as string));
    }
    if (category) {
      filters.push(eq(tasks.category, category as string));
    }
    if (search) {
      filters.push(or(
        ilike(tasks.title, `%${search}%`),
        ilike(tasks.description, `%${search}%`)
      ));
    }
    
    // Admins / Executives see everything (unless other filters are specified)
    const allTasks = await db.query.tasks.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      orderBy: [desc(tasks.createdAt)],
      with: {
        assignee: {
          columns: { id: true, firstName: true, lastName: true }
        },
        creator: {
          columns: { id: true, firstName: true, lastName: true }
        }
      }
    });
    
    res.json(allTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', validate(createTaskSchema), async (req: any, res: any) => {
  try {
    const { 
      title, description, taskType, priority, escalationLevel, 
      targetLocationLat, targetLocationLng, dueDate, 
      assignedTo, category, extendedStatus
    } = req.body;
    
    const targetStatus = extendedStatus || 'Assigned';
    const initialTimeline = [
      {
        status: targetStatus,
        timestamp: new Date().toISOString(),
        actorName: `${req.dbUser.firstName} ${req.dbUser.lastName}`,
        notes: `Task created and status set to ${targetStatus}`
      }
    ];

    const newTask = await db.insert(tasks).values({
      title,
      description,
      taskType,
      priority: priority || 'MEDIUM',
      escalationLevel: escalationLevel || 'Level 0',
      targetLocationLat,
      targetLocationLng,
      dueDate: new Date(dueDate),
      assignedTo,
      createdBy: req.dbUser.id,
      status: ['Approved', 'Completed', 'Archived'].includes(targetStatus) ? 'COMPLETED' : 
              ['In Progress', 'Awaiting Review', 'Revision Requested'].includes(targetStatus) ? 'IN_PROGRESS' : 'PENDING',
      extendedStatus: targetStatus,
      category: category || 'General',
      comments: [],
      timeline: initialTimeline
    }).returning();
    
    // Create Audit Log
    try {
      await logAudit(
        req.dbUser.id,
        'USER_UPDATED',
        req.ip,
        { event: 'TASK_CREATED', message: `Created task: ${title}` }
      );
    } catch(e) {}
    
    // Create Notification
    try {
      if (assignedTo) {
        const { enqueueJob } = await import('../services/queue.js');
        await enqueueJob({
           queueName: 'notifications',
           jobType: 'dispatch-notification',
           payload: {
             userId: assignedTo,
             notificationType: 'TASK_ASSIGNMENT',
             title: 'New Task Assigned',
             message: `You have been assigned a new task: ${title}`
           }
        });
      }
    } catch(e) {}
    
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH task status transition, comments, and timeline logs
router.patch('/:id/status', validate(updateTaskStatusSchema), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { extendedStatus, comment, timelineNote, priority, category } = req.body;
    
    // Retrieve task first
    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
      with: {
        assignee: { columns: { id: true, firstName: true, lastName: true } }
      }
    });
    
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const roleMatch = req.dbUser.role?.name || '';
    const isFieldStaff = roleMatch === 'Field Staff';
    
    const updates: any = {};
    const timeline = Array.isArray(existingTask.timeline) ? [...existingTask.timeline] : [];
    const comments = Array.isArray(existingTask.comments) ? [...existingTask.comments] : [];
    
    if (priority) {
      updates.priority = priority;
    }
    if (category) {
      updates.category = category;
    }
    
    if (extendedStatus) {
      const current = existingTask.extendedStatus;
      let isValidTransition = true;
      
      if (isFieldStaff) {
        // Field staff permitted actions
        if (extendedStatus === 'Accepted' && current !== 'Assigned') isValidTransition = false;
        else if (extendedStatus === 'In Progress' && current !== 'Accepted' && current !== 'Revision Requested') isValidTransition = false;
        else if (extendedStatus === 'Awaiting Review' && current !== 'In Progress') isValidTransition = false;
        else if (!['Accepted', 'In Progress', 'Awaiting Review'].includes(extendedStatus)) {
          isValidTransition = false;
        }
      } else {
        // Supervisors, Admins, Executives permitted actions
        if (extendedStatus === 'Assigned' && current !== 'Draft') isValidTransition = false;
        else if (extendedStatus === 'Approved' && current !== 'Awaiting Review') isValidTransition = false;
        else if (extendedStatus === 'Revision Requested' && current !== 'Awaiting Review') isValidTransition = false;
        else if (extendedStatus === 'Completed' && current !== 'Approved') isValidTransition = false;
        else if (extendedStatus === 'Archived' && !['Completed', 'Approved', 'Archived', 'Revision Requested'].includes(current)) isValidTransition = false;
      }
      
      if (!isValidTransition) {
        return res.status(400).json({ 
          error: `Invalid status transition from ${current} to ${extendedStatus} for role: ${roleMatch}` 
        });
      }
      
      updates.extendedStatus = extendedStatus;
      
      // Update legacy state for backward compatibility
      if (['Draft', 'Assigned', 'Accepted'].includes(extendedStatus)) {
        updates.status = 'PENDING';
      } else if (['In Progress', 'Awaiting Review', 'Revision Requested'].includes(extendedStatus)) {
        updates.status = 'IN_PROGRESS';
      } else if (['Approved', 'Completed', 'Archived'].includes(extendedStatus)) {
        updates.status = 'COMPLETED';
      }
      
      // Add timeline entry
      timeline.push({
        status: extendedStatus,
        timestamp: new Date().toISOString(),
        actorName: `${req.dbUser.firstName} ${req.dbUser.lastName}`,
        notes: timelineNote || `Task transitioned to ${extendedStatus}`
      });
      updates.timeline = timeline;
      
      // Dispatch notifications on transitions
      try {
        let recipientId = existingTask.assignedTo;
        let notifType: "TASK_ASSIGNMENT" | "REPORT_SUBMISSION" | "APPROVAL" | "REVISION_REQUEST" | "REMINDER" | "EXECUTIVE_ALERT" = 'TASK_ASSIGNMENT';
        let notifTitle = 'Task Notification';
        let notifMsg = `Task "${existingTask.title}" status changed to ${extendedStatus}.`;
        
        if (extendedStatus === 'Awaiting Review') {
          recipientId = existingTask.createdBy;
          notifType = 'REPORT_SUBMISSION';
          notifTitle = 'Task Completed: Awaiting Review';
          notifMsg = `Task "${existingTask.title}" has been completed by ${req.dbUser.firstName} ${req.dbUser.lastName} and is awaiting review.`;
        } else if (extendedStatus === 'Revision Requested') {
          recipientId = existingTask.assignedTo;
          notifType = 'REVISION_REQUEST';
          notifTitle = 'Revision Required on Task';
          notifMsg = `Your task "${existingTask.title}" requires revisions: ${timelineNote || 'Please update and resubmit.'}`;
        } else if (extendedStatus === 'Approved') {
          recipientId = existingTask.assignedTo;
          notifType = 'APPROVAL';
          notifTitle = 'Task Submissions Approved';
          notifMsg = `Your task submission for "${existingTask.title}" has been approved!`;
        }
        
        const { enqueueJob } = await import('../services/queue.js');
        await enqueueJob({
           queueName: 'notifications',
           jobType: 'dispatch-notification',
           payload: {
             userId: recipientId,
             notificationType: notifType,
             title: notifTitle,
             message: notifMsg
           }
        });
      } catch (ne) {
        console.error('Failed to dispatch transition notification', ne);
      }
    }
    
    if (comment) {
      comments.push({
        id: Math.random().toString(36).substring(2, 11),
        text: comment,
        timestamp: new Date().toISOString(),
        authorName: `${req.dbUser.firstName} ${req.dbUser.lastName}`,
        authorId: req.dbUser.id
      });
      updates.comments = comments;
    }
    
    const updated = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    
    // Log Audit log
    try {
      await logAudit(
        req.dbUser.id,
        'USER_UPDATED',
        req.ip,
        { 
          event: 'TASK_TRANSITIONED', 
          message: `Task ${id} transitioned to ${extendedStatus || existingTask.extendedStatus}. Comment added: ${comment ? 'yes' : 'no'}` 
        }
      );
    } catch(e) {}
    
    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to transition task' });
  }
});

// Get task templates
router.get('/templates', async (req: any, res: any) => {
  try {
    const templates = await db.select().from(taskTemplates).orderBy(desc(taskTemplates.createdAt));
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch task templates' });
  }
});

// Create task template
router.post('/templates', async (req: any, res: any) => {
  try {
    const { title, description, taskType, priority, escalationLevel } = req.body;
    
    const newTemplate = await db.insert(taskTemplates).values({
      title,
      description,
      taskType,
      priority: priority || 'MEDIUM',
      escalationLevel: escalationLevel || 'Level 0',
      createdBy: req.dbUser.id
    }).returning();
    
    res.status(201).json(newTemplate[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task template' });
  }
});

// Get subordinates
router.get('/subordinates', async (req: any, res: any) => {
  try {
    const list = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      jobTitle: users.jobTitle
    })
    .from(users)
    .where(eq(users.departmentId, req.dbUser.departmentId));
    
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subordinates' });
  }
});

export default router;
