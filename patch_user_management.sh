sed -i -e '/import { Loader2, Search/c\
import { Loader2, Search, Edit2, ShieldAlert } from "lucide-react";\
import { useUsersQuery } from "../../hooks/useQueries";' src/pages/admin/UserManagement.tsx

awk '
/const \[users, setUsers\] = useState/ {
    print "  const { data: usersResponse, isLoading: loading } = useUsersQuery();"
    print "  const users = usersResponse?.data || usersResponse || [];"
    skip=1
    next
}
/const \[loading, setLoading\] = useState/ {
    skip=0
    next
}
/useEffect/ {
    skip=1
    next
}
/const fetchUsers = async/ {
    skip=1
    next
}
skip==1 && /^  };/ {
    skip=0
    next
}
skip==1 { next }
{ print }
' src/pages/admin/UserManagement.tsx > temp.tsx && mv temp.tsx src/pages/admin/UserManagement.tsx
