/**
 * Enterprise Permission Management System
 * Defines role-based permissions and access controls across Supervisor Eye modules.
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SYSTEM_ADMIN'
  | 'Platform Admin'
  | 'Administrator'
  | 'Executive'
  | 'MD / Ops Director'
  | 'Supervisor'
  | 'Area Manager'
  | 'Manager'
  | 'Field Staff'
  | string;

// Group definitions
const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'Platform Admin',
  'Administrator',
  'Executive',
  'MD / Ops Director',
  'IT_ADMIN',
  'IT_SUPPORT',
  'NETWORK_ADMIN',
  'SECURITY_ADMIN',
  'DATABASE_ADMIN'
];

const SUPERVISORY_ROLES = [
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'Platform Admin',
  'Administrator',
  'Executive',
  'MD / Ops Director',
  'Supervisor',
  'Area Manager',
  'Manager'
];

const CORE_DESTRUCTIVE_ROLES = [
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'Platform Admin'
];

const EXECUTIVE_FINANCE_ROLES = [
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'Executive',
  'MD / Ops Director'
];

/**
 * Checks if a role can approve and onboard user accounts.
 */
export function canApproveUsers(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Checks if a role can edit permissions, create, or alter roles.
 */
export function canManageRoles(role: UserRole): boolean {
  return CORE_DESTRUCTIVE_ROLES.includes(role);
}

/**
 * Checks if a role can access and configure the EACC Command Center.
 */
export function canManageEACC(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Checks if a role has access to high-level charts and performance trends.
 */
export function canAccessAnalytics(role: UserRole): boolean {
  return SUPERVISORY_ROLES.includes(role);
}

/**
 * Checks if a role can export PDF, CSV reports, or audit logs.
 */
export function canExportReports(role: UserRole): boolean {
  return SUPERVISORY_ROLES.includes(role);
}

/**
 * Checks if a role has access to financial performance or business overhead.
 */
export function canViewFinance(role: UserRole): boolean {
  return EXECUTIVE_FINANCE_ROLES.includes(role);
}

/**
 * Checks if a role can permanently soft-delete or disable a user.
 */
export function canDeleteUsers(role: UserRole): boolean {
  return CORE_DESTRUCTIVE_ROLES.includes(role);
}

/**
 * Checks if a role can assign performance action points or specific field tasks.
 */
export function canAssignTasks(role: UserRole): boolean {
  return SUPERVISORY_ROLES.includes(role);
}

/**
 * Checks if a role can approve/reject staff field reports.
 */
export function canApproveReports(role: UserRole): boolean {
  return SUPERVISORY_ROLES.includes(role);
}

/**
 * Checks if a role can add/remove corporate department segments.
 */
export function canManageDepartments(role: UserRole): boolean {
  return [...CORE_DESTRUCTIVE_ROLES, 'Administrator'].includes(role);
}

/**
 * Helper to check if role is executive/admin in any capacity.
 */
export function isExecutiveOrAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Helper to check if role is supervisor/manager in any capacity.
 */
export function isSupervisorOrManager(role: UserRole): boolean {
  return SUPERVISORY_ROLES.includes(role);
}
