import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  jsonb,
  pgEnum,
  index,
  foreignKey,
  integer
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'REJECTED']);
export const taskTypeEnum = pgEnum('task_type', ['MERCHANDISING', 'STOCK_AUDIT', 'GENERAL_VISIT']);
export const taskStatusEnum = pgEnum('task_status', ['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const reportStatusEnum = pgEnum('report_status', ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']);
export const reportTypeEnum = pgEnum('report_type', ['DAILY', 'WEEKLY', 'MONTHLY', 'FIELD_VISIT', 'SALES_VISIT', 'STOCK_AUDIT']);
export const mediaTypeEnum = pgEnum('media_type', ['PHOTO', 'VIDEO', 'DOCUMENT', 'SIGNATURE']);
export const approvalDecisionEnum = pgEnum('approval_decision', ['APPROVED', 'REJECTED']);
export const systemNameEnum = pgEnum('system_name', ['ERP', 'PAYROLL']);
export const syncTypeEnum = pgEnum('sync_type', ['INBOUND', 'OUTBOUND']);
export const syncStatusEnum = pgEnum('sync_status', ['SUCCESS', 'FAILED', 'PENDING']);
export const notificationTypeEnum = pgEnum('notification_type', ['TASK_ASSIGNMENT', 'REPORT_SUBMISSION', 'APPROVAL', 'REVISION_REQUEST', 'REMINDER', 'EXECUTIVE_ALERT']);
export const priorityEnum = pgEnum('priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']);
export const verificationStatusEnum = pgEnum('verification_status', ['PENDING', 'VERIFIED', 'FLAGGED', 'REJECTED']);
export const approvalStatusEnum = pgEnum('approval_status', ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'BYPASSED']);
export const escalationStatusEnum = pgEnum('escalation_status', ['ACTIVE', 'RESOLVED', 'IGNORED']);
export const slaActionEnum = pgEnum('sla_action', ['NOTIFY', 'ESCALATE', 'AUTO_APPROVE', 'AUTO_REJECT']); 

// Tables
export const jobStatusEnum = pgEnum('job_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRIED']);

