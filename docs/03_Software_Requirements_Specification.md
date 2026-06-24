# Software Requirements Specification (SRS)
**Project:** SUPERVISOR EYE
**Client:** Movit Group of Companies

## 1. User Role Analysis

### 1.1 Field Sales Agent / Sales Representative / Employee (Tier 1)
*   **Responsibilities:** Execute daily assigned tasks, visit retail/distribution locations, conduct merchandising, capture market intelligence.
*   **Permissions:** Submit self-reports, view assigned tasks, view history of their own submissions, modify rejected drafts.
*   **Reporting:** Reports to Team Leader / Supervisor.
*   **Dashboard Needs:** Mobile-optimized view answering "What are my tasks today?" and "What is the status of my recent submissions (Approved/Rejected)?"

### 1.2 Team Leader / Supervisor (Tier 2)
*   **Responsibilities:** Monitor attendance and location of direct reports, review daily evidence submissions for quality and accuracy, approve/reject field reports.
*   **Permissions:** Approve/Reject Tier 1 reports, view real-time location maps of team, submit consolidated team reports to Tier 3.
*   **Reporting:** Reports to Department Manager.
*   **Dashboard Needs:** Team activity feed, pending approvals queue, map view of agents, basic compliance charts.

### 1.3 Department Manager / Head of Department (Tier 3)
*   **Responsibilities:** Oversee multiple territories/teams, evaluate weekly/monthly performance, intervene in chronic underperformance.
*   **Permissions:** View aggregated reporting data, drill down into specific supervisor teams, generate PDF/Excel exports, override supervisor decisions if necessary.
*   **Reporting:** Reports to Executive.
*   **Dashboard Needs:** Weekly/Monthly trends, KPI scorecards per team, exception reporting (e.g., "Top 5 lowest performing routes").

### 1.4 Executive (C-Suite, Directors) (Tier 4)
*   **Responsibilities:** Strategic decision-making, budget allocation, overarching company performance monitoring.
*   **Permissions:** Global read-only access to all aggregated data, strategic dashboards.
*   **Reporting:** Reports to Board (out of system bounds).
*   **Dashboard Needs:** High-level analytics, national ROI mapping, compliance rate overviews, major incident tracking.

### 1.5 HR Officer
*   **Responsibilities:** Tie system compliance to payroll and appraisals.
*   **Permissions:** View systemic compliance metrics (Check-in times, absences, total approved days).
*   **Dashboard Needs:** Timesheet exports, absenteeism reports, dispute resolution logs.

### 1.6 System Administrator
*   **Responsibilities:** Maintain the hierarchy, onboard offboard employees, design forms, manage organizational structure.
*   **Permissions:** Full backend access, role management, template building.

---

## 2. Business Workflow Analysis

### 2.1 Current Workflow (Problematic)
1.  **Employee** visits a store. Takes a photo. Sends it to a WhatsApp group at the end of the day.
2.  **Supervisor** scrolls through hundreds of WhatsApp images, trying to match them to a spreadsheet. Approves verbally or via text.
3.  **Manager** relies on the Supervisor's manual weekly Excel summary, hoping the data is accurate.
4.  **Executive** receives a lag-heavy PowerPoint presentation 15 days after the month ends. 

### 2.2 Proposed Workflow (Supervisor Eye)
1.  **Employee** arrives at store. Opens App. Clicks "Check-In". App locks GPS coordinates. Completes task, takes live photo via App. Clicks "Submit".
2.  **System** instantly routes the verifiable report to the designated Supervisor's queue.
3.  **Supervisor** receives push notification. Opens App. Reviews GPS map and photo. Clicks "Approve".
4.  **Manager** dashboard automatically updates. The aggregate completion metric ticks up from 88% to 89%.
5.  **Executive** dashboard reflects real-time national coverage. 

---

## 3. Use Case Analysis

### 3.1 High-Level Use Cases
1.  **UC-01:** Submit Verifiable Field Report
2.  **UC-02:** Review and Approve Subordinate Report
3.  **UC-03:** Monitor Real-time Fleet/Staff location
4.  **UC-04:** Generate Aggregated Departmental Summary
5.  **UC-05:** Configure Organizational Hierarchy

### 3.2 Detailed Use Cases & User Stories

**UC-01: Submit Verifiable Field Report**
*   **Actor:** Field Sales Agent
*   **Pre-condition:** User is logged in within working hours.
*   **Trigger:** User arrives at a target retail location.
*   **Main Success Scenario:** User opens task. Prompts camera. Takes photo of Movit product display. System affixes Lat/Long and UTC timestamp. User adds text notes. Submits. State changes to "Pending Supervisor Review."
*   **User Story:** *As a Field Agent, I want to capture photos directly within the app so that my visits are irrefutably logged and I get credited for my hard work.*

**UC-02: Review and Approve Subordinate Report**
*   **Actor:** Supervisor
*   **Trigger:** System notification regarding a pending report.
*   **Main Success Scenario:** Supervisor opens report. Sees GPS pin mapped against expected location. Views photo. Reads notes. Clicks "Approve."
*   **Alternative Path:** Photo is blurry or GPS is 5km away from the store. Supervisor clicks "Reject", requiring mandatory text feedback.
*   **User Story:** *As a Supervisor, I want to see the geographical location of submitted reports on a map, so I can ensure my team is actually in their assigned territories.*

---

## 4. Reporting Framework

*   **Daily Activity Reports:** Micro-reports generated by Tier 1. Focus on immediate tasks (Stock counts, competitor analysis, display building). Contains granular evidence.
*   **Weekly Roll-Ups:** Auto-generated summaries for Tier 2 to present to Tier 3. Highlights compliance percentages, total visits vs target, and outstanding rejections.
*   **Monthly Departmental Scorecards:** Macro-reports for Tier 3 and HR. Evaluates entire units on efficiency, SLA adherence (time to approve), and productivity metrics.
*   **Exception/Alert Reports:** Real-time triggers sent to Management if an employee attempts to spoof GPS, or if a supervisor fails to approve reports within 48 hours.
