sed -i -e '/import autoTable/c\
import autoTable from "jspdf-autotable";\
import { useUsersQuery, useInvalidateQueries } from "../../hooks/useQueries";' src/pages/admin/ApprovalQueue.tsx

awk '
/const \[users, setUsers\] = useState/ {
    print "  const { data: usersResponse, isLoading: loading } = useUsersQuery();"
    print "  const users = usersResponse?.data || usersResponse || [];"
    print "  const invalidateQueries = useInvalidateQueries();"
    skip=1
    next
}
/const \[error, setError\]/ {
    skip=0
}
skip==1 { next }
{ print }
' src/pages/admin/ApprovalQueue.tsx > temp.tsx && mv temp.tsx src/pages/admin/ApprovalQueue.tsx

sed -i -e 's/fetchData()/invalidateQueries([["users"]])/g' src/pages/admin/ApprovalQueue.tsx

