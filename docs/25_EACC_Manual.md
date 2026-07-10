# Supervisor Eye Enterprise Platform (v2.1)
## Enterprise Administration & Command Center (EACC) Manual

This manual is the official operational and administrative guide for the **Enterprise Administration & Command Center (EACC)** of the **Supervisor Eye Enterprise Platform (Version 2.1)**. 

---

## 1. Introduction
The **Enterprise Administration & Command Center (EACC)** is the nerve center of the Supervisor Eye Enterprise Platform. It is a centralized, high-density dashboard built for high-level administration, data integration, security audit verification, AI performance tracking, and geospatial command. 

Designed specifically for system administrators, IT personnel, and executive-level leadership, the EACC aggregates critical metrics from across the enterprise, offering granular access controls and programmatic overrides to maintain total system compliance.

---

## 2. Purpose of the EACC
The EACC exists to fulfill several critical organizational needs:
1. **Core Workforce Identity Sync**: Programmatically aligning local profiles with cloud authentication states.
2. **Geospatial and GIS Oversight**: Tracking operational movements in real-time, verifying geographical checkpoints, and reviewing check-in histories.
3. **Audit and Media Governance**: Verifying the cryptographic integrity of files, monitoring media compression algorithms, and auditing digital evidence.
4. **Predictive Closed-Loop Actions**: Tuning the AI Insights Engine, recording human ratings on automated briefings, and updating SLA escalation policies.

---

## 3. Access & Security
To prevent unauthorized entry, the EACC is guarded by multiple overlapping layers of security:
- **RBAC Authentication**: Only users assigned to high-privileged roles can open the EACC.
  - *Authorized Roles*: `SUPER_ADMIN`, `SYSTEM_ADMIN`, `Administrator`, `Executive`.
  - *Blocked Roles*: `Manager`, `Supervisor`, `Field Staff` (receive immediate "Unauthorized" access warnings).
- **Endpoint Protection**: Every underlying Express backend route prefixed with `/api/admin` or `/api/governance` is protected by `verifyToken` and `requireRole` middleware checks.
- **SQL-Auth Integrity**: Built-in verification triggers log every login attempt and generate a telemetry trail in the PostgreSQL `audit_log` tables.

---

## 4. Complete UI Walkthrough

The EACC is designed as a full-screen, high-density, double-column viewport layout to prevent scrolling confusion:

### 4.1 Header & Breadcrumbs
- **Breadcrumb Navigation**: Shows the immediate path (`Home` -> `EACC` -> `Active Tab Name`) to anchor the user.
- **Back/Exit Button**: An **Exit** control is permanently anchored at the top left of the sidebar, enabling rapid return to the regular dashboard workspace.
- **Mobile Hamburger Toggle**: A dynamic control at the top-left of the main viewport to expand or collapse the menu drawer on mobile devices.

### 4.2 The Unified Sidebar
- **Full Tab Menu**: Lists all active administrative modules with individual descriptive vector icons (from `lucide-react`).
- **Profile Context Anchor**: The lower portion of the sidebar permanently displays the active user’s email address and their exact administrative RBAC level.

### 4.3 Main Content Viewport
- **Dynamic Panels**: Based on the active sidebar selection, the main viewport renders the corresponding interface panel instantly.

---

## 5. Complete Navigation Guide

The EACC features 26 primary sidebar navigation entries. Each menu item corresponds to a specific corporate responsibility:

