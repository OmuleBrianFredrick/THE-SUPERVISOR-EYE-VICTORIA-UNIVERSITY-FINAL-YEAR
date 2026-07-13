const fs = require('fs');
let code = fs.readFileSync('src/components/dashboards/FieldStaffDashboard.tsx', 'utf8');

code = code.replace(/reports\.map\(/g, '(reports || []).map(');
code = code.replace(/tasks\.map\(/g, '(tasks || []).map(');

fs.writeFileSync('src/components/dashboards/FieldStaffDashboard.tsx', code);
