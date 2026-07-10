sed -i -e '/import EvidenceGallery/c\
import EvidenceGallery from "../components/features/EvidenceGallery";\
import { useReportsQuery, useInvalidateQueries } from "../hooks/useQueries";' src/pages/Reports.tsx

awk '
/const \[reports, setReports\]/ {
    print "  const { data: reportsResponse, isLoading: loading } = useReportsQuery();"
    print "  const reports = reportsResponse?.data || reportsResponse || [];"
    print "  const invalidateQueries = useInvalidateQueries();"
    skip=1
    next
}
/const handleSelectReport =/ {
    skip=0
}
skip==1 { next }
{ print }
' src/pages/Reports.tsx > temp.tsx && mv temp.tsx src/pages/Reports.tsx

sed -i -e 's/fetchReports()/invalidateQueries([["reports"]])/g' src/pages/Reports.tsx

