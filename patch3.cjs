const fs = require('fs');
let code = fs.readFileSync('src/components/dashboards/FieldStaffDashboard.tsx', 'utf8');

code = code.replace(/const filteredTasks = tasks\.filter/g, 'const filteredTasks = (tasks || []).filter');
code = code.replace(/const rejectedReports = reports\.filter/g, 'const rejectedReports = (reports || []).filter');
code = code.replace(/const draftReport = reports\.find/g, 'const draftReport = (reports || []).find');
code = code.replace(/reports\.find\(/g, '(reports || []).find(');
code = code.replace(/tasks\.filter\(/g, '(tasks || []).filter(');
code = code.replace(/reports\.filter\(/g, '(reports || []).filter(');
code = code.replace(/pendingTasks\.map\(/g, '(pendingTasks || []).map(');

fs.writeFileSync('src/components/dashboards/FieldStaffDashboard.tsx', code);
