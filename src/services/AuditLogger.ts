import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface AuditLogRecord {
  id: string;
  userId: string | null;
  name: string;
  role: string;
  department: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  IP: string;
  sessionId: string;
}

const getUserAgentInfo = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let deviceType = "Desktop";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("MSIE") || ua.includes("Trident")) browser = "Internet Explorer";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
    deviceType = "Mobile";
  } else if (/Tablet|iPad/i.test(ua)) {
    deviceType = "Tablet";
  }

  return { browser, operatingSystem: os, deviceType };
};

const getSessionId = () => {
  let sid = sessionStorage.getItem('supervisor_eye_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('supervisor_eye_session_id', sid);
  }
  return sid;
};

export class AuditLogger {
  /**
   * Automatically log an enterprise event to SQL DB and Firestore.
   */
  static async logEvent(
    action: string,
    module: string,
    description: string,
    profile: any,
    token: string | null
  ) {
    try {
      const { browser, operatingSystem, deviceType } = getUserAgentInfo();
      const sessionId = getSessionId();
      
      const record: AuditLogRecord = {
        id: 'audit_' + Math.random().toString(36).substring(2, 11),
        userId: profile?.id || null,
        name: profile ? `${profile.firstName} ${profile.lastName}` : 'Anonymous',
        role: profile?.role || 'Guest',
        department: profile?.department || 'N/A',
        action,
        module,
        description,
        timestamp: new Date().toISOString(),
        browser,
        operatingSystem,
        deviceType,
        IP: '127.0.0.1', // Default Client side IP
        sessionId
      };

      console.log('Logging Audit Event:', record);

      // 1. Log to PostgreSQL server-side
      if (token) {
        try {
          await fetch('/api/v1/auth/audit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              action,
              metadata: {
                module,
                description,
                browser,
                operatingSystem,
                deviceType,
                sessionId,
                name: record.name,
                role: record.role,
                department: record.department
              }
            })
          });
        } catch (sqlErr) {
          console.error('SQL audit log failed, continuing...', sqlErr);
        }
      }

      // 2. Log to Firestore
      if (db) {
        try {
          await addDoc(collection(db, 'audit_logs'), record);
        } catch (fsErr) {
          console.error('Firestore audit log failed, continuing...', fsErr);
        }
      }

      // 3. Keep local fallback copy for simulation demonstration
      const logsJSON = localStorage.getItem('supervisor_eye_local_audit_logs');
      const localLogs = logsJSON ? JSON.parse(logsJSON) : [];
      localLogs.unshift(record); // newest first
      localStorage.setItem('supervisor_eye_local_audit_logs', JSON.stringify(localLogs.slice(0, 100)));

    } catch (err) {
      console.error('General error writing audit log:', err);
    }
  }

  /**
   * Fetch audit logs for admin activity view.
   */
  static getLocalLogs(): AuditLogRecord[] {
    try {
      const logsJSON = localStorage.getItem('supervisor_eye_local_audit_logs');
      return logsJSON ? JSON.parse(logsJSON) : [];
    } catch {
      return [];
    }
  }
}
