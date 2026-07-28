# Developer Troubleshooting Guide: Persistent Task & Approval Workflow Issues

## Problem Statement
Despite recent updates, the task progression and report submission workflow continues to experience issues. Specifically:
1. **Task State Transitions:** Tasks are failing to transition smoothly from `In Progress` to `Awaiting Review` upon submission by the Field Staff.
2. **Dashboard Misalignment (Supervisor):** Tasks that should be exclusively in the **Approval Queue** are either missing or still appearing in the **Operational Pipeline**.
3. **Evidence Synchronization:** Evidence (photos, notes, GPS) uploaded by the Field Staff during task execution is not reliably sinking to the database or being displayed to the Supervisor during review.

---

## Areas to Investigate & Fix

To fully resolve this workflow, the following files and flows must be debugged and corrected:

### 1. `src/components/features/EvidenceUploader.tsx`
**Role:** Handles the actual upload of field data and the submission trigger.
**What to Fix:**
* Ensure that clicking "Submit Work for Review" makes a successful API call to update the task status to `Awaiting Review` or `Pending Approval`.
* Verify that all uploaded evidence (images, notes, locations) is successfully POSTed/PATCHed to the `/api/v1/reports` endpoint and associated with the correct `taskId`.
* Check if there are unhandled promise rejections or silent failures during the upload process.

### 2. `src/components/dashboards/FieldStaffDashboard.tsx`
**Role:** The main interface for the Field Staff.
**What to Fix:**
* Verify the UI state correctly hides the task from the "Active Tasks" or "In Progress" view once it is submitted.
* Ensure the "Check-in" flow successfully moves the task from `Accepted` to `In Progress` before evidence can be uploaded.

### 3. `src/components/dashboards/SupervisorDashboard.tsx`
**Role:** Displays the Approval Queue and Operational Pipeline.
**What to Fix:**
* **Strict Filtering:** Ensure the logic separating `filteredTasks` (Operational Pipeline) and `pendingApprovals` (Approval Queue) is mutually exclusive. 
* Tasks with `extendedStatus === 'Awaiting Review'` or `Pending Approval` MUST NOT appear in `filteredTasks` under any circumstances (even if `statusFilter === 'ALL'`).
* Ensure that the evidence array mapping correctly binds the report data to the task wrapper so the Supervisor can actually see the uploaded images.

### 4. `server/routes/tasks.ts`
**Role:** Backend task state machine.
**What to Fix:**
* Review the `PATCH /api/v1/tasks/:id/status` endpoint. 
* Ensure the transition array permits Field Staff to transition a task from `In Progress` to `Awaiting Review`. If this validation fails, the frontend will silently fail to update the status.

### 5. `server/routes/reports.ts`
**Role:** Backend report and evidence handler.
**What to Fix:**
* Ensure that when a report is updated to `status: 'SUBMITTED'`, it automatically triggers a database update to the parent Task to change its status to `Awaiting Review`. Doing this on the backend prevents race conditions where the report submits but the task status fails to update.

---

## Recommended Testing Steps for Developers
1. **Trace the Network Payload:** Open the browser's Network tab. Submit a task as Field Staff and check the exact JSON payload sent to `/api/v1/reports` and `/api/v1/tasks/:id/status`.
2. **Database Verification:** Check the database directly (using the `cloudsql-execute-sql` tool if needed) to see if the `evidence` JSON array is being populated on the Report record.
3. **Check the Status Strings:** Ensure there are no casing mismatches (e.g., `Awaiting Review` vs `AWAITING_REVIEW`). The frontend status filters are highly sensitive to exact string matches.
