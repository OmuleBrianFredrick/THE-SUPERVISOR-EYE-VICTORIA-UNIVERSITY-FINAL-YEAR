const fs = require('fs');
let code = fs.readFileSync('src/components/dashboards/FieldStaffDashboard.tsx', 'utf8');
code = code.replace(/t\.title\.toLowerCase\(\)/g, "(t.title || '').toLowerCase()");
code = code.replace(/t\.description\.toLowerCase\(\)/g, "(t.description || '').toLowerCase()");
fs.writeFileSync('src/components/dashboards/FieldStaffDashboard.tsx', code);
