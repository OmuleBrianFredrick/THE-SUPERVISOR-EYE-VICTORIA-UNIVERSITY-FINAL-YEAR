# Supervisor Eye

An enterprise-grade, hierarchical evidence-based reporting and accountability system designed for distributed field teams, merchandising operations, and sales governance.

## 📌 Overview

Supervisor Eye bridges the critical gap between distributed field operations and executive oversight. It provides a robust, multi-tiered platform where field staff can execute assigned tasks, capture geofenced evidence, and submit reports for hierarchical approval. The system ensures complete operational visibility, accountability, and compliance from the ground up through specialized, role-based, and department-isolated workspaces.

---

## 🏗️ Technology Stack

Supervisor Eye is built as a monolithic full-stack application leveraging modern, scalable, and type-safe technologies:

### Frontend (Client-Side)
*   **React 18:** Functional components, hooks, and context for state management.
*   **TypeScript:** Strict typing for robust development and fewer runtime errors.
*   **Vite:** Extremely fast build tool and development server.
*   **Tailwind CSS:** Utility-first CSS framework for rapid, responsive UI development.
*   **Lucide React:** Clean, consistent SVG icon library.
*   **React Router:** For handling client-side navigation across multiple dashboard views.

### Backend (Server-Side)
*   **Node.js & Express.js:** Fast, unopinionated web framework handling API routing, authentication, and business logic.
*   **TypeScript:** Sharing types (`/shared`) between frontend and backend to ensure API contracts are strictly enforced.

### Database & Storage
*   **PostgreSQL:** The primary relational database for structured data (Users, Tasks, Reports, Approval Chains).
*   **Drizzle ORM:** A lightweight, type-safe SQL ORM used to define schemas, handle migrations, and execute complex hierarchical queries.
*   **Firebase / Cloud Storage:** Utilized for secure, scalable blob storage (Evidence photos, uploaded documents).

---

## 🚀 Current Project Stage

**Stage: Advanced Alpha / Nearing Beta**

The application has moved past the foundational stages and currently has a fully functional core loop. The role-based access control (RBAC), database schemas, task dispatching, evidence uploading, and hierarchical approval workflows are fully implemented and verified via comprehensive mock data seeding. 

---

## ✅ What is Working (Implemented Features)

The following systems are fully functional and integrated:

1.  **Strict Role-Based Authorization & Hierarchical Isolation:**
    *   Authentication and session management.
    *   Vertical line-of-sight: Supervisors can only see their direct reports. Managers see their department. Field Staff see only their assigned tasks. Lateral departments are strictly isolated.
2.  **Role-Specific Dashboards:**
    *   **Field Staff Dashboard:** Task execution, field notes entry, and evidence upload.
    *   **Supervisor Dashboard:** Task assignment, team tracking, and pending approval review queues.
    *   **Manager & Executive Dashboards:** High-level departmental overviews and compliance metrics.
3.  **Task Management Lifecycle:**
    *   Full state machine: `Draft` ➔ `Assigned` ➔ `Accepted` ➔ `In Progress` ➔ `Pending Approval` ➔ `Completed` or `Revision Requested`.
4.  **Evidence Management System:**
    *   Secure upload mechanism for field evidence.
    *   Cryptographic file hashing for integrity.
    *   Evidence Gallery with detailed metadata (timestamps, file hashes).
5.  **Hierarchical Approval Workflow:**
    *   When Field Staff submit a task, it explicitly transitions to `Pending Approval` and appears in the direct Supervisor's Approval Queue.
    *   Supervisors can approve (completing the task) or request revisions (sending it back to `In Progress`).
6.  **Elite Agent Command Center (EACC):**
    *   `SUPER_ADMIN` interface bypassing standard departmental restrictions.
    *   Tools for global system configuration, user auditing, governance policy management, and approval chain configuration.
7.  **Database Seeding & Validation (`populate-data.ts`):**
    *   A massive, highly detailed script that populates the database with realistic organizational hierarchies, approval chains, active tasks, and mock evidence to instantly validate system logic.

