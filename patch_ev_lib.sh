sed -i -e '/const { data: evidenceResponse, isLoading: loadingEvidence } = useEvidenceQuery();/i\
  const [searchQuery, setSearchQuery] = useState("");\
  const [typeFilter, setTypeFilter] = useState("ALL");\
  const [statusFilter, setStatusFilter] = useState("ALL");' src/pages/EvidenceLibrary.tsx
