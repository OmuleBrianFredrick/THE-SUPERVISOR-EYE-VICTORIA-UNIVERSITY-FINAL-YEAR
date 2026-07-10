# Supervisor Eye Enterprise Platform (v2.1)
## Enterprise User Manual: Role-Based Operational Guide

This document is the official Enterprise User Manual for the **Supervisor Eye Enterprise Platform (Version 2.1)**. It serves as a comprehensive operational guide for all authorized platform roles within the enterprise ecosystem.

---

## 1. Introduction
The **Supervisor Eye Enterprise Platform** is a secure, high-integrity field-staff monitoring, reporting, and intelligence system. Designed for enterprise-scale deployments, the platform ensures that operational metrics, field activities, and evidence-gathering workflows are tracked with cryptographic integrity, verified through robust administrative audits, and managed through strict Role-Based Access Control (RBAC).

This manual serves as a definitive reference for all user roles, outlining operational workflows, permission boundaries, security responsibilities, and step-by-step UI guidelines.

---

## 2. Purpose of the System
The core business objectives of the Supervisor Eye Enterprise Platform are:
1. **Compliance and Accountability**: To verify field-staff execution through geographic (GPS) and cryptographic media evidence.
2. **Operational Continuity**: To ensure that tasks flow seamlessly from creation to assignment, execution, and validation.
3. **Decentralized Auditability**: To maintain a tamper-evident audit ledger matching field evidence against PostgreSQL and secure cloud structures.
4. **Closed-Loop Intelligence**: To leverage advanced AI analytics to identify anomalies, evaluate department health, and trigger remedial workflows.

---

## 3. Enterprise Role Hierarchy
The platform enforces a strict, hierarchical RBAC model. Below is the authority structure from the highest administrative capabilities to the lowest operational level:

```
                  ┌─────────────────────────────────┐
                  │           SUPER_ADMIN           │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │          SYSTEM_ADMIN           │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │          Administrator          │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │            Executive            │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │             Manager             │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │           Supervisor            │
                  └────────────────┬────────────────┘
                                   │
                  ┌────────────────▼────────────────┐
                  │           Field Staff           │
                  └─────────────────────────────────┘
```

---

## 4. Authentication Overview
Supervisor Eye uses Firebase Authentication paired with a local PostgreSQL profile register:
- **Secure Portal Entry**: Accessible via the HTTPS landing page. Users input credentials (email and password).
- **Session Tokens**: Handled via cryptographically signed Firebase ID tokens, passed via HTTP headers and verified on the server.
- **Audit Verification**: A dedicated **Workforce Auth & Sync** routine runs in the background to ensure that active PostgreSQL user records match their corresponding Firebase Authentication profiles.

---

## 5. Complete Role-Based User Guides

### 5.1 ROLE: SUPER_ADMIN

#### 1. Role Overview
- **Purpose**: The absolute peak of authority in the enterprise.
- **Position**: Global platform owner, security auditor, and system overseer.
- **Primary Responsibilities**: Direct governance of user identities, roles, systems synchronization, platform content, integration pipelines, and cryptographic auditing.

#### 2. Dashboard Access
- **Landing Page**: Enterprise Administration & Command Center (EACC) Home.
- **Dashboard Layout**: Comprehensive analytical view displaying active user count, pending approvals, total report validations, and a live Recent Activity Stream.
- **Navigation Options**: Full access to all 21 tabs in the EACC sidebar.

#### 3. Permissions
- **View**: All system data (user databases, audit logs, compliance files, GIS, GPS trackers, AI feedback).
- **Create/Edit**: System-wide global variables, content pages, user roles, API Keys, webhooks.
- **Approve/Reject**: Manual workforce sync requests, pending user accounts, and critical operational escalations.
- **Delete/Configure**: Full configuration controls of all approval chains and escalations.

