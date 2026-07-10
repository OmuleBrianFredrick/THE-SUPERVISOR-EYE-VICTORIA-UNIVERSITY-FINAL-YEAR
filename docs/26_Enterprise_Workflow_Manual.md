# Supervisor Eye Enterprise Platform (v2.1)
## Enterprise Workflow Manual: End-to-End Business Process Guide

This document is the official Enterprise Workflow Manual for the **Supervisor Eye Enterprise Platform (Version 2.1)**. It maps every core business process, data transition, and automated system event occurring within the platform.

---

## 1. Introduction
In an enterprise monitoring and compliance ecosystem, operations are defined by the flow of information. The **Supervisor Eye Enterprise Platform** relies on structured, secure, and automated workflows to coordinate activities between field-level operators, strategic leadership, and administrative controllers.

This manual serves as the primary authority on system workflows, tracking events from initialization, through execution and verification, to administrative logging.

---

## 2. Enterprise Workflow Architecture
Supervisor Eye utilizes a full-stack, distributed architecture to orchestrate its workflows:
- **Client Presentation Layer**: Renders UI panels and triggers actions based on active roles.
- **Service & Route Layer**: Translates user inputs into structured transactions, performing authentication validation, validation schemas, and RBAC authorization.
- **Workflow & Database Engines**: Maintains state machines across tables (`tasks`, `reports`, `approvals`, `evidence`, `audit_log`), triggering background actions and pushing notifications to active sessions.

---

## 3. Workflow Dependency Map
Understanding how individual workflows trigger secondary and tertiary workflows is crucial for system administrators:

```
┌────────────────────────┐
│   User Registration    │
└───────────┬────────────┘
            │ Triggers
┌───────────▼────────────┐
│  Workforce Approval    │
└───────────┬────────────┘
            │ Enables
┌───────────▼────────────┐
│  Authentication/RBAC   │
└───────────┬────────────┘
            │ Accesses
┌───────────▼────────────┐
│    Dashboard Routing   │
└───────────┬────────────┘
            │ Facilitates
┌───────────▼────────────┐     Triggers     ┌────────────────────────┐
│     Task Lifecycle     ├─────────────────►│   GPS Check-In Event   │
└───────────┬────────────┘                  └───────────┬────────────┘
            │                                           │ Captures
            │ Creates                               ┌───▼────────────────┐
            │                                       │  Evidence Upload   │
            │                                       └───────────┬────────┘
┌───────────▼────────────┐                                      │ Submits
│    Report Submission   ◄──────────────────────────────────────┘
└───────────┬────────────┘
            │ Triggers
┌───────────▼────────────┐
│   SLA/Workflow Review  ├─────────────────►[ AI Intelligence Engine ]
└────────────────────────┘
```

---

## 4. Complete Workflow Catalog

This catalog outlines the core workflows implemented in Version 2.1:

### 4.1 Account Onboarding Journey
- **User Registration Workflow**: Initiated by unregistered users requesting system profiles.
- **Workforce Approval Workflow**: Managed by Administrators to verify on-ground personnel details.
- **Authentication & RBAC Routing Workflow**: Controls entry, session maintenance, and custom interface rendering.

### 4.2 On-Ground Task Execution Journey
- **Task Creation & Assignment Workflow**: Initiated by Supervisors/Managers to deploy staff.
- **GPS Check-in Workflow**: Executed by Field Staff to verify coordinates against the target check-in radius.
- **Evidence Capture & Cryptographic Log**: Cryptographically hashes and secures high-resolution media evidence.
- **Report Submission & Workflow Chain**: Forwards completed field logs up the organizational hierarchy for review.

### 4.3 Governance & Compliance Lifecycle
- **SLA Monitoring & Escalation Workflow**: Tracks deadlines and triggers alerts for overdue reviews.
- **Media Governance & Storage Optimization Workflow**: Monitors file types, executes media compression, and manages cloud storage space.
- **System Synchronization & Auditing**: Periodically executes manual/automatic checks to ensure PostgreSQL profiles match active Firebase configurations.

---

## 5. Detailed Workflow Documentation

### 5.1 Account Onboarding Journey

#### Workflow 1: User Registration
- **Trigger**: Guest submits details via the "/register" portal.
- **Roles**: Guest (User), Firebase Auth Service, PostgreSQL User Register.
- **Step-by-Step Flow**:
  1. User enters name, email, password, and selects Department and requested Role.
  2. Firebase Auth creates the user profile, returning a unique `uid`.
  3. The local server receives the webhook and inserts a record into the `users` table with status `PENDING_APPROVAL`.
- **Database Action**: `INSERT INTO users (firebase_uid, email, role_id, status) VALUES (...)`.
- **Dashboard Impact**: Adds 1 count to "Pending Approvals" on the EACC dashboard.

#### Workflow 2: Workforce Approval
- **Trigger**: Administrator opens EACC Workforce Approvals.
- **Roles**: Administrator, User Register.
- **Step-by-Step Flow**:
  1. Administrator reviews the candidate's name, role request, and department selection.
  2. Administrator clicks **Approve**.
  3. Server updates user status to `ACTIVE`.
