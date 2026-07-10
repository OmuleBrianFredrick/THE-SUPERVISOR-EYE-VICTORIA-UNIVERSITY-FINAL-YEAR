#!/bin/bash
sed -i '164,168c\      invalidateQueries([["users"]]);' src/pages/admin/ApprovalQueue.tsx
