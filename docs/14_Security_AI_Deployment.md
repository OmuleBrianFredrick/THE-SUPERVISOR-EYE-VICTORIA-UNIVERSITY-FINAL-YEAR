# Supervisor Eye: Security & AI Architecture
**Client:** Movit Group of Companies

## 1. Security Architecture

### Authentication & Authorization
*   **Identity Provider:** Firebase Authentication (handles password hashing, secure token generation).
*   **Access Control:** Strict Role-Based Access Control (RBAC). The API middleware verifies the JWT and cross-references the user's `role_id` and `department_id` in the database to ensure they cannot query data outside their purview.

### Data Protection
*   **In Transit:** All communications over TLS 1.3 (HTTPS).
*   **At Rest:** PostgreSQL databases encrypted using Cloud provider (GCP KMS) defaults. Cloud Storage buckets for evidence media are set to PRIVATE, requiring signed URLs valid for short durations (e.g., 15 mins) to view images.

### GPS & Evidence Integrity (Anti-Spoofing)
*   **Camera Restrictions:** App only allows real-time photo capture. Gallery selection is disabled.
*   **Metadata Validation:** Backend cross-checks EXIF data (if available) and system capture timestamps against server reception times to flag delayed manipulations.
*   **Location Fencing:** Reports submitted outside an acceptable radius (e.g., > 500m) from the target task location are automatically flagged for manager review.

### Audit & Compliance
*   Append-only `audit_logs` table tracking every critical state change.

## 2. AI Architecture (Gemini Integration)

### Core Capabilities
*   **Smart Summarization:** Managers overseeing 50+ agents cannot read every report note. Gemini processes the week's text notes and identifies recurring themes (e.g., "30% of agents in Western region reported stockouts for Radiant lotion").
*   **Risk Detection:** Analyzing text sentiment and patterns for potential fraud or compliance risks.
*   **Executive Briefings:** Every Monday at 06:00 AM, Gemini digests the entire database's weekly metrics and auto-generates a 3-paragraph "State of Field Operations" narrative for the C-Suite.

### Data Flow & Workflow
1.  CRON Job fires at end-of-week.
2.  Node.js service compiles an anonymized JSON payload containing relevant report notes, KPIs, and completion rates.
3.  Payload is injected into a strict system prompt (e.g., "Act as a Movit Regional Director. Analyze the following field data...").
4.  Request sent to Google Gemini Pro API.
5.  Response parsed and stored in `ai_insights` table.
6.  Executive logs in and sees the newly generated Briefing Card.

### AI Security Considerations
*   **No PII in Prompts:** Employee names, phone numbers, and explicit locations are hashed or stripped before sending context to the LLM. Only aggregated data and specific task notes are analyzed.

## 3. Deployment Blueprint

### Environments
*   `DEV`: Sandbox for active development.
*   `STAGING`: Exact replica of Production for the Movit team to perform UAT.
*   `PRODUCTION`: Live environment.

### Hosting (GCP Preferred)
*   **Frontend (Web):** Firebase Hosting or Cloud Run.
*   **Backend (API):** Google Cloud Run (Containerized Node.js, auto-scaling).
*   **Database:** Google Cloud SQL for PostgreSQL (High Availability setup).
*   **Media Storage:** Google Cloud Storage.

## 4. UML Specification Package (Summary)
*   **Use Case Diagram:** Actors (Agent, Supervisor, Exec, Admin) connected to Use Cases (Submit Report, Approve Report, View Dashboard, Manage Users).
*   **ERD:** Diagramming the schema listed in the Database Architecture document.
*   **Sequence Diagram (Report Submission):** App -> API -> Verify GPS -> Save Photo to Bucket -> Save DB Record -> Trigger Notification -> Supervisor App.
*   **Activity Diagram (Approval Process):** Start -> Review Evidence -> [Valid?] -> (Yes) Approve & Aggregate Data -> (No) Reject & Request Update -> End.
