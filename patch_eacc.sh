sed -i -e '/import EnterpriseIntegrationPlatform/c\
import EnterpriseIntegrationPlatform from "./components/EnterpriseIntegrationPlatform";\
import { useAdminStatsQuery } from "../../hooks/useQueries";' src/pages/admin/EACC.tsx

awk '
/const \[stats, setStats\] = useState/ {
    print "  const { data: stats } = useAdminStatsQuery();"
    skip=1
    next
}
/useEffect/ && skip==1 {
    skip=0
}
skip==1 { next }
{ print }
' src/pages/admin/EACC.tsx > temp.tsx && mv temp.tsx src/pages/admin/EACC.tsx
