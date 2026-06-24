import { Router } from 'express';
import { db } from '../db/index.js';
import { tasks, taskTemplates, departments, users, notifications } from '../db/schema.js';
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

// Get all tasks (with filters based on role)
router.get('/', async (req: any, res: any) => {
  try {
    const filters = [];
    const roleMatch = req.dbUser.role?.name || '';
    
    if (roleMatch === 'Field Staff') {
      filters.push(eq(tasks.assignedTo, req.dbUser.id));
    } else if (roleMatch === 'Supervisor' || roleMatch === 'Area Manager') {
      // no department on tasks table, just show tasks assigned to people in manager's department
      // Let's retrieve subordinates instead
      const subordinates = await db.select().from(users).where(eq(users.departmentId, req.dbUser.departmentId));
      if (subordinates.length > 0) {
        const ids = subordinates.map(u => u.id);
        const userOrs = ids.map(id => eq(tasks.assignedTo, id));
        filters.push(or(...userOrs));
      } else {
        filters.push(eq(tasks.assignedTo, req.dbUser.id)); // Fallback, just to return self tasks if empty
      }
    }
    
    // Admins / Executives see everything
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
router.post('/', async (req: any, res: any) => {
  try {
    const { 
      title, description, taskType, priority, escalationLevel, 
      targetLocationLat, targetLocationLng, dueDate, 
      assignedTo 
    } = req.body;
    
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
      status: 'PENDING'
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
        await db.insert(notifications).values({
           userId: assignedTo,
           notificationType: 'TASK_ASSIGNMENT',
           title: 'New Task Assigned',
           message: `You have been assigned a new task: ${title}`
        });
      }
    } catch(e) {}
    
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
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

export default router;
