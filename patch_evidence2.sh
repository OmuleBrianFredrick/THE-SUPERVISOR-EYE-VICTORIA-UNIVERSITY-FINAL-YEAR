awk '
/const \[evidenceList, setEvidenceList\]/ {
    print "  const { data: evidenceResponse, isLoading: loadingEvidence } = useEvidenceQuery();"
    print "  const { data: analytics, isLoading: loadingAnalytics } = useEvidenceAnalyticsQuery();"
    print "  const evidenceList = evidenceResponse?.data || evidenceResponse || [];"
    print "  const loading = loadingEvidence || loadingAnalytics;"
    skip=1
    next
}
/const formatBytes =/ {
    skip=0
}
skip==1 { next }
{ print }
' src/pages/EvidenceLibrary.tsx > temp.tsx && mv temp.tsx src/pages/EvidenceLibrary.tsx
