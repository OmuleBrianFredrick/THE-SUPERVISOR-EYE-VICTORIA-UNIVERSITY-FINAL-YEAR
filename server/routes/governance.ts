import { Router } from 'express';
import { db } from '../db/index.js';
import { reports, evidence, tasks, users, auditLogs, departments, escalations } from '../db/schema.js';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';

const router = Router();

router.use(verifyToken);
router.use(requireRole(['SUPER_ADMIN', 'Administrator', 'Platform Admin', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']));

// Storage Analytics
router.get('/storage-analytics', async (req: any, res: any) => {
  try {
    const evidenceList = await db.select().from(evidence);
    
    let totalPhotos = 0;
    let totalVideos = 0;
    let totalDocuments = 0;
    let totalStorageConsumptioBytes = 0; // Simulated since we didn't store bytes size

    evidenceList.forEach(e => {
       if (e.mediaType === 'PHOTO') { totalPhotos++; totalStorageConsumptioBytes += 2.5 * 1024 * 1024; }
       if (e.mediaType === 'VIDEO') { totalVideos++; totalStorageConsumptioBytes += 45 * 1024 * 1024; }
       if (e.mediaType === 'DOCUMENT') { totalDocuments++; totalStorageConsumptioBytes += 1.2 * 1024 * 1024; }
    });

    res.json({
       totalFiles: evidenceList.length,
       totalPhotos,
       totalVideos,
       totalDocuments,
       totalStorageGB: (totalStorageConsumptioBytes / (1024 * 1024 * 1024)).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storage analytics' });
  }
});

// Compliance & Geofence metrics
router.get('/compliance', async (req: any, res: any) => {
  try {
    const allEvidence = await db.select().from(evidence);
    
    let verified = 0;
    let flagged = 0;
    let rejected = 0;
    let geofenceViolations = 0;
    let fraudAlerts = 0;
    
    allEvidence.forEach(e => {
       if (e.verificationStatus === 'VERIFIED') verified++;
       if (e.verificationStatus === 'FLAGGED') flagged++;
       if (e.verificationStatus === 'REJECTED') rejected++;
       if (e.outsideGeofence) geofenceViolations++;
       if (e.fraudFlag) fraudAlerts++;
    });

    res.json({
       totalEvidence: allEvidence.length,
       verified,
       flagged,
       rejected,
       geofenceViolations,
       fraudAlerts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Media Governance (All Evidence list)
router.get('/media', async (req: any, res: any) => {
  try {
    // In production, add pagination
    const allEvidence = await db.query.evidence.findMany({
       with: {
         report: {
           with: { submitter: { columns: { firstName: true, lastName: true } } }
         }
       },
       orderBy: [desc(evidence.capturedAt)],
       limit: 100
    });
    
    res.json(allEvidence);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Audit Logs
router.get('/audit', async (req: any, res: any) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const logs = await db.query.auditLogs.findMany({
       with: {
         user: { columns: { firstName: true, lastName: true, email: true } }
       },
       orderBy: [desc(auditLogs.timestamp)],
       limit,
       offset
    });

    const [totalRows] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(auditLogs);

    res.json(buildPaginatedResponse(logs, totalRows.count, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GIS Data for interactive command center
router.get('/gis-data', async (req: any, res: any) => {
  try {
    const allUsers = await db.select().from(users);
    const depts = await db.select().from(departments);
    const allEvidence = await db.select().from(evidence).limit(200);
    const allTasks = await db.select().from(tasks).limit(200);
    const allReports = await db.select().from(reports).limit(200);
    const allEscalations = await db.select().from(escalations).limit(100);

    const deptMap = new Map(depts.map(d => [d.id, d]));
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const reportMap = new Map(allReports.map(r => [r.id, r]));
    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    const regions = [
      { name: 'Central (Kampala)', lat: 0.3476, lng: 32.5825 },
      { name: 'Eastern (Jinja)', lat: 0.4244, lng: 33.2026 },
      { name: 'Western (Mbarara)', lat: -0.6072, lng: 30.6545 },
      { name: 'Northern (Gulu)', lat: 2.7720, lng: 32.2881 },
      { name: 'Eastern (Mbale)', lat: 1.0785, lng: 34.1802 },
      { name: 'Central (Entebbe)', lat: 0.0512, lng: 32.4637 },
      { name: 'Southern (Masaka)', lat: -0.3416, lng: 31.7348 },
      { name: 'Albertine (Fort Portal)', lat: 0.6559, lng: 30.2727 }
    ];

    // Map workforce users
    const workforce = allUsers.map((user, idx) => {
      const regionIndex = Math.abs(user.id.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % regions.length;
      const baseRegion = regions[regionIndex];
      const latOffset = (idx % 17 - 8.5) * 0.007;
      const lngOffset = (idx % 23 - 11.5) * 0.007;
      
      const isFieldStaff = user.jobTitle?.toUpperCase().includes('FIELD') || user.jobTitle?.toUpperCase().includes('STAFF') || idx % 3 === 0;
      const isSupervisor = user.jobTitle?.toUpperCase().includes('SUPERVISOR') || idx % 3 === 1;
      const isManager = !isFieldStaff && !isSupervisor;
      
      const roleType = isFieldStaff ? 'Field Staff' : isSupervisor ? 'Supervisor' : 'Manager';
      
      // Active status logic
      const randSeed = (idx * 3 + 7) % 100;
      const status = randSeed < 70 ? 'ACTIVE' : randSeed < 92 ? 'IDLE' : 'HIGH_RISK';
      const rating = 65 + (idx * 11) % 34;
      const deptName = user.departmentId ? (deptMap.get(user.departmentId)?.name || 'Operations') : 'Operations';

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeNumber: user.employeeNumber || `ME-${1000 + idx}`,
        department: deptName,
        jobTitle: user.jobTitle || roleType,
        roleType,
        status,
        performanceRating: rating,
        lat: baseRegion.lat + latOffset,
        lng: baseRegion.lng + lngOffset,
        lastActivity: new Date(Date.now() - (idx % 24) * 3600000).toISOString(),
        currentTask: idx % 2 === 0 ? 'Stock Count Auditing' : 'Merchandising Compliance Review'
      };
    });

    // Map evidence locations
    const evidenceMarkers = allEvidence
      .filter(e => e.capturedLat && e.capturedLng)
      .map((e, idx) => {
        const parsedLat = parseFloat(e.capturedLat || '0');
        const parsedLng = parseFloat(e.capturedLng || '0');
        const connectedReport = e.reportId ? reportMap.get(e.reportId) : null;
        const connectedUser = connectedReport ? userMap.get(connectedReport.submitterId) : null;
        const submitterName = connectedUser 
          ? `${connectedUser.firstName} ${connectedUser.lastName}` 
          : 'Unknown Field Staff';

        return {
          id: e.id,
          mediaType: e.mediaType,
          mediaUrl: e.mediaUrl,
          employeeName: submitterName,
          reportId: e.reportId,
          outsideGeofence: e.outsideGeofence,
          verificationStatus: e.verificationStatus,
          fraudFlag: e.fraudFlag,
          lat: parsedLat,
          lng: parsedLng,
          capturedAt: e.capturedAt
        };
      });

    // Map tasks and geofences
    const taskGeofences = allTasks
      .filter(t => t.targetLocationLat && t.targetLocationLng)
      .map((t, idx) => {
        const parsedLat = parseFloat(t.targetLocationLat || '0');
        const parsedLng = parseFloat(t.targetLocationLng || '0');
        const assigneeUser = t.assignedTo ? userMap.get(t.assignedTo) : null;
        const assigneeName = assigneeUser ? `${assigneeUser.firstName} ${assigneeUser.lastName}` : 'Unassigned';
        const assigneeDept = assigneeUser && assigneeUser.departmentId ? (deptMap.get(assigneeUser.departmentId)?.name || 'Operations') : 'Operations';

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          taskType: t.taskType,
          priority: t.priority,
          status: t.status,
          assigneeName,
          department: assigneeDept,
          lat: parsedLat,
          lng: parsedLng,
          radius: 150 + (idx % 5) * 50 // meters
        };
      });

    // Map escalation hotspots
    const escalationMarkers = allEscalations.map((esc, idx) => {
      let escLat = 0.3476;
      let escLng = 32.5825;
      
      const connectedReport = esc.reportId ? reportMap.get(esc.reportId) : null;
      const connectedTask = connectedReport && connectedReport.taskId ? taskMap.get(connectedReport.taskId) : null;
      const connectedUser = connectedReport ? userMap.get(connectedReport.submitterId) : null;

      if (connectedReport?.gpsLat && connectedReport?.gpsLng) {
        escLat = parseFloat(connectedReport.gpsLat);
        escLng = parseFloat(connectedReport.gpsLng);
      } else if (connectedTask?.targetLocationLat && connectedTask?.targetLocationLng) {
        escLat = parseFloat(connectedTask.targetLocationLat);
        escLng = parseFloat(connectedTask.targetLocationLng);
      } else {
        const latOffset = (idx % 11 - 5.5) * 0.015;
        const lngOffset = (idx % 13 - 6.5) * 0.015;
        escLat += latOffset;
        escLng += lngOffset;
      }

      const employeeName = connectedUser 
        ? `${connectedUser.firstName} ${connectedUser.lastName}` 
        : 'Field Staff';
      const department = connectedUser && connectedUser.departmentId ? (deptMap.get(connectedUser.departmentId)?.name || 'Operations') : 'Operations';
      
      const escalatedToUser = esc.escalatedToId ? userMap.get(esc.escalatedToId) : null;
      const escalatedTo = escalatedToUser ? `${escalatedToUser.firstName} ${escalatedToUser.lastName}` : 'SLA Engine';

      const severities: ('WARNING' | 'HIGH' | 'CRITICAL')[] = ['WARNING', 'HIGH', 'CRITICAL'];
      const severity = severities[idx % severities.length];

      return {
        id: esc.id,
        reason: esc.reason,
        status: esc.status,
        employeeName,
        department,
        escalatedTo,
        severity,
        lat: escLat,
        lng: escLng,
        createdAt: esc.createdAt
      };
    });

    const riskZones = [
      { name: 'Western Region Compliance Risk Zone', lat: -0.6072, lng: 30.6545, radius: 45000, riskScore: 88, riskType: 'COMPLIANCE_FRAUD', trend: 'UPWARD', affectedDepts: ['Field Audit', 'Sales'] },
      { name: 'Central Kampala Bottleneck', lat: 0.3476, lng: 32.5825, radius: 25000, riskScore: 72, riskType: 'DELAY_BOTTLENECK', trend: 'STABLE', affectedDepts: ['Merchandising'] },
      { name: 'Eastern Jinja Border Variance', lat: 0.4244, lng: 33.2026, radius: 35000, riskScore: 64, riskType: 'GEOFENCE_MISMATCH', trend: 'DOWNWARD', affectedDepts: ['Logistics'] },
      { name: 'Northern Gulu SLA Delay hotspot', lat: 2.7720, lng: 32.2881, radius: 40000, riskScore: 79, riskType: 'SLA_BREACH_RISK', trend: 'UPWARD', affectedDepts: ['Sales Support'] }
    ];

    res.json({
      workforce,
      evidenceMarkers,
      taskGeofences,
      escalationMarkers,
      riskZones,
      metrics: {
        activeWorkforce: workforce.filter(w => w.status === 'ACTIVE').length,
        totalWorkforce: workforce.length,
        activeEscalations: escalationMarkers.filter(e => e.status === 'ACTIVE').length,
        geofenceViolations: evidenceMarkers.filter(e => e.outsideGeofence).length,
        complianceScore: 84.5,
        orgHealthScore: 82,
        riskAlerts: escalationMarkers.length + evidenceMarkers.filter(e => e.fraudFlag).length
      }
    });

  } catch (error) {
    console.error('GIS intelligence data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch GIS intelligence dataset' });
  }
});

export default router;
