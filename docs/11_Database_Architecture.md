# Supervisor Eye: Database Architecture (PostgreSQL)
**Client:** Movit Group of Companies

## 1. Entity Relationship Model
- **Users** (1) -> (M) **Roles**
- **Departments** (1) -> (M) **Users**
- **Users** (1) -> (M) **Users** (Self-referencing for hierarchy: manager_id)
- **Users** (1) -> (M) **Tasks**
- **Tasks** (1) -> (M) **Reports**
- **Reports** (1) -> (M) **Evidence**
- **Reports** (1) -> (M) **Approvals**
- **Reports** (1) -> (M) **Comments**

## 2. Core Tables

### Table: users
*Purpose:* Stores all Movit personnel.
*   `id` (UUID, PK)
*   `firebase_uid` (VARCHAR, UNIQUE, Index)
*   `department_id` (UUID, FK -> departments)
*   `role_id` (UUID, FK -> roles)
*   `manager_id` (UUID, FK -> users)
*   `first_name`, `last_name` (VARCHAR)
*   `email`, `phone` (VARCHAR, UNIQUE)
*   `status` (ENUM: 'ACTIVE', 'INACTIVE')
*   `created_at`, `updated_at` (TIMESTAMP)

### Table: departments
*Purpose:* Represents Movit's organizational units.
*   `id` (UUID, PK)
*   `name` (VARCHAR) (e.g., 'Central Sales', 'Western Logistics')
*   `head_user_id` (UUID, FK -> users)

### Table: tasks
*Purpose:* Templates or specific assignments for field workers.
*   `id` (UUID, PK)
*   `assigned_to` (UUID, FK -> users)
*   `created_by` (UUID, FK -> users)
*   `title`, `description` (TEXT)
*   `task_type` (ENUM: 'MERCHANDISING', 'STOCK_AUDIT', 'GENERAL_VISIT')
*   `target_location_lat`, `target_location_lng` (DECIMAL)
*   `due_date` (TIMESTAMP)
*   `status` (ENUM: 'PENDING', 'IN_PROGRESS', 'COMPLETED')

### Table: reports
*Purpose:* The actual submission by the field agent.
*   `id` (UUID, PK)
*   `task_id` (UUID, FK -> tasks)
*   `submitter_id` (UUID, FK -> users)
*   `status` (ENUM: 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')
*   `gps_lat`, `gps_lng` (DECIMAL)
*   `is_gps_verified` (BOOLEAN)
*   `notes` (TEXT)
*   `submitted_at` (TIMESTAMP)

### Table: evidence
*Purpose:* Media files attached to a report.
*   `id` (UUID, PK)
*   `report_id` (UUID, FK -> reports)
*   `media_url` (VARCHAR) (Cloud Storage URI)
*   `media_type` (ENUM: 'PHOTO', 'SIGNATURE')
*   `captured_lat`, `captured_lng` (DECIMAL)
*   `captured_at` (TIMESTAMP)

### Table: approvals
*Purpose:* Tracks the workflow state and sign-offs.
*   `id` (UUID, PK)
*   `report_id` (UUID, FK -> reports)
*   `approver_id` (UUID, FK -> users)
*   `decision` (ENUM: 'APPROVED', 'REJECTED')
*   `comments` (TEXT)
*   `decision_at` (TIMESTAMP)

### Table: audit_logs
*Purpose:* Immutable ledger of systemic actions.
*   `id` (UUID, PK)
*   `user_id` (UUID, FK -> users)
*   `action` (VARCHAR) (e.g., 'LOGIN', 'REPORT_SUBMIT', 'GPS_SPOOF_DETECTED')
*   `ip_address` (VARCHAR)
*   `timestamp` (TIMESTAMP)
*   `metadata` (JSONB)

### Table: ai_insights
*Purpose:* Stores Gemini-generated analytical briefings.
*   `id` (UUID, PK)
*   `department_id` (UUID, FK -> departments)
*   `insight_type` (VARCHAR) (e.g., 'WEEKLY_SUMMARY', 'RISK_ALERT', 'RESTOCK_PREDICTION')
*   `content` (TEXT)
*   `generated_at` (TIMESTAMP)

### Table: integration_sync_logs
*Purpose:* Tracks interactions and data sync success/failures with the central ERP and Payroll systems.
*   `id` (UUID, PK)
*   `system_name` (ENUM: 'ERP', 'PAYROLL')
*   `sync_type` (ENUM: 'INBOUND', 'OUTBOUND')
*   `status` (ENUM: 'SUCCESS', 'FAILED', 'PENDING')
*   `payload_snapshot` (JSONB)
*   `error_reason` (TEXT)
*   `synced_at` (TIMESTAMP)