---

## ⏳ Pending Features & Work in Progress

While the core loop works, some areas require further refinement before a production release:

1.  **Real-Time Geolocation Enforcement:** 
    *   Currently, GPS coordinates are collected, but strict geofencing validation (blocking submissions if the user is too far from the target location) needs final calibration and enforcement on the backend.
2.  **Live Push Notifications:**
    *   In-app notifications exist in the schema, but real-time delivery via WebSockets or Firebase Cloud Messaging (FCM) is pending implementation.
3.  **Comprehensive Error Boundaries & Fallbacks:**
    *   Adding robust frontend error boundaries to gracefully handle network failures or API timeouts without crashing the user's dashboard.
4.  **Production Authentication Provider:**
    *   Currently utilizing simulated auth/tokens for development. Requires full integration with an enterprise SSO or production Identity Provider (IdP).
5.  **Offline-First Capabilities:**
    *   Basic offline caching exists, but full IndexedDB integration for seamless offline task execution and background sync upon reconnection needs to be hardened.

---

## 🔮 Future Upgrades & Roadmap

1.  **AI-Powered Evidence Analysis:**
    *   Integrating Google Gemini Vision API to automatically scan uploaded evidence (e.g., verifying a retail shelf display matches the required planogram) before a human supervisor ever reviews it.
2.  **Advanced GPS Command Center:**
    *   Implementing a live interactive map (Google Maps Platform) plotting all field agents, active tasks, and flagged evidence anomalies in real-time.
3.  **Dynamic SLA (Service Level Agreement) Engine:**
    *   Automated escalation protocols. If a supervisor ignores a `Pending Approval` task for > 24 hours, automatically route it to the Department Manager and flag the supervisor's compliance score.
4.  **Custom Form Builder:**
    *   Allowing Admins in the EACC to build custom, dynamic inspection forms (checklists, dropdowns, signatures) that attach to specific task types.
5.  **Automated PDF Report Generation:**
    *   Generating downloadable, cryptographically signed PDF summaries of completed tasks, including all evidence and the full chain of custody/approval timestamps.

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL database (Local or Cloud)
*   Firebase Project (for storage/auth)

### Installation & Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Configuration:**
    Create a `.env` file based on `.env.example` and populate it with your PostgreSQL database connection string and Firebase configuration keys.

3.  **Database Setup & Seeding:**
    Generate and apply schema changes, then populate the system with the enterprise mock data (this creates the hierarchies, tasks, and users):
    ```bash
    npm run build
    node dist/server/db/populate-data.js
    ```

4.  **Run Development Server:**
    Start both the Vite frontend and Express backend concurrently:
    ```bash
    npm run dev
    ```

5.  **Build for Production:**
    ```bash
    npm run build
    npm start
    ```

--- 

## 📂 Deep-Dive Directory Structure

*   `/src`: Frontend React application.
    *   `/components`: 
        *   `/dashboards`: Role-isolated views (`FieldStaffDashboard`, `SupervisorDashboard`, etc.).
        *   `/features`: Complex, reusable logic components (`EvidenceUploader`, `ApprovalQueue`).
    *   `/pages`: Top-level application routes.
        *   `/admin`: Houses the EACC components and configuration panels.
    *   `/contexts`: React contexts for Authentication, Toast Notifications, and UI state.
    *   `/hooks`: Custom React hooks, including data fetching (`useQueries.ts`).
    *   `/lib`: Frontend utilities (e.g., `pdfGenerator.ts`).
*   `/server`: Backend Express application.
    *   `/routes`: Modular API endpoints (`/reports`, `/tasks`, `/admin`, `/auth`).
    *   `/db`: Drizzle ORM configuration (`schema.ts`) and massive seeding logic (`populate-data.ts`).
    *   `/services`: Background jobs, SLA tracking, and complex business logic.
    *   `/middleware`: Express middleware (e.g., JWT validation, role-based guards).
*   `/shared`: Common TypeScript types ensuring parity between client requests and server expectations.
