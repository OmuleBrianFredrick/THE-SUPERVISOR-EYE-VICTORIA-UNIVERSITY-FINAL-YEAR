sed -i -e '/import { Bell/c\
import { Bell, Check, Mail, CheckCircle, AlertCircle, Building2, UserPlus, Info, Calendar } from "lucide-react";\
import { useInvalidateQueries } from "../../hooks/useQueries";' src/components/notifications/NotificationDropdown.tsx

awk '
/const unsubscribe = NotificationService.subscribeToNotifications/ {
    print "    const unsubscribe = NotificationService.subscribeToNotifications(userId, (data) => {"
    print "      setNotifications(prev => {"
    print "        if (prev.length > 0 && data.length > 0 && data[0].id !== prev[0].id) {"
    print "          invalidateQueries([[\"tasks\"], [\"reports\"], [\"approvals\"], [\"users\"], [\"evidence\"], [\"stats\"]]);"
    print "        }"
    print "        return data;"
    print "      });"
    print "    });"
    skip=1
    next
}
/setNotifications\(data\)/ && skip==1 {
    next
}
/\}\);/ && skip==1 {
    skip=0
    next
}
/const dropdownRef = useRef<HTMLDivElement>\(null\);/ {
    print "  const dropdownRef = useRef<HTMLDivElement>(null);"
    print "  const invalidateQueries = useInvalidateQueries();"
    next
}
skip==1 { next }
{ print }
' src/components/notifications/NotificationDropdown.tsx > temp.tsx && mv temp.tsx src/components/notifications/NotificationDropdown.tsx
