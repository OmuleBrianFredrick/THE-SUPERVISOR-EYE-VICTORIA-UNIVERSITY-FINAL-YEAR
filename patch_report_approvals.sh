sed -i -e '/import { CheckCircle/c\
import { CheckCircle, XCircle, Clock, Search, FileText, ChevronRight, Eye, ShieldCheck, MapPin } from "lucide-react";\
import { useApprovalsQuery, useInvalidateQueries } from "../../../hooks/useQueries";' src/pages/admin/components/ReportApprovalsDashboard.tsx

awk '
/const \[approvals, setApprovals\] = useState/ {
    print "  const { data: approvalsResponse, isLoading: loading } = useApprovalsQuery();"
    print "  const approvals = approvalsResponse || [];"
    print "  const invalidateQueries = useInvalidateQueries();"
    skip=1
    next
}
/const \[searchQuery, setSearchQuery\]/ {
    skip=0
}
/useEffect\(\(\) => \{/ {
    skip=1
    next
}
/const fetchApprovals = async \(\) => \{/ {
    skip=1
    next
}
skip==1 && /^  };/ {
    skip=0
    next
}
skip==1 { next }
{ print }
' src/pages/admin/components/ReportApprovalsDashboard.tsx > temp.tsx && mv temp.tsx src/pages/admin/components/ReportApprovalsDashboard.tsx

sed -i -e 's/await fetchApprovals();/invalidateQueries([["approvals"]]);/g' src/pages/admin/components/ReportApprovalsDashboard.tsx

