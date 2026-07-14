const id = '42f7e855-c021-439a-a9f8-10f9aa395c41'; 
fetch(`http://localhost:3000/api/v1/reports/${id}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer mock-uid-ZGFuaWVsLnNzZXdhbmthbWJvQG1vdml0Z3JvdXAu` },
  body: JSON.stringify({ 
    status: 'APPROVED',
    performanceScore: 95
  })
}).then(res => res.json().then(j => console.log(res.status, j)));
