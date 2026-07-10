awk '
/useEffect/ {
    if (match($0, /useEffect\(\(\) => \{/)) {
        in_effect=1
    }
}
in_effect==1 && /fetchStats/ {
    skip_effect=1
}
in_effect==1 && /\}\);/ {
    in_effect=0
    if (skip_effect) {
        skip_effect=0
        next
    }
}
/const fetchStats = async \(\) => \{/ {
    skip_func=1
    next
}
skip_func==1 && /^  };/ {
    skip_func=0
    next
}
skip_effect==1 || skip_func==1 { next }
{ print }
' src/pages/admin/EACC.tsx > temp.tsx && mv temp.tsx src/pages/admin/EACC.tsx