export const backgroundJobs = pgTable('background_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  queueName: varchar('queue_name', { length: 255 }).notNull(),
  jobType: varchar('job_type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: jobStatusEnum('status').default('PENDING').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  lockedAt: timestamp('locked_at'),
  lockedUntil: timestamp('locked_until'),
  errorReason: text('error_reason'),
  result: jsonb('result'),
  scheduledFor: timestamp('scheduled_for').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    queueProcessingIdx: index('background_jobs_queue_processing_idx').on(table.queueName, table.status, table.scheduledFor, table.lockedUntil),
    statusQueueIdx: index('background_jobs_status_queue_idx').on(table.status, table.queueName),
    lockedUntilIdx: index('background_jobs_locked_until_idx').on(table.lockedUntil),
    scheduledForIdx: index('background_jobs_scheduled_for_idx').on(table.scheduledFor),
  }
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  permissions: jsonb('permissions').default('{}'), // Array of permission strings or object
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  headUserId: uuid('head_user_id'), // Self-referencing foreign key added later
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: varchar('firebase_uid', { length: 255 }).notNull().unique(),
  employeeNumber: varchar('employee_number', { length: 50 }).unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }).unique(),
  jobTitle: varchar('job_title', { length: 255 }),
  profilePhotoUrl: varchar('profile_photo_url', { length: 1024 }),
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  managerId: uuid('manager_id'), // Added dynamic foreign key later
  hierarchyPath: varchar('hierarchy_path', { length: 1024 }),
  status: userStatusEnum('status').default('ACTIVE').notNull(),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  dateJoinedDepartment: timestamp('date_joined_department'),
  lastDepartmentChangeAt: timestamp('last_department_change_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    managerFk: foreignKey({
      columns: [table.managerId],
      foreignColumns: [table.id],
      name: "users_manager_id_fk"
    }),
    firebaseUidIdx: index('users_firebase_uid_idx').on(table.firebaseUid),
    departmentIdx: index('users_dept_idx').on(table.departmentId),
    employeeNumberIdx: index('users_employee_number_idx').on(table.employeeNumber),
    roleIdx: index('users_role_idx').on(table.roleId),
    statusIdx: index('users_status_idx').on(table.status),
    managerIdx: index('users_manager_idx').on(table.managerId),
  }
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  taskType: taskTypeEnum('task_type').notNull(),
  priority: priorityEnum('priority').default('MEDIUM').notNull(),
  escalationLevel: varchar('escalation_level', { length: 50 }).default('Level 0').notNull(),
  targetLocationLat: decimal('target_location_lat', { precision: 10, scale: 7 }),
  targetLocationLng: decimal('target_location_lng', { precision: 10, scale: 7 }),
  dueDate: timestamp('due_date').notNull(),
  status: taskStatusEnum('status').default('PENDING').notNull(),
  extendedStatus: varchar('extended_status', { length: 50 }).default('Assigned').notNull(),
  category: varchar('category', { length: 100 }).default('General').notNull(),
  comments: jsonb('comments').default('[]'),
  timeline: jsonb('timeline').default('[]'),
  assignedTo: uuid('assigned_to').references(() => users.id).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    assignedToIdx: index('tasks_assigned_to_idx').on(table.assignedTo),
    statusIdx: index('tasks_status_idx').on(table.status),
    createdByIdx: index('tasks_created_by_idx').on(table.createdBy),
    dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
    taskTypeIdx: index('tasks_task_type_idx').on(table.taskType),
    statusAssignedIdx: index('tasks_status_assigned_idx').on(table.status, table.assignedTo),
  }
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id),
  submitterId: uuid('submitter_id').references(() => users.id).notNull(),
  reportType: reportTypeEnum('report_type').default('FIELD_VISIT').notNull(),
  status: reportStatusEnum('status').default('DRAFT').notNull(),
  gpsLat: decimal('gps_lat', { precision: 10, scale: 7 }),
  gpsLng: decimal('gps_lng', { precision: 10, scale: 7 }),
  isGpsVerified: boolean('is_gps_verified').default(false).notNull(),
  performanceScore: decimal('performance_score', { precision: 5, scale: 2 }),
  notes: text('notes'),
  submittedAt: timestamp('submitted_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    submitterIdx: index('reports_submitter_idx').on(table.submitterId),
    statusIdx: index('reports_status_idx').on(table.status),
    taskIdIdx: index('reports_task_id_idx').on(table.taskId),
    reportTypeIdx: index('reports_report_type_idx').on(table.reportType),
    createdAtIdx: index('reports_created_at_idx').on(table.submittedAt),
  }
});

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').references(() => reports.id).notNull(),
  mediaUrl: varchar('media_url', { length: 1024 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 1024 }),
  mediaType: mediaTypeEnum('media_type').default('PHOTO').notNull(),
  fileHash: varchar('file_hash', { length: 255 }),
  outsideGeofence: boolean('outside_geofence').default(false).notNull(),
  capturedLat: decimal('captured_lat', { precision: 10, scale: 7 }),
  capturedLng: decimal('captured_lng', { precision: 10, scale: 7 }),
  verificationStatus: verificationStatusEnum('verification_status').default('PENDING').notNull(),
  fraudFlag: boolean('fraud_flag').default(false).notNull(),
  fraudReason: text('fraud_reason'),
  capturedAt: timestamp('captured_at').notNull(),
}, (table) => {
  return {
    reportIdx: index('evidence_report_idx').on(table.reportId),
  }
});

export const approvals = pgTable('approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').references(() => reports.id).notNull(),
  approverId: uuid('approver_id').references(() => users.id).notNull(),
  decision: approvalDecisionEnum('decision').notNull(),
  comments: text('comments'),
  decisionAt: timestamp('decision_at').defaultNow().notNull(),
}, (table) => {
  return {
    reportApproverIdx: index('approvals_report_approver_idx').on(table.reportId, table.approverId),
    approverIdx: index('approvals_approver_idx').on(table.approverId),
  }
});

export const reportComments = pgTable('report_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').references(() => reports.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reportVersions = pgTable('report_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').references(() => reports.id).notNull(),
  versionNumber: integer('version_number').notNull(),
  notes: text('notes'),
  status: reportStatusEnum('status').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userUnreadIdx: index('notifications_user_unread_idx').on(table.userId, table.isRead),
  }
});



