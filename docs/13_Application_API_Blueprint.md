# Supervisor Eye: Application & API Blueprint
**Client:** Movit Group of Companies

## 1. Application Module Design

*   **Authentication & IAM Module:** Handles login (Firebase Auth), JWT verification, RBAC mapping.
*   **User & Hierarchy Module:** CRUD for employees, organizational chart mapping, supervisor assignment.
*   **Task & Templating Module:** Form builder for dynamic field reports, task dispatching.
*   **Field Execution Module (Mobile Core):** GPS locking, anti-spoofing camera capture, offline queueing.
*   **Workflow & Approval Module:** State machine for Reports (Draft -> Pending -> Approved/Rejected), SLA tracking.
*   **Analytics & Dashboard Module:** Aggregation of KPIs, data visualization (Recharts).
*   **AI Briefing Module:** Gemini integration, automated summary generation, sentiment/risk analysis on field notes.

## 2. API Architecture (RESTful)

### Authentication & Authorization
*   All endpoints require a Bearer JWT issued by Firebase.
*   Middleware verifies JWT and extracts `user_id`.
*   RBAC Middleware checks permissions against requested routes.

### Standard Response Format
```json
{
  "status": "success | error",
  "data": { ... },
  "message": "Human readable message",
  "meta": { "pagination": {} }
}
```

### Route Groups
**Auth & Users**
*   `GET /api/v1/users/me` - Get current user profile & permissions.
*   `GET /api/v1/hierarchy/team` - Get subordinate tree.

**Tasks & Reports**
*   `GET /api/v1/tasks` - List assigned tasks (Mobile).
*   `POST /api/v1/reports` - Submit new report. Contains multipart/form-data for image uploads.
*   `GET /api/v1/reports/pending` - List team's pending reports (Supervisor).
*   `POST /api/v1/reports/:id/approve` - Approve workflow transition.
*   `POST /api/v1/reports/:id/reject` - Reject workflow transition.

**Dashboards & Analytics**
*   `GET /api/v1/analytics/kpis` - Executive high-level metrics.
*   `GET /api/v1/analytics/compliance` - Departmental submission rates.
*   `GET /api/v1/analytics/predictive-restock` - Predict upcoming stockouts by territory.

**AI & Insights**
*   `GET /api/v1/insights/weekly` - Fetch Gemini-generated weekly department briefings.

**ERP & External Integrations**
*   `POST /api/v1/integrations/erp/sync` - Bulk sync products and distributors from ERP.
*   `POST /api/v1/integrations/erp/dispatch` - Push approved expense/stock requisitions to ERP.
*   `POST /api/v1/integrations/payroll/export` - Export verified attendance and KPIs to Payroll.

## 3. Error Handling
*   Standard HTTP statuses (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity, 500 Internal Error).
*   All errors written to Application logs. Critical errors alert DevOps.
