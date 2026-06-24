# Supervisor Eye: Deployment Guide & Architecture System Maps

This document contains full deployment instructions, configuration settings, microservice network architectural maps, and database entity relationship descriptors (ERD) for the **Supervisor Eye** enterprise platform.

---

## 1. Technical Stack Overview

*   **Front-End Framework:** React 18+ powered by Vite (Client build folder: `/dist`).
*   **Styling Engine:** Tailwind CSS utilizing high contrast aesthetic presets and custom typographies (Inter, JetBrains Mono).
*   **Back-End Engine:** Node.js Express server running safe TypeScript compilation structures.
*   **Database Management:** PostgreSQL relational engine driven by Drizzle ORM layout configurations.
*   **User Identity Platform:** Firebase Authentication.
*   **Analytics Engine:** Recharts charting visualizers.

---

## 2. System Architecture Map

```
                     ┌─────────────────────────────────┐
                     │          Client Browser         │
                     │  (Vite React Single Page App)   │
                     └────────────────┬────────────────┘
                                      │
                                      │ Web Traffic (React components, Recharts visualizations)
                                      ▼
                     ┌─────────────────────────────────┐
                     │          Nginx Ingress          │
                     │     Configured to Port 3000     │
                     └────────────────┬────────────────┘
                                      │
                                      │ Reverse Proxied Requests
                                      ▼
                     ┌─────────────────────────────────┐
                     │      Express Backend Server     │
                     │          (Node.js / tsx)        │
                     └──────┬───────────────────┬──────┘
                            │                   │
                            │ verifyToken Check │ Query Execution via Drizzle
                            ▼                   ▼
                     ┌──────────────┐   ┌──────────────┐
                     │ Firebase Auth│   │  Cloud SQL   │
                     │     SDK      │   │ (PostgreSQL) │
                     └──────────────┘   └──────────────┘
```

---

## 3. Database Entity Relationship Diagram (ERD)

The relational engine maps dependencies sequentially across several tables to isolate data operations.

### Entities and Attributes

#### `users` (Core Identity Entity)
*   `id` (UUID, Primary Key): Unique platform identification.
*   `email` (Text, Unique): Auth claim login email.
*   `role` (Text, default: `'EXECUTIVE'`): User functional execution role.
*   `createdAt` / `updatedAt` (Timestamp)

#### `ai_insights` (System Anomaly Log)
*   `id` (UUID, Primary Key): System tracking ID.
*   `title` (Text): Short descriptive summary.
*   `description` (Text): In-depth discovery description.
*   `type` (InsightTypeEnum: `RISK`, `TREND`, `ANOMALY`, `RECOMMENDATION`).
*   `confidence` (Integer: 1-100 score).
*   `recommendedAction` (Text): Suggested system triage steps.
*   `sourceData` (JSONB): Underlying metrics metadata.
*   `feedbackStatus` (InsightFeedbackStatusEnum: `USEFUL`, `NOT_USEFUL`, `INVESTIGATING`, `DISMISSED`).
*   `createdAt` (Timestamp)

#### `ai_insight_feedback` (Closed-Loop Review Ledger)
*   `id` (UUID, Primary Key): Feedback instance identifier.
*   `insightId` (UUID, Foreign Key -> `ai_insights.id`): Back-linked insight.
*   `executiveId` (UUID, Foreign Key -> `users.id`): Reviewer.
*   `status` (InsightFeedbackStatusEnum): Target rating status.
*   `comments` (Text): Qualitative review notes.
*   `actionTaken` (Text): Follow-up action description.
*   `createdAt` / `updatedAt` (Timestamp)

#### `audit_logs` (System Records)
*   `id` (UUID, Primary Key)
*   `userId` (UUID, Foreign Key -> `users.id`): Active execution agent.
*   `action` (Text): Operation label.
*   `ipAddress` (Text): Client hostname IP.
*   `metadata` (JSONB): Execution details.
*   `createdAt` (Timestamp)

---

## 4. Deployment Verification Checklist

Execute these installation requirements sequentially.

### Step 4.1: Environment Configurations
Never distribute raw keys. Declare all required parameters in your server-side environment variables using a protected configuration wrapper. Validate `.env` compliance:
```env
# Database Connection URL
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require

# Firebase Core Settings
FIREBASE_PROJECT_ID=supervisor-eye-prod
FIREBASE_CLIENT_EMAIL=admin@supervisor-eye-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Step 4.2: Running Database Migrations
Validate your schema configuration is in sync with Drizzle ORM before running builds:
```bash
# Push schema updates safely to Cloud SQL Postgres
npx drizzle-kit push
```

### Step 4.3: Compiling for Production Release
Execute the compiler script from clean states:
```bash
# Compile client components and pack server entrypoints
npm run build
```

Verify that static build results are populated inside the `/dist` directory. The production deployment is now ready for deployment onto Cloud Run containers.
