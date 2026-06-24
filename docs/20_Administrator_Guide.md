# Supervisor Eye: Administrator Manual & Governance Guide

This **Administrator Manual** provides deep architectural insight, control directives, role configurations, and metadata settings for the **Supervisor Eye** platform. This guide is tailored for IT Administrators, System Architects, and Corporate Governance Officers.

---

## 1. Role-Based Access Control (RBAC) System

Supervisor Eye restricts operations at a database and route level using a deterministic Multi-Role configuration.

### Static System Roles
*   `SYSTEM_ADMIN` (Full Access): Complete platform control. Can manipulate database records, reset schema configurations, rebuild approval workflows, and override multi-tier escalations.
*   `EXECUTIVE` (Management Access): Access to intelligence boards, AI analytics, metrics dashboards, GPS maps, and feedback systems. Cannot delete system logs or modifty raw authentication mappings.
*   `FIELD_STAFF` (Geospatial/Submission Client): Access restricted to task check-ins, personal profile reviews, and media file uploads. Blocked from central intelligence tables and global escalations.

### Authorization Flow Chart
```
User Auth Request
      │
      ▼
┌───────────────┐
│ Firebase/JWT  │ Verification Claims checked (verifyToken Middleware)
└───────┬───────┘
        │
        ▼ User ID parsed
┌───────────────┐
│ Postgres Query│ Relational Roles mapped from schema.users
└───────┬───────┘
        │
        ▼ Role Authenticated
┌───────────────────────────────────────┐
│ requireRole(['EXECUTIVE']) Check?   │
├───────────────────┬───────────────────┤
│                   │                   │
▼ YES               ▼ NO                ▼ FIELD_STAFF (No access to EACC)
Access Granted      403 Forbidden       Access Blocked
```

---

## 2. Advanced Workflow Setup & Custom Approval Chains

Administrators can construct dynamic sign-off loops to control compliance releases.

### Setting Up a Custom Approval Chain
1.  Navigate to the **Approval Chains** panel.
2.  Click **Create New Chain Template**.
3.  Specify the **Chain Name** (e.g., "High-Value Field Spend Chain").
4.  Define sequential gates:
    *   **Gate 1 (EACC Audit):** Assign role mandatory sign-off.
    *   **Gate 2 (Finance Department clearance):** Assign specific approval targets.
5.  Set the fallback timeout (e.g., 24 hours) after which if the gate remains unsigned, the system issues an automatic `HIGH_SEVERITY` escalation.

---

## 3. Platform Compliance & Escalation Administration

### The Escalations Engine Setup
The automatic rule engine triggers an escalation whenever telemetry metrics skip critical boundaries.
*   **Deviation Threshold:** If GPS tracking identifies an agent departing more than 500 meters from their assigned boundary, an out-of-bounds warning triggers.
*   **Telemetry Failure:** If check-ins do not register within the designated timeframe, log status converts.

Administrators can override, clean, or force-resolve system issues inside the Escalation workspace by utilizing database utility indicators.

---

## 4. Troubleshooting & Logging

### Auditing Platform Activity
For compliance verification:
1. Log entries are registered within the `audit_logs` table for all critical system actions (e.g., user creations, feedback updates, escalation status overrides).
2. The event log is accessible in real-time inside the logging view of the Administrative Dashboard, where records contain:
    *   `userId` of the executing actor.
    *   `action` type identifying the function.
    *   `ipAddress` of the client.
    *   `metadata` JSON details.

### Standard Verification Steps for Database Failures
1. Confirm local SSL configurations match the postgres driver requirement.
2. Check `.env` schema bindings to verify connections. Use:
   ```bash
   npx drizzle-kit studio
   ```
   to inspect data bindings and integrity rows on-demand.
