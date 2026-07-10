sed -i -e '/const navigate = useNavigate();/i\
  const { getToken } = useAuth();\
  const invalidateQueries = useInvalidateQueries();' src/components/dashboards/ExecutiveDashboard.tsx

sed -i -e 's/fetchData()/invalidateQueries([["analytics", "executive-summary"]])/g' src/components/dashboards/ExecutiveDashboard.tsx