- **Database Action**: `UPDATE users SET status = 'ACTIVE' WHERE id = :userId`.
- **Audit Trail**: Writes an event row: `INSERT INTO audit_log (action, details) VALUES ('USER_APPROVED', ...)`.

---

### 5.2 On-Ground Task Execution Journey

#### Workflow 3: Task Creation & Assignment
- **Trigger**: Supervisor clicks **Create Task** in the Dashboard.
- **Roles**: Supervisor (Initiator), Field Staff (Assignee).
- **Step-by-Step Flow**:
  1. Supervisor specifies Title, Description, Priority, Due Date, and selects an active Field Staff profile.
  2. Task is created with status `ASSIGNED`.
  3. System triggers a local WebSocket notification to the assigned Field Staff.
- **Database Action**: `INSERT INTO tasks (title, description, assignee_id, status) VALUES (...)`.

#### Workflow 4: GPS Check-in & Evidence Capture
- **Trigger**: Field Staff clicks **GPS Check-in** on mobile device.
- **Roles**: Field Staff, Geolocation API, Storage Bucket.
- **Step-by-Step Flow**:
  1. Browser prompts user for Geolocation permission. Coordinates are collected.
  2. Field Staff captures an image and clicks **Upload Evidence**.
  3. File is pushed to secure cloud storage. A SHA-256 hash is computed in the browser.
  4. Server registers the evidence record, matching the coordinate points and file metadata.
- **Database Action**: `INSERT INTO evidence (file_url, sha256_hash, location_lat, location_lng) VALUES (...)`.

#### Workflow 5: Report Submission & Multi-Level Approval
- **Trigger**: Field Staff clicks **Submit Report**.
- **Roles**: Field Staff, Supervisor, Manager.
- **Step-by-Step Flow**:
  1. Report record is created, linking the original task and the uploaded evidence. Status is set to `SUBMITTED`.
  2. Supervisor reviews the report coordinates against the check-in radius. If valid, clicks **Review**.
  3. Manager reviews supervisor review and clicks **Approve**. Task status shifts to `COMPLETED`.
- **Database Action**: Updates `reports.status` to 'APPROVED' and `tasks.status` to 'COMPLETED'.

---

## 6. Workflow Diagrams

### End-to-End Business Operations Journey
```
   [ Guest Registration ] 
             │
             ▼
   [ Admin Approval ]  ───► (PostgreSQL Status -> ACTIVE)
             │
             ▼
   [ User Logs In ] ───► (Firebase Token Verification)
             │
             ▼
   [ Task Created ] ───► (Supervisor Defines Scope)
             │
             ▼
  [ GPS Check-in & Evidence ] ───► (SHA-256 Hash Generated)
             │
             ▼
   [ Report Submitted ]
             │
             ├────────► [ Supervisor First-level Review ]
             │
             └────────► [ Manager Second-level Approval ]
             │
             ▼
   [ Task Completed ] ───► (Dashboard Charts Refresh)
             │
             ▼
  [ Audit Verified ] ───► (EACC Evidence Ledger Logged)
```

---

## 7. Cross-Workflow Relationships
Workflows within Supervisor Eye do not exist in isolation:
- **Authentication → RBAC → Dashboard Routing**: Validating session tokens immediately dictates which sidebar tabs are rendered in the viewport.
- **Task → Report → Evidence**: A task cannot move to `COMPLETED` without a corresponding `SUBMITTED` report containing a `VERIFIED` evidence entry.
- **Approved Reports → Executive Intelligence**: Successfully completed workflows feed the statistical models that build the AI Executive briefs.

---

## 8. Security Across Workflows
- **Validation**: All incoming API data is validated using schema guards (e.g. `userUpdateSchema`, `createApiKeySchema`).
- **Authorization**: Route-level middlewares check role arrays before executing database updates.
- **Tamper Evident Ledgers**: If a file hash is modified on cloud storage, the **Evidence Audit Center** immediately flags it, and the compliance score is decremented.

---

## 9. Failure Handling & Recovery
- **GPS Out of Bounds**: If a check-in coordinate falls outside the specified check-in radius, the submission is flagged with a warning banner, requiring a Supervisor manual override.
- **Network Failures during Upload**: Browser queues file bytes locally. Once connectivity is restored, the queue resumes uploading, and computes the hash again.

---

## 10. Best Practices
- Define logical due dates during task configuration to avoid premature SLA escalation warnings.
- Always review coordinate tracks in the GPS Command Center to check path compliance.
- Instruct field staff to capture images clearly under good lighting conditions to avoid automatic AI rejection loops.

---

## 11. Frequently Asked Questions (FAQ)

#### Q: Can a task be assigned without an evidence requirement?
**A**: No. To maintain high-integrity operations, all core field tasks require at least one attached evidence media file to be completed.

#### Q: How is the SLA escalation duration computed?
**A**: It measures the difference between task creation time and current system time against the template due date threshold.

---

## 12. Conclusion
By detailing every core business workflow, this operational workflow manual ensures absolute clarity, security alignment, and perfect operating precision for the Supervisor Eye Enterprise Platform.