#### 4. Daily Workflow
1. Log in via Secure Portal.
2. Review EACC Overview for system-wide performance anomalies.
3. Navigate to **Workforce Auth & Sync** to verify account alignment between SQL and Firebase.
4. Triage pending users in **Workforce Approvals**.
5. Check **Administrative Audit Panel** for unauthorized system updates.
6. Verify cryptographic integrity via **Evidence Audit**.
7. Log out securely.

#### 5. Step-by-Step User Guide
- **Performing a Manual Workforce Sync**:
  1. Open the EACC and click **Workforce Auth & Sync**.
  2. Click **Run Workforce Remediation Audit**.
  3. Review mismatched records and click **Sync Accounts**.
- **Managing User Directory**:
  1. Open the **User Directory** tab.
  2. Select any user, click **Edit**, modify their role/department, and click **Save**.

#### 6. Notifications
- **Received**: Root-level alerts (failed sync logs, unauthenticated API calls, manual audit breaches).
- **Triggers**: Security violations, SLA failures, system restarts.
- **Expected Actions**: Immediate remediation, key rotation, or direct administrative override.

#### 7. Reports
- **View/Generate**: Comprehensive audit summaries, system-wide compliance logs, database transaction logs.

#### 8. Enterprise Workflows
- Triggers and completes the **User Approval Workflow** and **Workforce Sync Workflow**.

#### 9. Security Responsibilities
- Must enforce strict MFA, audit active API keys, and maintain key privacy.

#### 10. Best Practices
- Never share the SUPER_ADMIN account; always run manual auth checks daily.

#### 11. Common Mistakes
- Overlooking pending approvals, resulting in onboarding bottlenecks.

---

### 5.2 ROLE: SYSTEM_ADMIN

#### 1. Role Overview
- **Purpose**: Managing platform infrastructure, integration environments, and IT governance.
- **Position**: Infrastructure Management Level.
- **Primary Responsibilities**: Maintaining database health, webhooks, API keys, storage bounds, and media governance.

#### 2. Dashboard Access
- **Landing Page**: EACC Dashboard.
- **Layout**: Focus on infrastructure logs, storage analytics, and API status charts.
- **Navigation Options**: IT-focused tabs (API Keys, Storage Analytics, Media Governance, Compliance Center).

#### 3. Permissions
- **View**: Storage, API metrics, logs, user roles.
- **Create**: Webhooks, API keys, data exports.
- **Configure**: Integration routes, media compression policies, and active GIS data overlays.

#### 4. Daily Workflow
1. Log in and access EACC.
2. Review **Storage Analytics** for cloud bucket utilization and media bloat.
3. Check **Integration Platform** webhook logs for delivery failures.
4. Review active API keys in **API Keys Config**.
5. Log out.

#### 5. Step-by-Step User Guide
- **Creating a New API Key**:
  1. Go to **Integration Platform** -> **API Keys**.
  2. Click **Generate New Key**.
  3. Set label and scopes, and click **Submit**.
- **Toggling a Webhook**:
  1. Go to **Integration Platform** -> **Webhooks**.
  2. Locate the target webhook and toggle the active switch.

#### 6. Notifications
- **Received**: Server-side failures, webhook timeout events, database storage alerts.
- **Triggers**: Integration errors, file upload failures.
- **Expected Actions**: Restarting endpoints, updating webhook endpoints, clearing disk space.

#### 7. Reports
- **View/Generate**: Storage usage metrics, webhooks response rates, API latency analytics.

#### 8. Enterprise Workflows
- Integrates systems during the **Integration Workflow**.

#### 9. Security Responsibilities
- Revoking inactive keys and verifying webhook target SSL validity.

#### 10. Best Practices
- Regularly audit API scopes to prevent over-privileged data flows.

#### 11. Common Mistakes
- Leaving expired webhooks active, polluting the system logs.

---

### 5.3 ROLE: Administrator

#### 1. Role Overview
- **Purpose**: General operational administrator.
- **Position**: Operational Governance Level.
- **Primary Responsibilities**: Onboarding personnel, configuring task templates, routing department workflows, and monitoring general compliance.

