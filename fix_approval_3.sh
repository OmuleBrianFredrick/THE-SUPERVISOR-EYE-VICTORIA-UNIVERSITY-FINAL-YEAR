#!/bin/bash
# Remove fetchAllUsers
sed -i '/const fetchAllUsers/,/^  };/d' src/pages/admin/ApprovalQueue.tsx

# Replace setUsers with invalidateQueries
sed -i 's/setUsers(.*);/invalidateQueries([["users"]]);/g' src/pages/admin/ApprovalQueue.tsx

# Fix loadAuditLogs which is still in handleAction
sed -i 's/loadAuditLogs()/setAuditRefreshKey(prev => prev + 1)/g' src/pages/admin/ApprovalQueue.tsx

# Fix setAuditLogs which is still in loadAuditLogs
sed -i '/const loadAuditLogs/,/^  };/d' src/pages/admin/ApprovalQueue.tsx

