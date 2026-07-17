# Supervisor Eye

An enterprise-grade, hierarchical evidence-based reporting and accountability system designed for distributed field teams, merchandising operations, and sales governance.

## Overview

Supervisor Eye bridges the gap between field operations and executive oversight. It provides a robust, multi-tiered platform where field staff can execute assigned tasks, capture geofenced evidence, and submit reports for hierarchical approval. It ensures complete operational visibility from the ground up through specialized, role-based dashboards.

## Key Features

- **Role-Based Workspaces**: Tailored dashboards for Field Staff, Supervisors, Managers, and Executives.
- **Hierarchical Approval Chains**: Automated routing of field reports to direct supervisors and department heads for compliance review and approval.
- **Evidence Management**: Secure capture, upload, and gallery viewing of field evidence (photos, documents) with metadata (location, timestamp, file hash).
- **Task Dispatch & Tracking**: Assign, monitor, and transition tasks through a complete lifecycle (`Assigned` -> `In Progress` -> `Pending Approval` -> `Completed` / `Revision Requested`).
- **Elite Agent Command Center (EACC)**: A SUPER_ADMIN interface for global system configuration, auditing, governance policy management, and SLA tracking.
- **GPS Command Center**: Geographic mapping of field activities, tasks, and captured evidence.
- **Compliance & Analytics**: Deep insights into field compliance, SLA breaches, evidence verification statuses, and overall organizational health.

## Architectural Structure

This is a monolithic full-stack application leveraging modern, scalable technologies:

- **Frontend**: React 18, Tailwind CSS, TypeScript, Vite, Lucide React
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (via Drizzle ORM configured in `/server/db`)
- **Integration**: Firebase Auth / Storage (for evidence)

## Directory Structure

- `/src`: Frontend React application.
  - `/components`: Reusable UI elements and role-based dashboards (`FieldStaffDashboard`, `SupervisorDashboard`, `ExecutiveDashboard`, etc.).
  - `/pages`: Main application routes (Home, Reports, Auth, EACC, etc.).
  - `/contexts`: React contexts for Authentication and UI state.
  - `/hooks`: Custom React hooks, including data fetching logic.
- `/server`: Backend Express application.
  - `/routes`: API endpoints for reports, tasks, auth, admin, approvals, etc.
  - `/db`: Database configuration, Drizzle schemas, and seeding scripts (`populate-data.ts`).
  - `/controllers`: Logic for handling incoming API requests.
- `/shared`: Common TypeScript types and interfaces used by both the client and server.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Ensure your `.env` is configured with necessary PostgreSQL database connection strings and Firebase configuration keys as defined in `.env.example`.

3. **Database Setup:**
   Generate and apply schema changes, and optionally seed the database:
   ```bash
   npm run build
   node dist/server/db/populate-data.js
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

## Authorization & Roles

The system is strictly guarded by department and hierarchy structures:
- **Field Staff**: Can only view and act on tasks assigned specifically to them.
- **Supervisors**: Can assign tasks to direct reports and review/approve their submitted evidence.
- **Managers**: Have departmental oversight and can intervene in escalated approvals.
- **SUPER_ADMIN**: Bypasses standard restrictions to manage the entire enterprise via the EACC.