1. **EACC Dashboard (`overview`)**: Summary charts, demographic counts, and live activity streams.
2. **Role Validation Audit (`role-validation`)**: Discrepancy detector auditing PostgreSQL user rows against actual active Firebase configurations.
3. **Workforce Auth & Sync (`workforce-sync`)**: Tools to execute background user reconciliation loops.
4. **Executive Intelligence (`exec-intelligence`)**: Closed-loop metrics, executive risk trends, and compliance tracking.
5. **AI Insights Engine (`ai-insights`)**: AI-generated reports detailing critical organizational deviations.
6. **Organizational Health (`org-health`)**: High-level visual tracking of division morale and engagement levels.
7. **Department Intelligence (`dept-intelligence`)**: Detailed operational metrics filtered by corporate division.
8. **Personnel Intelligence (`staff-intelligence`)**: Direct rosters of field staff, checking task completion rates.
9. **Workforce & HR Analytics (`workforce-intelligence`)**: Real-time salary, active hours, and workload density graphs.
10. **AI Feedback Center (`ai-feedback`)**: Analytical chart view tracking rating classifications on AI recommendations.
11. **Escalations Engine (`escalations`)**: Central register for active, unresolved, or high-risk SLA breaches.
12. **Approval Chains (`chains`)**: Interactive workflow editor defining multi-level supervisor approval rules.
13. **Delegation Config (`delegations`)**: Tool to reassign authorization duties during management absence.
14. **Governance Config (`governance-config`)**: Configures core SLA limits, check-in radii, and GPS refresh rates.
15. **Integration Platform (`integrations`)**: Central hub for generating API keys, mapping webhooks, and checking synchronization logs.
16. **GPS Command Center (`gps`)**: Spatial analytical map monitoring device paths and spatial checking anomalies.
17. **Compliance Center (`compliance`)**: Real-time status indicators tracking policy compliance percentages.
18. **Media Governance (`media`)**: Dashboard detailing uploaded video resolutions, storage savings, and compression rules.
19. **Storage Analytics (`storage`)**: Tracks cloud bucket space, total byte sizes, and file extension distribution.
20. **Evidence Audit (`evidence-audit`)**: Ledger detailing cryptographic file hashes (SHA-256) and audit validations.
21. **Operational Analytics (`intelligence`)**: Real-time operational graphs and execution velocity trackers.
22. **Executive Review (`executive`)**: Streamlined portal for Executives to review field media files rapidly.
23. **User Directory (`users`)**: Full table of registered system accounts, enabling manual edits and deletions.
24. **Report Approvals (`report-approvals`)**: Central panel to approve, reject, and comment on submitted field reports.
25. **Workforce Approvals (`approvals`)**: Queue of newly registered users awaiting verification.
26. **Platform Content (`content`)**: Control panel to write global warnings, homepage announcements, and maintenance alerts.

---

## 6. Module-by-Module Documentation

### 6.1 Workforce Auth & Sync
- **Purpose**: Validates directory synchronization across database servers and auth targets.
- **Main Interface**: Renders total Firebase user counts, active mismatches, and a complete sync report table.
- **Actions**: Triggering manual remediation loops, writing account properties, and committing sync states.
- **Database Interaction**: Querying user registers, updating `firebase_uid` matching hashes, and writing security audit records.

### 6.2 AI Insights Engine
- **Purpose**: Evaluates historical company data to flag bottlenecks.
- **Main Interface**: Interactive cards displaying machine-learned risk insights, severity levels (High, Medium, Low), and confidence percentages.
- **Actions**: Executive actions are captured via the "Rate & Record Action" modal, letting users provide comments and submit feedback.
- **Database Interaction**: Reads insights from database tables, inserts rating structures, and flags them as processed.

### 6.3 GPS Command Center
- **Purpose**: Geospatial logistics tracking.
- **Main Interface**: Map plotting active locations, speed limits, check-in radius boundaries, and on-field coordinates.
- **Actions**: Reviewing historical coordinate tracks, searching staff members, and overriding check-in exceptions.
- **Database Interaction**: Reads real-time GIS coordinates and aggregates active route tables.

### 6.4 Storage Analytics & Evidence Audit
- **Purpose**: Verifying media security.
- **Main Interface**: Graph depicting cloud storage bytes over time, detailed lists of file records with matching SHA-256 checksums and validation indicators.
- **Actions**: Running file integrity re-verifications, flagging corrupt files, and purging expired records.
- **Database Interaction**: Checks database metadata against physical objects, ensuring no tamper has occurred.

---

## 7. Button-by-Button Reference

