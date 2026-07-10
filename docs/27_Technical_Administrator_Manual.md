# Supervisor Eye Enterprise Platform (v2.1)
## Technical Administrator Manual: System Administration, Maintenance & Technical Operations Guide

This manual serves as the official technical reference for the **Supervisor Eye Enterprise Platform (Version 2.1)**. It provides comprehensive guidelines for system configuration, deployment, database management, security maintenance, troubleshooting, and daily operational checks.

---

## 1. Introduction
The **Supervisor Eye Enterprise Platform (v2.1)** is an enterprise-grade tracking, reporting, and intelligence system. It combines cryptographic file-hash verification, real-time geolocation tracking, and machine-learning anomaly detection. This guide serves to equip Technical Administrators, IT Operations, and Platform Engineers with the knowledge required to maintain perfect system health.

---

## 2. System Overview
Supervisor Eye is designed as a secure, full-stack, distributed platform:
- **Presentation Layer**: Built on React 18 with Vite, utilizing high-density dashboards tailored for touch targets and responsive desktop-first viewports.
- **Service Layer (Express & Node.js)**: Runs inside secure containerized environments (Cloud Run). This layer acts as the proxy keeping all API keys, database credentials, and third-party secrets isolated from the client browser.
- **Durable Storage**: Employs a dual-persistence strategy. Core structured metadata is maintained in a PostgreSQL relational database managed by Drizzle ORM, while raw unstructured assets (evidence uploads) are stored in secure cloud buckets. Authentication state is validated against Firebase Authentication.

---

## 3. Enterprise Architecture

```
 ┌────────────────────────────────────────────────────────┐
 │                   React Presentation                   │
 │                (Vite, Tailwind, lucide)                │
 └───────────┬────────────────────────────────────▲───────┘
             │                                    │
             │ JSON REST HTTP(S) / Bearer JWT     │ Auth Callback &
             │                                    │ Session State
 ┌───────────▼────────────────────────────────────┴───────┐
 │                     Express Backend                    │
 │               (Route Guards & Validation)              │
 └───────────┬────────────────┬───────────────────┬───────┘
             │                │                   │
             │ Drizzle Query  │ Firebase Admin    │ HTTP API
 ┌───────────▼────────────┐ ┌─▼─────────────────┐ ┌─▼─────────────┐
 │       PostgreSQL       │ │  Firebase Auth &  │ │  Gemini SDK   │
 │    (Relational DB)     │ │   Cloud Buckets   │ │  (AI Engine)  │
 └────────────────────────┘ └───────────────────┘ └───────────────┘
```

### Component Communication Flow:
1. **User Client Initiates Action**: The browser issues a structured REST request with a cryptographically signed Firebase Bearer JWT.
2. **Express Auth Middleware (`verifyToken`)**: Intercepts the request, decrypts the token via `firebase-admin`, retrieves user credentials, and attaches the matching `dbUser` record to the request context.
3. **Route-Level Validation**: Standard body schemas are parsed via Joi/Zod validators, blocking un-sanitized payloads.
4. **Execution and Persistence**: Database transactions are completed, file integrity checks are performed, and notification events are generated.

---

## 4. Technology Stack
The platform's technical core is built on:
- **Languages**: TypeScript (Strict-mode ESM / CJS)
- **Frontend Framework**: React 18, Vite, React Query (for state caching), Tailwind CSS, Recharts (data visualizations), Framer Motion (page animations).
- **Backend Environment**: Express, Node.js with Native ES Modules, `esbuild` (bundler).
- **ORM / Migrations**: Drizzle ORM paired with PostgreSQL pg driver.
- **Third-Party Integrations**: Firebase Admin SDK (Authentication), Google GenAI SDK (Gemini AI Insights).

---

## 5. Project Structure

The codebase is split cleanly into frontend presentation and backend logic:

```
├── drizzle/                     # Drizzle schema migrations SQL files
├── server/                      # Express Backend Directory
│   ├── controllers/             # Request handlers (e.g., auth, reporting)
│   ├── db/                      # Database config, schemas, seed utilities
│   │   ├── audit-auth.ts        # Built-in account integrity verification
│   │   ├── schema.ts            # Core Drizzle schema declarations
│   │   └── populate-data.ts     # Mock and system seed scripts
│   ├── middleware/              # Auth, RBAC, and error handlers
│   ├── routes/                  # Express REST routes (admin, tasks, etc.)
│   ├── validations/             # API payload parsing schemas
│   └── firebase.ts              # Firebase Admin SDK initialization script
├── src/                         # React Frontend Directory
│   ├── components/              # Shared UI components (cards, forms)
│   ├── contexts/                # React context managers (Auth, Theme)
│   ├── pages/                   # Primary page components (Dashboard, Login)
│   │   └── admin/               # Enterprise Admin & Command Center panels
│   └── main.tsx                 # Frontend main JS entrypoint
├── server.ts                    # Backend server entry point
├── package.json                 # Dependency manifests & run scripts
└── metadata.json                # App permission manifests
```

---

## 6. Environment Configuration
The platform utilizes environment variables to isolate sensitive keys. All parameters **must** be listed in `.env.example`:

- `DATABASE_URL`: Connection string for PostgreSQL database.
- `GEMINI_API_KEY`: Server-side API token for Google GenAI operations.
- `FIREBASE_PROJECT_ID`: Target Firebase identifier.
- `FIREBASE_CLIENT_EMAIL`: Service account email used for administrative verification.
- `FIREBASE_PRIVATE_KEY`: Cryptographically secure private key block for server auth.