#### 2. Dashboard Access
- **Landing Page**: Operational Command Dashboard.
- **Layout**: Administrative overview of department statistics and pending reviews.
- **Navigation**: Access to EACC tabs (User Directory, Report Approvals, Workforce Approvals).

#### 3. Permissions
- **View/Edit**: Department profiles, workforce rosters, report structures.
- **Approve**: User registrations, operational workflow updates.

#### 4. Daily Workflow
1. Access the platform.
2. Triage newly registered personnel.
3. Update homepage system alerts/banners to reflect operational shifts.
4. Verify department SLA performance.
5. Exit.

#### 5. Step-by-Step User Guide
- **Approving a Pending User**:
  1. Open EACC and go to **Workforce Approvals**.
  2. Click **Approve** on the requested profile.
- **Editing Homepage Content**:
  1. Go to **Platform Content**.
  2. Update the system warning message and click **Publish Content**.

#### 6. Notifications
- **Received**: New user registrations, pending department reports.
- **Expected Actions**: Rapid review and approval.

#### 7. Reports
- **View/Generate**: User directories, onboarding logs, department compliance averages.

#### 8. Enterprise Workflows
- Active participant in the **User Onboarding & Approval Workflow**.

#### 9. Security Responsibilities
- Correct allocation of role types during user onboarding.

#### 10. Best Practices
- Review pending staff on a set schedule twice daily.

#### 11. Common Mistakes
- Assigning incorrect departments to supervisors, leading to routing errors.

---

### 5.4 ROLE: Executive

#### 1. Role Overview
- **Purpose**: Strategic executive oversight.
- **Position**: Corporate Command and Strategy level (e.g., CEO, Directors).
- **Primary Responsibilities**: Analyzing overall organization performance, monitoring operational risks, reading AI-driven intelligence briefings, and evaluating regional check-ins.

#### 2. Dashboard Access
- **Landing Page**: Executive Control Dashboard.
- **Layout**: High-impact charts showing Organizational Health, AI Insights, GPS Command Center tracking, and Department Performance.
- **Navigation**: Access to EACC tabs (Executive Intelligence, Organizational Health, AI Insights Engine, GPS Command Center).

#### 3. Permissions
- **View**: All executive reports, GIS layers, employee locations, automated trend briefings, and AI insights.
- **Create**: Rating feedback, custom tracking variables, escalation requests.

#### 4. Daily Workflow
1. Log in.
2. Review **Executive Intelligence** dashboards for organization-wide performance.
3. Analyze **AI Insights Engine** for automated risk highlights.
4. Rate and leave action notes on at least 3 AI insights.
5. Check the live **GPS Command Center** map for field spatial density.
6. Log out.

#### 5. Step-by-Step User Guide
- **Recording Feedback on AI Insights**:
  1. Go to **AI Insights Engine**.
  2. Click on a specific insight card.
  3. Click **Rate & Record Action**.
  4. Write comments, choose rating (e.g., Useful), and click **Submit**.
- **Reviewing Department Health**:
  1. Open **Organizational Health** or **Department Intelligence**.
  2. Filter by department to review SLA achievement trends.

#### 6. Notifications
- **Received**: Critical compliance warnings, high-risk operational anomalies.
- **Expected Actions**: Action allocation and strategic escalation.

#### 7. Reports
- **View**: AI trend briefings, risk matrices, company-wide executive performance scorecards.

#### 8. Enterprise Workflows
- Controls the **Executive Intelligence Workflow** and closes the loop via **AI Insight Feedback**.

#### 9. Security Responsibilities
- High-level data confidentiality; preventing leaks of operational metrics.

#### 10. Best Practices
- Use AI insights daily to identify underlying field staff performance drifts.

#### 11. Common Mistakes
- Ignoring negative feedback loop indicators in the AI Feedback Center.

---