| Button Name | Location | Primary Action | Permissions Required | Database Impact | Expected UI Result |
|---|---|---|---|---|---|
| **Run Workforce Audit** | Workforce Auth & Sync | Pulls auth logs and runs comparison checks | `SUPER_ADMIN` | Read-only check | Displays mismatch count |
| **Sync Accounts** | Workforce Auth & Sync | Commits missing accounts into database | `SUPER_ADMIN` | Updates `users` rows | Clears mismatch indicator |
| **Generate New Key** | Integration Platform | Creates random cryptographically strong API key | `SYSTEM_ADMIN` | Inserts new API key row | Renders active key string |
| **Publish Content** | Platform Content | Updates global home announcement alert | `Administrator` | Overwrites content setting | Immediate banner update |
| **Approve User** | Workforce Approvals | Transitions user status to active | `Administrator` | Sets `status` to 'ACTIVE' | User is cleared from queue |
| **Rate & Record** | AI Insights Engine | Opens insight scoring modal | `Executive` | Inserts feedback record | Insight state updates |

---

## 8. Dashboard & KPI Guide
- **Active Users KPI**: Represents total accounts cleared for operational use. Formula: `COUNT(users.id) WHERE status = 'ACTIVE'`.
- **SLA Breach Threshold**: Evaluates average duration from task assignment to completion. Alert triggers when execution duration exceeds defined template hours.
- **Cryptographic Health Score**: Percentage of verified file hashes. Calculation: `(COUNT(verified_evidence) / COUNT(total_evidence)) * 100`.

---

## 9. Administrative Workflows

### 9.1 Onboarding and Account Approval Workflow
1. **User Registration**: Guest registers via portal, defining preferred department and role.
2. **Review State**: Account status is marked as `PENDING_APPROVAL`.
3. **Queue Notification**: Administrator receives a notification.
4. **Approve Action**: Administrator opens **Workforce Approvals**, reviews details, and clicks **Approve**. Status moves to `ACTIVE`.

### 9.2 API Key Generation Workflow
1. Navigate to **Integration Platform** -> **API Keys Config**.
2. Click **Generate New API Key**.
3. Provide label context, set permission scopes, and click **Create**.
4. Copy the unique string; key is encrypted and stored in PostgreSQL database.

---

## 10. Search, Filters & Tables
- **Advanced Filtering**: All core tabular listings in the EACC (User Directory, Report Approvals, and Sync logs) feature a permanent top filter bar. Users can filter by Department, Role, and Status.
- **Dynamic Search**: Instant filter updates matching string prefixes against table name columns.

---

## 11. Security Responsibilities
Administrators must govern carefully:
- **Least Privilege Enforcement**: Ensure supervisors are assigned to limited department roles.
- **Key Rotation**: API keys should be rotated every 90 days.
- **Integrity Validation**: Run the manual Evidence Audit loop weekly to identify physical media tamper events.

---

## 12. Troubleshooting Guide
- **Sync Failure (Database Locked)**: Occurs during high-volume database transactions. *Solution*: Wait 60 seconds and click **Sync Accounts** again.
- **Map Loading Issues**: Ensure geolocation permissions are granted on the browser, and verify target user speed tracking is enabled on their device.

---

## 13. Best Practices
- Execute an **Administrative Audit Verification check** daily.
- Review AI-generated insights every morning to address potential operational delays.
- Clear inactive webhooks to keep logging tables performant.

---

## 14. Frequently Asked Questions (FAQ)

#### Q: Can a Manager access the EACC?
**A**: No. EACC access is strictly limited to `SUPER_ADMIN`, `SYSTEM_ADMIN`, `Administrator`, and `Executive`.

#### Q: How is the Storage Analytics data populated?
**A**: Storage data is analyzed dynamically by scanning physical file extensions and computing cumulative bytes directly from metadata.

---

## 15. Conclusion
With this manual as a guide, system administrators can maintain complete authority, security alignment, and perfect operating precision over the Supervisor Eye Enterprise Platform.
