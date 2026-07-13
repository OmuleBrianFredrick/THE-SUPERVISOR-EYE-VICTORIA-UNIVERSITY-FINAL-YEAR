const fs = require('fs');
let code = fs.readFileSync('server/services/queue.ts', 'utf8');
code = code.replace('return jobs[0];', `const j = jobs[0];\n  return {\n    ...j,\n    queueName: j.queue_name || j.queueName,\n    jobType: j.job_type || j.jobType,\n    maxAttempts: j.max_attempts || j.maxAttempts,\n    scheduledFor: j.scheduled_for || j.scheduledFor,\n  };`);
fs.writeFileSync('server/services/queue.ts', code);
