# Supervisor Eye: Enterprise System Architecture
**Client:** Movit Group of Companies

## 1. High-Level Architecture
SUPERVISOR EYE will employ a modern, cloud-native N-tier architecture to ensure scalability, security, and high availability.
- **Client Tier:** React Web Application (Desktop/Admin) and React Native Application (Mobile/Field).
- **API/Application Tier:** Node.js / Express backend offering RESTful APIs, deployed in containerized environments (Google Cloud Run).
- **Data Tier:** PostgreSQL (Cloud SQL) for relational data and transactional integrity, coupled with Firebase Cloud Storage for media assets (images, signatures) and Firebase Authentication for secure IAM.
- **AI/Analytics Tier:** Google Cloud Vertex AI (Gemini) for report summarization and predictive analytics.

## 2. Component Architecture
1. **Web Portal (Frontend):** React.js, Tailwind CSS, Vite. Used by Supervisors, Managers, Executives, and Admins.
2. **Mobile App (Frontend):** React Native (Expo) with SQLite/WatermelonDB for offline-first capabilities. Used by Field Sales Agents.
3. **API Gateway & Routing:** Express.js router handling versioning, rate limiting, and CORS.
4. **Service Layer (Backend):** Business logic, workflow rules engine, and AI coordination.
5. **Data Access Layer (Backend):** Drizzle ORM connecting to PostgreSQL.
6. **Background Workers (Backend):** Scheduled cron jobs for daily rollups, AI batch processing, and notification dispatch.

## 3. Layered Architecture (Backend)
- **Controllers:** Handle HTTP requests, validate input schemas (Zod).
- **Services:** Execute business logic (e.g., verifying GPS bounds, routing approvals).
- **Repositories:** Abstract database operations (ORM queries).
- **Integrations:** External services (Firebase Auth admin, Gemini API, Mailgun/Sendgrid).

## 4. Data Flow Architecture
1. **Report Submission:** Mobile App -> Captures Data, GPS, Photo -> Local DB -> Syncs to API -> API validates media and GPS -> Stores media in Cloud Storage -> Stores record in PostgreSQL -> Emits 'ReportSubmitted' event.
2. **Approval Workflow:** Event triggers Notification Layer -> Push Notification (FCM) sent to Supervisor -> Supervisor reviews via Web/Mobile -> Submits decision -> Updates DB -> Triggers AI Summary Queue if approved.
3. **Analytics Sync:** Nightly CRON job aggregates daily reports -> Updates 'Executive Summaries' tables -> Caches trends in Redis (if needed) for fast Executive Dashboard loading.

## 5. Mobile Architecture Focus (React Native)
- **State Management:** Redux Toolkit or Zustand.
- **Offline Strategy:** Local SQLite database. Forms are saved locally with a 'sync_status' flag. Network listeners trigger background sync when connectivity is restored.
- **Hardware Integration:** Native Camera module (strictly capturing live imagery, disabling gallery), Background Geolocation for boundary/route tracking, Secure Keystore for JWT tokens.
