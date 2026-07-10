import { db } from '../../db/index.js';
import { users, departments, tasks, reports, orgHealthMetrics, aiInsights, executiveSummaries, departmentIntelligence, userIntelligence } from '../../db/schema.js';
import { sql } from 'drizzle-orm';

export async function handleAiJob(job: any) {
  const { jobType, payload } = job;
  
  if (jobType === 'simulate-generation') {
    const { getGeminiClient } = await import('../ai.js');
    const { Type } = await import('@google/genai');
    const ai = getGeminiClient();

    // Gather high-level stats from the database in parallel
    const [totalUsers, totalDepts, totalTasks, totalReports, depts, staff] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(users),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(departments),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(tasks),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(reports),
      db.query.departments.findMany(),
      db.query.users.findMany({ limit: 10 })
    ]);

    const prompt = `
    You are the Enterprise Executive Intelligence AI for Supervisor Eye.
    We have ${totalUsers[0].count} users, ${totalDepts[0].count} departments, ${totalTasks[0].count} tasks, and ${totalReports[0].count} reports.
    
    Analyze this synthetic operational data and generate a comprehensive organizational health report, 
    executive summary, department intelligence scores, user intelligence scores for up to 5 users, 
    and 3 key AI insights (risks, trends, or recommendations).
    
    Available Departments:
    ${depts.map((d: any) => `- ${d.name} (ID: ${d.id})`).join('\n')}
    
    Sample Users (IDs):
    ${staff.map((s: any) => `- ${s.firstName} ${s.lastName} (ID: ${s.id})`).join('\n')}
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        healthMetrics: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.INTEGER },
            complianceScore: { type: Type.INTEGER },
            productivityScore: { type: Type.INTEGER },
            efficiencyScore: { type: Type.INTEGER },
            slaScore: { type: Type.INTEGER }
          }
        },
        executiveSummary: { type: Type.STRING },
        insights: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "RISK, TREND, ANOMALY, or RECOMMENDATION" },
              severity: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, CRITICAL" },
              title: { type: Type.STRING },
              explanation: { type: Type.STRING },
              confidence: { type: Type.INTEGER },
              recommendedAction: { type: Type.STRING }
            }
          }
        },
        departments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              departmentId: { type: Type.STRING },
              healthScore: { type: Type.INTEGER },
              riskScore: { type: Type.INTEGER },
              taskCompletionRate: { type: Type.INTEGER },
              complianceRate: { type: Type.INTEGER },
              slaPerformance: { type: Type.INTEGER }
            }
          }
        },
        users: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              userId: { type: Type.STRING },
              productivityScore: { type: Type.INTEGER },
              qualityScore: { type: Type.INTEGER },
              complianceScore: { type: Type.INTEGER },
              flags: { type: Type.INTEGER }
            }
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);

    // 1. Health Math
    if (data.healthMetrics) {
      await db.insert(orgHealthMetrics).values({
          healthScore: data.healthMetrics.healthScore || 80,
          complianceScore: data.healthMetrics.complianceScore || 80,
          productivityScore: data.healthMetrics.productivityScore || 80,
          efficiencyScore: data.healthMetrics.efficiencyScore || 80,
          slaScore: data.healthMetrics.slaScore || 80
      });
    }

    // 2. Add insights
    if (data.insights && data.insights.length > 0) {
      for (const insight of data.insights) {
        await db.insert(aiInsights).values({
          type: insight.type as any,
          severity: insight.severity as any,
          title: insight.title,
          explanation: insight.explanation,
          confidence: insight.confidence,
          recommendedAction: insight.recommendedAction,
          sourceData: {}
        });
      }
    }

    // 3. Exec Summary
    if (data.executiveSummary) {
      await db.insert(executiveSummaries).values({
          period: 'WEEKLY',
          summaryText: data.executiveSummary
      });
    }

    // 4. Departments Intelligence
    if (data.departments && data.departments.length > 0) {
      for (const d of data.departments) {
        // Verify dept exists
        const exists = depts.find((dept: any) => dept.id === d.departmentId);
        if (exists) {
          await db.insert(departmentIntelligence).values({
            departmentId: d.departmentId,
            healthScore: d.healthScore,
            riskScore: d.riskScore,
            taskCompletionRate: d.taskCompletionRate,
            complianceRate: d.complianceRate,
            slaPerformance: d.slaPerformance
          });
        }
      }
    }

    // 5. Staff Intelligence
    if (data.users && data.users.length > 0) {
      for (const u of data.users) {
        const exists = staff.find((st: any) => st.id === u.userId);
        if (exists) {
          await db.insert(userIntelligence).values({
            userId: u.userId,
            roleType: 'FIELD_STAFF',
            productivityScore: u.productivityScore,
            qualityScore: u.qualityScore,
            complianceScore: u.complianceScore,
            flags: u.flags
          });
        }
      }
    }
    
    return data;
  }
  
  throw new Error(`Unknown AI job type: ${jobType}`);
}