### 5.5 ROLE: Manager

#### 1. Role Overview
- **Purpose**: Mid-level operational management.
- **Position**: Departmental/Divisional management.
- **Primary Responsibilities**: Department oversight, task scheduling, evidence review, and report approval.

#### 2. Dashboard Access
- **Landing Page**: Management Dashboard.
- **Layout**: Summary cards for department tasks, reports pending approval, and supervisor activity stream.
- **Navigation**: Core task lists, evidence lists, and report approvals.

#### 3. Permissions
- **View/Create**: Tasks for their department, report outlines, department personnel.
- **Approve/Reject**: Field reports, check-in exceptions, evidence files.

#### 4. Daily Workflow
1. Log in and view the Management Dashboard.
2. Review pending department reports in the **Report Approvals** tab.
3. Check supervisor activity logs.
4. Review task completion rates and outstanding SLAs.
5. Log out.

#### 5. Step-by-Step User Guide
- **Approving/Rejecting a Field Report**:
  1. Open the **Report Approvals** portal.
  2. Select a submitted report.
  3. Review the data, comments, and attached evidence.
  4. Click **Approve** or click **Reject** (requiring reason comments).

#### 6. Notifications
- **Received**: Task completions, reports submitted for management review.
- **Expected Actions**: Approving reports within the SLA threshold.

#### 7. Reports
- **View/Generate**: Departmental task logs, evidence lists, average approval latency trackers.

#### 8. Enterprise Workflows
- Crucial milestone in the **Report Approval Workflow**.

#### 9. Security Responsibilities
- Thoroughly verify the validity of attached evidence before approving a report.

#### 10. Best Practices
- Never approve reports with missing or invalid evidence.

#### 11. Common Mistakes
- Blind approvals without checking cryptographic hash validation status.

---

### 5.6 ROLE: Supervisor

#### 1. Role Overview
- **Purpose**: On-ground/Direct field supervision.
- **Position**: Tactical/Front-line management.
- **Primary Responsibilities**: Direct supervision of Field Staff, assignment of specific operational tasks, first-level report reviews, and field validation.

#### 2. Dashboard Access
- **Landing Page**: Supervisory Command Dashboard.
- **Layout**: Maps tracking local field staff, task progress lists, and immediate check-in logs.
- **Navigation**: Task Management, Check-In Verification, Evidence Review.

#### 3. Permissions
- **View**: Assigned Field Staff, local GPS tracks, uploaded evidence files.
- **Create**: Dynamic tasks, check-in instructions.
- **Approve**: First-level field reviews, check-in overrides.

#### 4. Daily Workflow
1. Access the platform.
2. Review the list of assigned on-ground staff.
3. Check and distribute the daily task assignments.
4. Monitor GPS coordinates of active personnel.
5. Review submitted field data.
6. Submit first-level approvals.

#### 5. Step-by-Step User Guide
- **Creating and Assigning a Task**:
  1. Open **Task Management** and click **Create Task**.
  2. Set the Title, Description, Department, Priority, and Due Date.
  3. Select an active Field Staff member and click **Assign**.

#### 6. Notifications
- **Received**: Check-in events, task status updates, evidence uploads.
- **Expected Actions**: On-site validation and task direction.

#### 7. Reports
- **View**: Staff performance scores, task timelines.

#### 8. Enterprise Workflows
- Key initiator of the **Task Creation Workflow** and first-level **Report Review Workflow**.

#### 9. Security Responsibilities
- Actively verify that staff are physically present at coordinates during check-ins.

#### 10. Best Practices
- Use GPS breadcrumbs to monitor field route completion.

#### 11. Common Mistakes
- Assigning duplicate tasks to the same staff member simultaneously.

---

### 5.7 ROLE: Field Staff

#### 1. Role Overview
- **Purpose**: Direct field execution.
- **Position**: Ground operational level.
- **Primary Responsibilities**: Complete assigned field tasks, perform GPS check-ins, record field findings, and upload high-fidelity evidence.