export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 255 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: jsonb('metadata'),
}, (table) => {
  return {
    userActionIdx: index('audit_logs_user_action_idx').on(table.userId, table.action),
  }
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  scopes: jsonb('scopes').default('[]').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  endpointUrl: varchar('endpoint_url', { length: 1024 }).notNull(),
  events: jsonb('events').default('[]').notNull(),
  secret: varchar('secret', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  retryCount: integer('retry_count').default(3).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id').references(() => webhooks.id).notNull(),
  event: varchar('event', { length: 255 }).notNull(),
  payloadSnapshot: jsonb('payload_snapshot'),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  errorReason: text('error_reason'),
  attemptCount: integer('attempt_count').default(1).notNull(),
  status: syncStatusEnum('status').default('PENDING').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

export const integrationSyncLogs = pgTable('integration_sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  systemName: systemNameEnum('system_name').notNull(),
  syncType: syncTypeEnum('sync_type').notNull(),
  status: syncStatusEnum('status').default('PENDING').notNull(),
  payloadSnapshot: jsonb('payload_snapshot'),
  errorReason: text('error_reason'),
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
}, (table) => {
  return {
    systemSyncIdx: index('integration_sync_logs_system_idx').on(table.systemName, table.status),
  }
});

export const homepageContent = pgTable('homepage_content', {
  id: varchar('id', { length: 50 }).primaryKey(), // fixed ID like 'homepage-settings'
  heroHeadline: text('hero_headline').default('Welcome to Supervisor Eye'),
  heroSubheadline: text('hero_subheadline').default('Movit Group\'s Intelligent Workforce Supervision, Reporting and Performance Management Platform'),
  heroImage: varchar('hero_image', { length: 1024 }),
  companyOverview: text('company_overview'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  taskType: taskTypeEnum('task_type').notNull(),
  priority: priorityEnum('priority').default('MEDIUM').notNull(),
  escalationLevel: varchar('escalation_level', { length: 50 }).default('Level 0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
});

export const approvalChains = pgTable('approval_chains', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  taskType: varchar('task_type', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const approvalSteps = pgTable('approval_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  chainId: uuid('chain_id').references(() => approvalChains.id).notNull(),
  stepOrder: integer('step_order').notNull(),
  roleId: uuid('role_id').references(() => roles.id),
  userId: uuid('user_id').references(() => users.id),
  slaHours: integer('sla_hours').default(24).notNull(),
  slaAction: slaActionEnum('sla_action').default('ESCALATE').notNull(),
});

export const reportApprovals = pgTable('report_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').references(() => reports.id).notNull(),
  stepId: uuid('step_id').references(() => approvalSteps.id), 
  approverId: uuid('approver_id').references(() => users.id).notNull(),
  status: approvalStatusEnum('status').default('PENDING').notNull(),
  comments: text('comments'),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  actedAt: timestamp('acted_at'),
  deadline: timestamp('deadline'),
}, (table) => {
  return {
    reportIdx: index('report_approvals_report_idx').on(table.reportId),
    approverIdx: index('report_approvals_approver_idx').on(table.approverId),
    statusIdx: index('report_approvals_status_idx').on(table.status),
    deadlineIdx: index('report_approvals_deadline_idx').on(table.deadline),
    statusDeadlineIdx: index('report_approvals_status_deadline_idx').on(table.status, table.deadline),
  }
});

export const escalations = pgTable('escalations', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').references(() => reports.id).notNull(),
  reportApprovalId: uuid('report_approval_id').references(() => reportApprovals.id),
  escalatedToId: uuid('escalated_to_id').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  status: escalationStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
}, (table) => {
  return {
    reportIdx: index('escalations_report_idx').on(table.reportId),
    escalatedToIdx: index('escalations_escalated_to_idx').on(table.escalatedToId),
    statusIdx: index('escalations_status_idx').on(table.status),
  }
});

export const delegations = pgTable('delegations', {
  id: uuid('id').primaryKey().defaultRandom(),
  delegatorId: uuid('delegator_id').references(() => users.id).notNull(),
  delegateeId: uuid('delegatee_id').references(() => users.id).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insightTypeEnum = pgEnum('insight_type', ['RISK', 'TREND', 'ANOMALY', 'RECOMMENDATION']);
export const summaryPeriodEnum = pgEnum('summary_period', ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']);
export const insightFeedbackStatusEnum = pgEnum('insight_feedback_status', ['USEFUL', 'NOT_USEFUL', 'INVESTIGATING', 'DISMISSED']);

export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: insightTypeEnum('type').notNull(),
  severity: priorityEnum('severity').default('MEDIUM').notNull(),
  title: varchar('title').notNull(),
  explanation: text('explanation').notNull(),
  confidence: integer('confidence').notNull(),
  recommendedAction: text('recommended_action'),
  sourceData: jsonb('source_data'), 
  feedbackStatus: insightFeedbackStatusEnum('feedback_status'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const aiInsightFeedback = pgTable('ai_insight_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  insightId: uuid('insight_id').references(() => aiInsights.id).notNull(),
  executiveId: uuid('executive_id').references(() => users.id).notNull(),
  status: insightFeedbackStatusEnum('status').notNull(),
  comments: text('comments'),
  actionTaken: text('action_taken'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const executiveSummaries = pgTable('executive_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  period: summaryPeriodEnum('period').notNull(),
  summaryText: text('summary_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const orgHealthMetrics = pgTable('org_health_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  healthScore: integer('health_score').notNull(),
  complianceScore: integer('compliance_score').notNull(),
  productivityScore: integer('productivity_score').notNull(),
  efficiencyScore: integer('efficiency_score').notNull(),
  slaScore: integer('sla_score').notNull(),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull()
});

export const departmentIntelligence = pgTable('department_intelligence', {
  id: uuid('id').primaryKey().defaultRandom(),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  healthScore: integer('health_score').notNull(),
  riskScore: integer('risk_score').notNull(),
  taskCompletionRate: integer('task_completion_rate').notNull(), 
  complianceRate: integer('compliance_rate').notNull(), 
  slaPerformance: integer('sla_performance').notNull(), 
  calculatedAt: timestamp('calculated_at').defaultNow().notNull()
});

export const userIntelligence = pgTable('user_intelligence', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  roleType: varchar('role_type'), // 'SUPERVISOR', 'FIELD_STAFF'
  productivityScore: integer('productivity_score').notNull(),
  qualityScore: integer('quality_score').notNull(),
  complianceScore: integer('compliance_score').notNull(),
  flags: integer('flags').default(0),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull()
});

export const departmentAssignmentHistory = pgTable('department_assignment_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  previousDepartmentId: uuid('previous_department_id').references(() => departments.id),
  newDepartmentId: uuid('new_department_id').references(() => departments.id).notNull(),
  assignedBy: uuid('assigned_by').references(() => users.id),
  assignmentReason: text('assignment_reason'),
  effectiveDate: timestamp('effective_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userAssIdx: index('dept_ass_user_idx').on(table.userId),
  }
});

// Relations
export const departmentsRelations = relations(departments, ({ one }) => ({
  head: one(users, {
    fields: [departments.headUserId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  manager: one(users, { fields: [users.managerId], references: [users.id] }),
  subordinates: many(users, { relationName: "manager" }),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  reports: many(reports, { relationName: "submittedReports" }),
  approvals: many(approvals),
  notifications: many(notifications),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignee: one(users, { fields: [tasks.assignedTo], references: [users.id], relationName: "assignedTasks" }),
  creator: one(users, { fields: [tasks.createdBy], references: [users.id], relationName: "createdTasks" }),
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  task: one(tasks, { fields: [reports.taskId], references: [tasks.id] }),
  submitter: one(users, { fields: [reports.submitterId], references: [users.id], relationName: "submittedReports" }),
  evidence: many(evidence),
  approvals: many(approvals),
  comments: many(reportComments),
  versions: many(reportVersions),
}));

export const reportCommentsRelations = relations(reportComments, ({ one }) => ({
  report: one(reports, { fields: [reportComments.reportId], references: [reports.id] }),
  user: one(users, { fields: [reportComments.userId], references: [users.id] }),
}));

export const reportVersionsRelations = relations(reportVersions, ({ one }) => ({
  report: one(reports, { fields: [reportVersions.reportId], references: [reports.id] }),
  updater: one(users, { fields: [reportVersions.updatedBy], references: [users.id] }),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  report: one(reports, { fields: [evidence.reportId], references: [reports.id] }),
}));

export const reportApprovalsRelations = relations(reportApprovals, ({ one }) => ({
  report: one(reports, { fields: [reportApprovals.reportId], references: [reports.id] }),
  step: one(approvalSteps, { fields: [reportApprovals.stepId], references: [approvalSteps.id] }),
  approver: one(users, { fields: [reportApprovals.approverId], references: [users.id] }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  report: one(reports, { fields: [approvals.reportId], references: [reports.id] }),
  approver: one(users, { fields: [approvals.approverId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const executiveSummariesRelations = relations(executiveSummaries, () => ({}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ many }) => ({
  feedback: many(aiInsightFeedback),
}));

export const aiInsightFeedbackRelations = relations(aiInsightFeedback, ({ one }) => ({
  insight: one(aiInsights, { fields: [aiInsightFeedback.insightId], references: [aiInsights.id] }),
  executive: one(users, { fields: [aiInsightFeedback.executiveId], references: [users.id] }),
}));

export const departmentIntelligenceRelations = relations(departmentIntelligence, ({ one }) => ({
  department: one(departments, { fields: [departmentIntelligence.departmentId], references: [departments.id] }),
}));

export const userIntelligenceRelations = relations(userIntelligence, ({ one }) => ({
  user: one(users, { fields: [userIntelligence.userId], references: [users.id] }),
}));

export const departmentAssignmentHistoryRelations = relations(departmentAssignmentHistory, ({ one }) => ({
  user: one(users, { fields: [departmentAssignmentHistory.userId], references: [users.id] }),
  previousDepartment: one(departments, { fields: [departmentAssignmentHistory.previousDepartmentId], references: [departments.id] }),
  newDepartment: one(departments, { fields: [departmentAssignmentHistory.newDepartmentId], references: [departments.id] }),
  assignedByUser: one(users, { fields: [departmentAssignmentHistory.assignedBy], references: [users.id] }),
}));
