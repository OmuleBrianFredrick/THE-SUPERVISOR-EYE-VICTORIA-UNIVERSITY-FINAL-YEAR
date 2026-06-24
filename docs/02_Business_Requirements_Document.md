# Business Requirements Document (BRD)
**Project:** SUPERVISOR EYE
**Client:** Movit Group of Companies

## 1. System Objectives
**SUPERVISOR EYE** aims to create an immutable, transparent, and highly efficient hierarchical reporting ecosystem. The system will bridge the visibility gap between Movit's executive leadership and its large, distributed workforce (specifically field sales and operations) by enforcing evidence-based accountability.

## 2. Business Goals
1.  **Eliminate Fraudulent Reporting:** Ensure 100% of submitted field and task reports are backed by verified, tamper-proof location and time data.
2.  **Accelerate Information Flow:** Reduce the time it takes for field intelligence to reach executive dashboards from days/weeks to near real-time.
3.  **Optimize Workforce Productivity:** Increase daily field visits and task completion rates by 25% through strict accountability and active supervision.
4.  **Standardize Reporting Standards:** Replace fragmented communication (e.g., WhatsApp, physical localized logbooks) with a single unified corporate standard.
5.  **Enable Data-Backed Performance Appraisals:** Tie employee KPIs, bonuses, and reviews to irrefutable system data.

## 3. Key Performance Indicators (KPIs)
*   **System Adoption Rate:** Percentage of targeted Movit employees actively logging in daily (Target: 95%+).
*   **Report Verification Rate:** Percentage of reports submitted with valid GPS and photographic evidence.
*   **Supervisor Action Time:** Average time taken by a supervisor to approve/reject a subordinate's report (Target: < 24 hours).
*   **Route Compliance:** Measuring planned field territory routes versus actual tracked routes.
*   **Data Latency:** Time delay between data capture in the field and its availability on Executive dashboards (Target: < 5 minutes).

## 4. Business Requirements
*   **BR-01:** The system must strictly reflect Movit’s hierarchical organizational chart.
*   **BR-02:** All remote and field-based reports must require cryptographic or metadata-verified evidence (GPS coordinates, live timestamps, untampered photos).
*   **BR-03:** The system must enforce a review and approval chain where lower-level reports cannot bypass immediate supervisors unless escalated by SLA rules.
*   **BR-04:** The solution must be isolated and proprietary to Movit Group of Companies, ensuring data sovereignty and confidentiality.

## 5. Functional Requirements
*   **FR-01 (Authentication & Roles):** The system shall authenticate users via secure login and dynamically assign permissions based on their Movit organizational role.
*   **FR-02 (Geospatial Tagging):** Actions such as "Check-in", "Check-out", and "Submit Report" shall automatically capture the user's live GPS location.
*   **FR-03 (Media Capture):** The system shall allow in-app image capture via device camera. Uploading pre-existing photos from the gallery must be disabled or strictly flagged to prevent spoofing.
*   **FR-04 (Hierarchical Approvals):** The system shall push submitted reports to a designated supervisor's queue. Supervisors can "Approve," "Reject with Comments," or "Request Revision."
*   **FR-05 (Dynamic Form Builder):** Administrators shall be able to create custom reporting templates (e.g., Merchandising Report, Distributor Audit, Promo Activation Form) deployed selectively to specific teams.
*   **FR-06 (Automated Roll-Up):** The system shall automatically aggregate approved daily metrics into weekly and monthly consolidated views for upper management.

## 6. Non-Functional Requirements
*   **NFR-01 (Offline Capability):** The mobile interface for field staff must allow offline data capture, queuing reports and media locally until an internet connection is established. (Crucial for remote African geographies).
*   **NFR-02 (Performance):** Dashboards handling aggregated data for thousands of employees must load within 3 seconds.
*   **NFR-03 (Scalability):** The architecture must support up to 10,000 concurrent users without degradation.
*   **NFR-04 (Security & Audit):** Every action (login, submission, approval, location capture) must be written to an immutable audit ledger.
*   **NFR-05 (Battery Efficiency):** Background location tracking (if utilized) must be optimized to not drain field workers' mobile devices excessively.

## 7. User Requirements
*   **UR-01:** Field agents require a frictionless, mobile-first interface that demands less than 2 minutes to submit a location-verified report.
*   **UR-02:** Supervisors require "at-a-glance" views of their team’s status, highlighting overdue reports or location discrepancies.
*   **UR-03:** Executives require high-level graphical dashboards showing compliance rates, territory coverage maps, and departmental performance indices without needing to look at individual raw reports.
