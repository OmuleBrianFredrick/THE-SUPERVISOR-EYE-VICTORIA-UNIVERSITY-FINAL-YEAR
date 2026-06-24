# Stage 3: Authentication & Authorization Blueprint
**Client:** Movit Group of Companies

## 1. Authentication Architecture (Firebase + PostgreSQL)

The authentication system leverages Firebase Authentication as the Identity Provider (IdP) for password, token, and session management. Business logic, roles, and hierarchical structures are managed securely within our Neon PostgreSQL database.

*   **Identities Supported:** 
    *   Google OAuth (Ideal for C-Suite and HQ users with @movitgroup.com emails).
    *   Email & Password (Ideal for field staff / Van sales).
*   **Token Lifecycle:** 
    1.  Firebase handles the sign-in and returns a JWT.
    2.  The React frontend sends this JWT as a Bearer Token in the `Authorization` header to the Node.js backend.
    3.  Express Middleware verifies the JWT using the Firebase Admin SDK.
    4.  Middleware looks up the corresponding `users` record in PostgreSQL via `firebase_uid`.
    5.  The PostgreSQL `roles` and `departments` data are injected into the Request object for the RBAC layer.

## 2. Authentication Flow Diagram

1.  **User Accesses Platform:** Client app checks for active Firebase session.
2.  **Unauthenticated:** Redirected to `/login`.
3.  **Login Action:** User authenticates via Google OAuth or Email/Password via Firebase SDK.
4.  **Token Issuance:** Firebase returns ID Token.
5.  **Session Establishment:** 
    *   Frontend stores token and fetches user profile details from the `GET /api/v1/auth/me` Node.js endpoint.
    *   Frontend Context API/Redux stores user data, role, and permissions.
6.  **Authenticated Routing:** React Router evaluates permissions and directs the user to their role-specific dashboard.

## 3. Authorization Model (RBAC)

Authorization combines horizontal security (Module access based on Role) and vertical security (Data access based on Hierarchy).

*   **System Administrator:** Superuser. Full vertical and horizontal access.
*   **Executive:** Horizontal access to all macro-analytics. No access to system configuration.
*   **Department Manager:** Vertical access restricted to their assigned `department_id`.
*   **Supervisor:** Vertical access restricted to users where `manager_id` equals the Supervisor's ID.
*   **Field Staff:** Vertical access restricted strictly to their own `submitter_id` and assigned tasks.

## 4. Permission Matrix

| Role | Accessible Modules | Dashboard | Allowed Actions | Restricted Actions |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | All Modules, Admin Settings | System Health, User Management | Create users, modify roles, manage integrations, view all logs | Bypassing audit logs |
| **Executive** | Analytics, Exec Summaries, AI Insights | Global KPI Dashboard, Maps | View all aggregated data, run global reports | Create tasks, approve/reject individual reports, configure system |
| **Dept. Manager** | Analytics, Team Reports, Tasks | Departmental Scorecard | View dept data, override approvals, create macro tasks | Actions outside assigned department |
| **Supervisor** | Inbox, Team Map, Disciplinary | Supervisor Command Center | Approve/Reject subordinate reports, assign field tasks, view live team GPS | View other department's data, alter system settings |
| **Field Staff** | Tasks, History, Profile | Task/Submission List (Mobile) | Submit reports, capture GPS/Evidence, view own history | Approve reports, access analytics, view other staff's data |

## 5. Route Protection Strategy

### Frontend (React Router)
We will implement an `<AuthGuard>` and `<RoleGuard>` wrapper around specific `<Route>` components. 
*   **AuthGuard:** Ensures Firebase state is authenticated. Redirects to `/login` if not.
*   **RoleGuard:** Accepts an array of allowed roles (e.g., `['ADMIN', 'SUPERVISOR']`). If the user's role context does not match, redirects to an `/unauthorized` splash page.

### Backend (Express Middleware)
*   **`verifyToken`:** Ensures the request has a valid, unexpired Firebase JWT. Returns `401 Unauthorized`.
*   **`requireRole([...roles])`:** Checks the PostgreSQL `role.name`. Returns `403 Forbidden` if unauthorized.
*   **`requireHierarchy` (Vertical Security):** Dynamic middleware for routes like `GET /reports/:id`. Ensures the requester is either the report owner OR their direct supervisor. Returns `403 Forbidden`.

## 6. User Lifecycle Flow
1.  **Creation / Activation:** System Administrator creates the user in the Admin Portal.
    *   Backend creates Firebase User (generating a temporary password).
    *   Backend creates PostgreSQL `users` record binding the `firebase_uid`.
    *   System emails the user a Welcome Link and temporary credentials.
2.  **First Login:** User logs in and is prompted to reset their password via Firebase integration.
3.  **Active State:** User utilizes the platform. 
4.  **Suspension / Deactivation:** HR or Admin changes the `status` to 'INACTIVE' in PostgreSQL and disables the Firebase account. Active sessions are revoked via Firebase Admin SDK.

---
**Status:** Awaiting Approval to proceed with Source Code Implementation.
