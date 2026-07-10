#!/bin/bash
sed -i '/const getFilteredAudits/,/};/d' src/pages/admin/ApprovalQueue.tsx
sed -i '/const filteredAudits = getFilteredAudits();/d' src/pages/admin/ApprovalQueue.tsx
sed -i '/const totalAuditPages = /d' src/pages/admin/ApprovalQueue.tsx
sed -i '/const paginatedAudits = /d' src/pages/admin/ApprovalQueue.tsx
