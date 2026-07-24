import { db } from '../db/index.js';
import { departments, users, departmentIntelligence, userIntelligence } from '../db/schema.js';

async function seedIntelligenceData() {
  console.log('Seeding Department Intelligence and User Intelligence metrics...');

  const allDepts = await db.select().from(departments);
  const allUsers = await db.select().from(users).limit(30);

  // Seed Department Intelligence
  console.log(`Found ${allDepts.length} departments.`);
  for (const dept of allDepts) {
    let health = 88;
    let risk = 12;
    let taskCompletion = 94;
    let compliance = 92;
    let sla = 90;

    if (dept.name === 'Sales') {
      health = 92; risk = 8; taskCompletion = 96; compliance = 95; sla = 93;
    } else if (dept.name === 'Distribution') {
      health = 84; risk = 16; taskCompletion = 88; compliance = 89; sla = 85;
    } else if (dept.name === 'Marketing') {
      health = 89; risk = 11; taskCompletion = 91; compliance = 93; sla = 92;
    } else if (dept.name === 'ICT') {
      health = 96; risk = 4; taskCompletion = 98; compliance = 99; sla = 97;
    } else if (dept.name === 'Finance') {
      health = 91; risk = 9; taskCompletion = 93; compliance = 97; sla = 94;
    } else if (dept.name === 'Human Resources') {
      health = 90; risk = 10; taskCompletion = 92; compliance = 96; sla = 91;
    }

    await db.insert(departmentIntelligence).values({
      departmentId: dept.id,
      healthScore: health,
      riskScore: risk,
      taskCompletionRate: taskCompletion,
      complianceRate: compliance,
      slaPerformance: sla,
    });
  }

  // Seed User Intelligence
  console.log(`Found ${allUsers.length} users for User Intelligence.`);
  for (const user of allUsers) {
    let prod = Math.floor(Math.random() * 20) + 80; // 80-99
    let qual = Math.floor(Math.random() * 18) + 82;
    let comp = Math.floor(Math.random() * 15) + 85;
    let flags = Math.random() < 0.2 ? 1 : 0;

    await db.insert(userIntelligence).values({
      userId: user.id,
      roleType: user.jobTitle?.includes('Supervisor') ? 'SUPERVISOR' : 'FIELD_STAFF',
      productivityScore: prod,
      qualityScore: qual,
      complianceScore: comp,
      flags: flags,
    });
  }

  console.log('✅ Intelligence data seeded successfully!');
  process.exit(0);
}

seedIntelligenceData().catch((err) => {
  console.error('Failed to seed intelligence:', err);
  process.exit(1);
});
