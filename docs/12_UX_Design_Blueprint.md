# Supervisor Eye: UX/UI Design System & Screen Inventory
**Client:** Movit Group of Companies

## 1. UI/UX Design System (Movit Enterprise Theme)

### Corporate Branding & Colors
The UI must reflect a mature, professional corporate tool, incorporating Movit's brand identity subtly without overwhelming the user.
*   **Primary Brand Color (Action):** Movit Red/Amber (`#ea580c` / Amber-600) - Used for primary buttons, active states, key alerts.
*   **Secondary/Accent:** Deep Corporate Navy/Slate (`#0f172a` / Slate-900) - For sidebars, high-contrast panels, executive gravitas.
*   **Backgrounds:** Clean Whites (`#ffffff`) and Soft Greys (`#f8fafc`) for maximum data legibility.
*   **Success Details:** Emerald Green (`#059669`) for verified GPS, approved status.
*   **Warning Details:** Amber/Orange for pending items.

### Typography
*   **Primary Font:** `Inter` (sans-serif) for high legibility in dense data tables and forms.
*   **Metric/Data Font:** `JetBrains Mono` for IDs, timestamps, and exact financial/numeric data.

### Component Design
*   **Cards:** Bento-grid style. Subtle borders (`border-slate-200`), rounded corners (`rounded-2xl` or `rounded-xl`), gentle shadows only on hover.
*   **Buttons:** Fully rounded or subtly rounded corners. Solid Slate-900 or Amber-600 for primary actions. Muted grey for secondary.
*   **Tables:** Clean, edge-to-edge data grids. Zebra striping disabled; use subtle row hover states.
*   **Badges:** Pill-shaped status indicators (e.g., [● Approved] in green, [● Pending] in amber).

## 2. User Experience Architecture & Sitemap

### Employee (Mobile Interface)
*   **Bottom Tab Nav:** Tasks | History | Profile
*   **Flow:** Login -> View Today's Tasks -> Select Task -> Open Camera & GPS -> Add Notes -> Submit -> Back to Tasks.

### Supervisor (Desktop/Tablet)
*   **Sidebar Nav:** Command Center | Inbox (Approvals) | Team Map | Team Roster
*   **Flow:** Login -> Dashboard (Alerts) -> Inbox -> Review Report (Side-by-side evidence view) -> Click Approve -> Automatically loads next pending item.

### Executive (Desktop)
*   **Sidebar Nav:** Executive Overview | Regional Analytics | Risk & Alerts | AI Briefings
*   **Flow:** Login -> High-level KPI Dashboard -> Click into Region -> View Departmental Scorecard -> Read AI Summary.

## 3. Screen Inventory

1.  **Authentication:** Login, Forgot Password, Reset Password.
2.  **Dashboard (Role-based):**
    *   Executive Overview (Graphs, Maps, AI Briefs).
    *   Supervisor Command Center (Pending counts, active field agents).
    *   Agent Daily View (Task list).
3.  **Approval Inbox:** List view of pending items with SLA countdown timers.
4.  **Report Detail Modal:** Splitscreen: Left side shows text data/notes; Right side shows Map pin and high-res Evidence image.
5.  **Analytics Hub:** Compliance charts, route efficiency metrics, historical trends.
6.  **Administration Area:** User Management table, Department configurator, Form/Template builder.
7.  **AI Briefing Center:** Library of generated insights.
