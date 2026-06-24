import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';

type AuditAction = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILURE' 
  | 'PASSWORD_RESET' 
  | 'GOOGLE_LOGIN' 
  | 'ACCOUNT_DISABLED' 
  | 'LOGOUT'
  | 'CREATE_REPORT'
  | 'APPROVE_REPORT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_REJECTED'
  | 'ACCOUNT_DEACTIVATED'
  | 'USER_ONBOARDING_COMPLETED'
  | 'DEPARTMENT_TRANSFER'
  | 'USER_UPDATED';

export async function logAudit(
  userId: string | null, 
  action: AuditAction, 
  ipAddress?: string, 
  metadata?: any
) {
  try {
    await db.insert(auditLogs).values({
      userId: userId,
      action: action,
      ipAddress: ipAddress?.substring(0, 45), // Handle standard & IPv6
      metadata: metadata || {}
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