#### 2. Dashboard Access
- **Landing Page**: Simplified Mobile Task Center.
- **Layout**: Touch-optimized list of today's tasks, active check-in buttons, and direct file upload controls.
- **Navigation**: Task list, check-in panel, upload portal, and local notifications.

#### 3. Permissions
- **View**: Assigned tasks, check-in instructions.
- **Create/Submit**: Check-in records, evidence files, completed reports.

#### 4. Daily Workflow
1. Access the mobile portal at the start of shift.
2. Select the first assigned task from the dashboard.
3. Perform the **GPS Check-in** at the designated site.
4. Execute the assigned ground operations.
5. Capture and upload the required media/evidence files.
6. Fill out the task completion report and submit.
7. Repeat for all daily tasks.
8. Log out at the end of the shift.

#### 5. Step-by-Step User Guide
- **Performing a GPS Check-in & Submitting Evidence**:
  1. Tap on the active task on your dashboard.
  2. Click **GPS Check-in** (allow location permissions when prompted).
  3. Tap **Upload Evidence** and select the image/video from your device camera.
  4. Fill out the text report notes.
  5. Tap **Submit Report**.

#### 6. Notifications
- **Received**: New task assignments, supervisor comments, rejection notices.
- **Expected Actions**: Immediate task execution or task remediation.

#### 7. Reports
- **Submit**: Task execution summaries and location reports.

#### 8. Enterprise Workflows
- Launches the **Field Execution Workflow**, **GPS Check-in Workflow**, and **Evidence Capture Workflow**.

#### 9. Security Responsibilities
- Safeguarding credentials and ensuring accurate GPS tracking (no location spoofing).

#### 10. Best Practices
- Upload evidence immediately upon capturing to maintain accurate timestamps.

#### 11. Common Mistakes
- Submitting reports without verifying that the media file successfully completed upload.

---

## 6. Enterprise Workflow Participation by Role
| Workflow | Initiated By | Reviewed By | Approved By | System Actions |
|---|---|---|---|---|
| **User Onboarding** | Guest (Register) | Supervisor | Manager / Admin | Synchronizes with Firebase Auth |
| **Task Lifecycle** | Supervisor / Mgr | N/A | Manager | Generates SLA metrics |
| **Evidence Audit** | Field Staff | Supervisor | Manager / Admin | Performs SHA-256 integrity checks |
| **AI closed-loop** | System Engine | N/A | Executive | Aggregates feedback metrics |

---

## 7. Security Guidelines
- **Zero Exposure Policy**: Secret keys must remain server-side.
- **Token Integrity**: Standard auth expiration is enforced; re-authentication is mandatory after session termination.
- **Audit Logs**: Any status change, registration, approval, or sync trigger creates an immutable row in the PostgreSQL Audit ledger.

---

## 8. Best Practices
- Execute weekly authentication syncs via the EACC to maintain database integrity.
- Define precise role constraints during the onboarding process.
- Mandate high-contrast, responsive visual designs for mobile staff to avoid ground operational friction.

---

## 9. Frequently Asked Questions (FAQ)

#### Q: How is user location validated?
**A**: Location is pulled dynamically from the user's mobile browser geolocation API during active check-in events and cross-checked on the backend.

#### Q: What happens if an image is tampered with?
**A**: The Evidence Audit Center flags any discrepancies by matching database hashes with secure files; a validation fail badge is displayed immediately.

---

## 10. Troubleshooting Guide
- **Session Expired Error**: Log out of the system, clear browser cookies, and log in fresh to refresh Firebase tokens.
- **Location Permission Denied**: Go to your browser site settings, locate the Supervisor Eye domain, and toggle location permissions to "Allow".

---

## 11. Conclusion
By adhering strictly to this Enterprise User Manual, operators at every level of the Supervisor Eye platform can maintain high operational velocity, absolute accountability, and perfect security alignment.
