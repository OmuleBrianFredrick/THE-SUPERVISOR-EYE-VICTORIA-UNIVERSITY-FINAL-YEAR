#!/bin/bash

# Remove lines from 692 to 821 in ApprovalQueue.tsx
sed -i '692,821d' src/pages/admin/ApprovalQueue.tsx

# Insert the component at line 692
sed -i '691a\        {/* ADMINISTRATIVE AUDIT STREAM PANEL */}\n        <AdministrativeAuditPanel refreshKey={auditRefreshKey} />' src/pages/admin/ApprovalQueue.tsx

# Add import
sed -i '15a\import AdministrativeAuditPanel from "./components/AdministrativeAuditPanel";' src/pages/admin/ApprovalQueue.tsx

# Replace loadAuditLogs with auditRefreshKey state
sed -i 's/const \[auditLogs, setAuditLogs\] = useState<AuditLogRecord\[\]>(\[\]);/const [auditRefreshKey, setAuditRefreshKey] = useState(0);/g' src/pages/admin/ApprovalQueue.tsx
sed -i 's/loadAuditLogs();/setAuditRefreshKey(prev => prev + 1);/g' src/pages/admin/ApprovalQueue.tsx

# Remove other state variables
sed -i '/const \[auditSearch/d' src/pages/admin/ApprovalQueue.tsx
sed -i '/const \[auditModuleFilter/d' src/pages/admin/ApprovalQueue.tsx
sed -i '/const \[auditPage/d' src/pages/admin/ApprovalQueue.tsx
sed -i '/const auditItemsPerPage/d' src/pages/admin/ApprovalQueue.tsx

