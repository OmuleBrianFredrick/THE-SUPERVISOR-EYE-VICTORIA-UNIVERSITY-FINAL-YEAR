import { z, ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Express Middleware
export const validate = (schema: ZodObject<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error instanceof z.ZodError || (error && Array.isArray(error.issues))) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues || error.errors,
        });
      }
      return res.status(500).json({ error: 'Internal server error during validation' });
    }
  };
};

// Common Schemas
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

// Auth
export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    employeeNumber: z.string().optional(),
    department: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    managerId: z.string().uuid().optional(),
    jobTitle: z.string().optional(),
    organization: z.string().optional(),
  }),
});

export const loginSuccessSchema = z.object({
  body: z.object({
    loginMethod: z.enum(['GOOGLE', 'EMAIL', 'SSO']).optional(),
  }),
});

export const auditLogSchema = z.object({
  body: z.object({
    action: z.string().min(1),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

// Tasks
export const getTasksSchema = z.object({
  query: z.object({
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    extendedStatus: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().min(1, 'Description is required'),
    taskType: z.enum(['INSPECTION', 'MAINTENANCE', 'AUDIT', 'SURVEY', 'OTHER', 'STOCK_AUDIT', 'MERCHANDISING', 'GENERAL_VISIT']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    escalationLevel: z.string().optional(),
    targetLocationLat: z.number().optional(),
    targetLocationLng: z.number().optional(),
    targetLocationName: z.string().optional(),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }).or(z.date()),
    assignedTo: z.string().uuid().optional(),
    category: z.string().optional(),
    extendedStatus: z.string().optional(),
  }),
});

export const updateTaskDetailsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255).optional(),
    description: z.string().min(1, 'Description is required').optional(),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }).or(z.date()).optional(),
    targetLocationLat: z.number().nullable().optional(),
    targetLocationLng: z.number().nullable().optional(),
    targetLocationName: z.string().nullable().optional(),
    assignedTo: z.string().uuid().optional(),
    extendedStatus: z.string().optional(),
  }),
});

export const updateTaskStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    extendedStatus: z.string().optional(),
    comment: z.string().optional(),
    timelineNote: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    category: z.string().optional(),
  }),
});

// Reports
export const createReportSchema = z.object({
  body: z.object({
    taskId: z.string().uuid().optional(),
    reportType: z.enum(['FIELD_VISIT', 'INCIDENT', 'MAINTENANCE_LOG', 'COMPLIANCE_AUDIT', 'OTHER']),
    gpsLat: z.number().optional(),
    gpsLng: z.number().optional(),
    locationName: z.string().optional(),
    outsideGeofence: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

export const updateReportSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'SUBMITTED', 'REJECTED', 'APPROVED']).optional(),
    performanceScore: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    locationName: z.string().optional(),
  }),
});

// Approvals
export const approvalDecisionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    decision: z.enum(['APPROVED', 'REJECTED', 'ESCALATED', 'BYPASSED']),
    comments: z.string().optional(),
  }),
});

export const createChainSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    departmentId: z.string().uuid().optional(),
    taskType: z.string().optional(),
    steps: z.array(z.object({
      roleId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      slaHours: z.number().optional(),
      slaAction: z.enum(['NOTIFY', 'ESCALATE', 'AUTO_APPROVE', 'AUTO_REJECT']).optional(),
    })).optional(),
  }),
});

export const createChainStepSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    steps: z.array(z.object({
      stepOrder: z.number(),
      roleId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      slaHours: z.number().optional(),
      slaAction: z.enum(['NOTIFY', 'ESCALATE', 'AUTO_APPROVE', 'AUTO_REJECT']).optional(),
    })),
  }),
});

export const createDelegationSchema = z.object({
  body: z.object({
    delegatorId: z.string().uuid().optional(),
    delegateeId: z.string().uuid(),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    notes: z.string().optional(),
  }),
});

// Intelligence
export const simulateGenerationSchema = z.object({
  body: z.any().optional(),
});

export const feedbackSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'USEFUL', 'NOT_USEFUL', 'INVESTIGATING', 'DISMISSED']),
    comments: z.string().optional(),
    actionTaken: z.boolean().optional(),
  }),
});

// Admin
export const userApproveSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    roleId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    managerId: z.string().uuid().optional(),
  }),
});

export const userUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'REJECTED', 'SUSPENDED']).optional(),
    roleId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    managerId: z.string().uuid().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    jobTitle: z.string().optional(),
  }),
});

// Integration
export const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    scopes: z.array(z.string()).optional(),
  }),
});

export const createWebhookSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    endpointUrl: z.string().url(),
    events: z.array(z.string()),
  }),
});
