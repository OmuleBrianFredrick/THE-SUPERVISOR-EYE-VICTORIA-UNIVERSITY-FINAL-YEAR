# Task and Report Approval Workflow

This document details the lifecycle of a task from assignment to completion, focusing on the interactions between Field Staff and Supervisors, specifically regarding report submission and the Approval Queue.

## 1. Task Assignment and Acceptance
- **Assigned:** A Supervisor creates a task and assigns it to a Field Staff member. The task appears in the Field Staff's "Available Tasks" queue.
- **Accepted:** The Field Staff member reviews the task details and accepts it. The task moves to the "Active Tasks" section and its status becomes `Accepted`.

## 2. Execution and Evidence Gathering
- **In Progress:** When the Field Staff member arrives at the location, they check in (verifying geofence or bypassing for testing). The task status transitions to `In Progress`.
- **Data Collection:** The Field Staff fills in field notes, captures/uploads images as evidence, and optionally shares GPS or destination details. 
- **Evidence Upload:** Uploaded evidence is saved to the backend database and linked to the active task via a Draft Report.

## 3. Submission for Review
- **Submit Work:** Once all evidence is uploaded, the Field Staff clicks "Submit Work For Review".
- **Status Change:** 
  - The Task's status updates from `In Progress` to `Awaiting Review` (or `Pending Approval`).
  - The underlying Report transitions from `DRAFT` to `SUBMITTED` (or `PENDING_REVIEW`).
- **Visibility:** The task is removed from the Field Staff's active execution view and moves to their logs.

## 4. Supervisor Approval Queue
- **Arrival in Queue:** On the Supervisor Dashboard, the submission appears in the "Approval Queue".
- **Queue Logic:** The Approval Queue aggregates items by checking for Reports with a `SUBMITTED`/`PENDING_REVIEW` status, as well as any Tasks explicitly marked as `Awaiting Review` or `Pending Approval`. This ensures no submissions fall through the cracks and removes them from the general "Operational Pipeline".
- **Review Process:** The Supervisor opens the submission to review the field notes, uploaded images, and location data.

## 5. Decision and Resolution
The Supervisor makes one of two decisions:

### A. Approve
- **Action:** The Supervisor clicks "Approve".
- **Status Change:** 
  - The Report status is updated to `APPROVED` (and assigned a performance score).
  - The Task status transitions to `Approved` (and subsequently `Completed`).
- **Result:** The task is closed successfully and logged in both the Field Staff's and Supervisor's history.

### B. Request Revision (Reject)
- **Action:** The Supervisor clicks "Request Revision" and provides required comments explaining what needs fixing.
- **Status Change:**
  - The Report status is updated to `REJECTED`.
  - The Task status transitions to `Revision Requested`.
- **Result:** The task returns to the Field Staff's active dashboard. The Field Staff must review the comments, upload new/corrected evidence, and repeat the submission process (Step 3).

## Summary of Task Status Transitions
`Assigned` -> `Accepted` -> `In Progress` -> `Awaiting Review` -> `Approved` / `Completed`

*(If Revision is requested: `Awaiting Review` -> `Revision Requested` -> `Awaiting Review`...)*