*Security Warning*: Never add `VITE_` prefixes to server-side variables (such as `GEMINI_API_KEY` or `DATABASE_URL`) to prevent them from leaking to the browser network panels.

---

## 7. Authentication & Security
The authentication pipeline enforces **Zero-Trust** design paradigms:
- **Token Verification**: Handled at route level via `verifyToken` middleware.
- **RBAC Role Enforcement**: Handled via `requireRole(['SUPER_ADMIN', 'Administrator', ...])` middleware. If a user lacks the specific role, the backend rejects the transaction with a `403 Forbidden` JSON response.
- **Built-in DB-Auth Audit**: Implemented in `server/db/audit-auth.ts`, checking that all PostgreSQL user rows mapped to `firebase_uid` match their corresponding Firebase Authentication records.

---

## 8. Database Administration
Structured records are managed using standard tables and optimized indexes:

### 8.1 Primary Tables & Relations
- `users`: Maps user attributes (email, names, roles) to unique `firebase_uid` values. Features an index on `firebase_uid` (`users_firebase_uid_idx`) for rapid authentication lookups.
- `tasks`: Links tasks to specific employees and tracks SLA limits.
- `reports`: Links to the original task, contains descriptive textual metrics, and holds a reference to the active supervisor approval chain status.
- `evidence`: Holds physical paths, geographic latitude/longitude values, and a SHA-256 string representing file integrity hashes.

---

## 9. API Administration

### Core Endpoint Mapping:
1. **Auth Engine (`/api/auth/*`)**: Coordinates token extraction, sign-in, and registration tracking.
2. **Admin Command (`/api/admin/*`)**: Accessible only to EACC users. Controls manual database sync, user modifications, password resets, and homepage content updates.
3. **Governance Pipeline (`/api/governance/*`)**: Serves compliance, storage analytics, media records, and raw GIS coordinate matrices.
4. **Integration Services (`/api/integration/*`)**: Manages API key allocation, incoming synchronizations, and webhook distributions.

---

## 10. Background Processing
To ensure maximum API responsiveness, complex processes are executed asynchronously:
- **Workforce Sync**: Scans active users in the database against the cloud directory, logs the results, and fixes out-of-sync fields automatically.
- **AI Insights Engine**: Runs background aggregation routines to parse performance bottlenecks, group department compliance vectors, and generate diagnostic briefings.

---

## 11. Monitoring & Logging
IT Administrators must monitor several system logs:
- **Database Logs**: Relational database operations are logged with timing indicators to help catch slow queries.
- **Synchronization Logs**: Access details of every manual and automated account sync are recorded inside EACC's **Integration Platform** tab.
- **Audit Logs**: Any state alteration on tasks, reports, or authentication states triggers a new record inside the system audit tables.

---

## 12. Maintenance Procedures

### 12.1 Deploying Code Changes
To deploy an update, execute the standard production compilation:
```bash
# Compile CSS, bundle client JS, and bundle Express Server CJS files
npm run build

# Start the compiled production app
npm start
```

### 12.2 Schema Migrations
When modifying `server/db/schema.ts`, database schemas must be updated to maintain sync:
```bash
# Generate the migration files
npx drizzle-kit generate

# Apply migrations directly to the live PostgreSQL instance
npx drizzle-kit migrate
```

---

## 13. Backup & Recovery
- **Database Backups**: Relational databases should use daily pg_dump automated snapshots.
- **File Asset Recovery**: Cloud buckets must have versioning enabled to prevent accidental loss of field evidence.

---

## 14. Troubleshooting Guide

#### Symptom: Dev Server fails to start with "vite not found"
- **Cause**: Project dependencies are not fully initialized.
- **Fix**: Run `npm install` to download missing packages.

#### Symptom: Users receive "Unauthorized" message upon opening dashboards
- **Cause**: Invalid Firebase tokens or mismatch between PostgreSQL role assignments.
- **Fix**: Open EACC -> **Workforce Auth & Sync** and execute an automated sync repair to align permissions.

---

## 15. Performance Optimization
- **React Query Caching**: Avoids redundant network calls by caching dashboard API responses.
- **Strict Pagination**: Large collections (e.g., Reports, Tasks, Audit records) are paginated database-side.
- **Database Indexing**: The `users_firebase_uid_idx` index ensures that lookups during authentication resolve in sub-millisecond times.

---

## 16. Release Management
- **Versioning**: Follows Semantic Versioning rules.
- **Production Build**: Compiles client-side bundles into `dist/` and compiles the backend into `dist/server.cjs` via `esbuild`.
- **Verification Routine**: Post-deployment, the technical administrator should run `Run Workforce Audit` inside EACC to verify authentication health.

---

## 17. Operational Checklists

### Daily Tasks:
- Review EACC Overview for active system-wide errors.
- Check the recent integration and webhook sync logs.

### Weekly Tasks:
- Run a manual **Evidence Audit** loop to re-verify cryptographic image file hashes.
- Inspect storage limits and media compression efficiency.

---

## 18. Frequently Asked Questions (FAQ)

#### Q: How is the database initialized?
**A**: Database tables are bootstrapped using `drizzle-kit push` and populated with system parameters using `npx tsx server/db/populate-data.ts`.

#### Q: Where are the compiled static assets saved?
**A**: Client assets are compiled to `/dist` and served statically by Express in production mode.

---

## 19. Conclusion
By following the operational guidelines and procedures in this manual, IT Administrators can ensure high performance, security alignment, and complete reliability for the Supervisor Eye Enterprise Platform.
