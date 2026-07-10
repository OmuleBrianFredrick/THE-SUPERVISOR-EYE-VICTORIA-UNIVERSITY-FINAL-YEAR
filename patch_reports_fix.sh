sed -i -e '/const { data: reportsResponse, isLoading: loading } = useReportsQuery();/a\
  const [searchQuery, setSearchQuery] = useState("");\
  const [statusFilter, setStatusFilter] = useState("ALL");\
  const [selectedReport, setSelectedReport] = useState<any | null>(null);\
  const [timeline, setTimeline] = useState<{versions: any[], comments: any[]}>({versions: [], comments: []});\
  const [newComment, setNewComment] = useState("");\
  const [submittingComment, setSubmittingComment] = useState(false);\
\
  const loadTimeline = async (reportId: string) => {\
    try {\
      const token = await getToken();\
      const res = await fetch(`/api/v1/reports/${reportId}/timeline`, {\
        headers: { Authorization: `Bearer ${token}` }\
      });\
      if (res.ok) {\
        setTimeline(await res.json());\
      }\
    } catch(e) {\
      error("Failed to load timeline");\
    }\
  };\
' src/pages/Reports.tsx
