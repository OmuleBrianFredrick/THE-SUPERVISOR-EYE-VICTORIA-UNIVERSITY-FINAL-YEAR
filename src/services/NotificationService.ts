import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';

export interface NotificationRecord {
  id: string;
  userId: string | null; // null represents system/admin announcement
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  category: 
    | 'ACCOUNT_APPROVED' 
    | 'ACCOUNT_REJECTED' 
    | 'PENDING_APPROVAL' 
    | 'REPORT_APPROVED' 
    | 'REPORT_REJECTED' 
    | 'TASK_ASSIGNED' 
    | 'EVIDENCE_REQUESTED' 
    | 'PROFILE_UPDATED' 
    | 'PASSWORD_CHANGED' 
    | 'ADMIN_ANNOUNCEMENT';
  read: boolean;
  timestamp: string;
}

export class NotificationService {
  /**
   * Send a notification to a specific user (or system-wide if userId is null).
   */
  static async sendNotification(
    userId: string | null,
    title: string,
    message: string,
    category: NotificationRecord['category'],
    type: NotificationRecord['type'] = 'info'
  ) {
    try {
      const record: NotificationRecord = {
        id: 'notif_' + Math.random().toString(36).substring(2, 11),
        userId,
        title,
        message,
        category,
        type,
        read: false,
        timestamp: new Date().toISOString()
      };

      console.log('Sending Notification:', record);

      // 1. Direct cloud write
      if (db) {
        try {
          await addDoc(collection(db, 'notifications'), record);
        } catch (fsErr) {
          console.error('Firestore notification send failed:', fsErr);
        }
      }

      // 2. Local database syncing for instant mock demonstration
      const existing = localStorage.getItem('supervisor_eye_notifications');
      const notifs = existing ? JSON.parse(existing) : [];
      notifs.unshift(record);
      localStorage.setItem('supervisor_eye_notifications', JSON.stringify(notifs.slice(0, 100)));

      // Trigger a custom event so components can re-render in real-time
      window.dispatchEvent(new Event('supervisor_eye_notifications_updated'));

    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }

  /**
   * Subscribe to real-time notification stream.
   */
  static subscribeToNotifications(
    userId: string | null,
    onUpdate: (notifs: NotificationRecord[]) => void
  ): () => void {
    // 1. If Firebase is active and connected
    if (db) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId)
        );
        return onSnapshot(q, (snapshot) => {
          const fsNotifs: NotificationRecord[] = [];
          snapshot.forEach((doc) => {
            fsNotifs.push({ ...(doc.data() as NotificationRecord), id: doc.id });
          });
          // Sort newest first
          fsNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          onUpdate(fsNotifs);
        }, (err) => {
          console.warn("Firestore listener failed, using local fallback stream", err);
          this.setupLocalFallbackListener(userId, onUpdate);
        });
      } catch (err) {
        console.warn("Firestore setup failed, using local fallback stream", err);
      }
    }

    // 2. Local storage simulation mode (offline/preview)
    return this.setupLocalFallbackListener(userId, onUpdate);
  }

  private static setupLocalFallbackListener(
    userId: string | null,
    onUpdate: (notifs: NotificationRecord[]) => void
  ): () => void {
    const handleUpdate = () => {
      const existing = localStorage.getItem('supervisor_eye_notifications');
      let notifs: NotificationRecord[] = existing ? JSON.parse(existing) : [];
      // Filter for specific user or general system alerts
      notifs = notifs.filter(n => n.userId === userId || n.userId === null);
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(notifs);
    };

    // Initial load
    handleUpdate();

    window.addEventListener('supervisor_eye_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('supervisor_eye_notifications_updated', handleUpdate);
    };
  }

  /**
   * Mark a single notification as read.
   */
  static async markAsRead(notificationId: string) {
    try {
      if (db) {
        try {
          const docRef = doc(db, 'notifications', notificationId);
          await updateDoc(docRef, { read: true });
        } catch (fsErr) {
          // If the ID was generated locally, update locally
        }
      }

      // Update in local cache
      const existing = localStorage.getItem('supervisor_eye_notifications');
      if (existing) {
        const notifs: NotificationRecord[] = JSON.parse(existing);
        const updated = notifs.map(n => n.id === notificationId ? { ...n, read: true } : n);
        localStorage.setItem('supervisor_eye_notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('supervisor_eye_notifications_updated'));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  /**
   * Mark all user notifications as read.
   */
  static async markAllAsRead(userId: string | null) {
    try {
      if (db) {
        try {
          const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('read', '==', false)
          );
          const snapshot = await getDocs(q);
          const batch = writeBatch(db);
          snapshot.forEach((doc) => {
            batch.update(doc.ref, { read: true });
          });
          await batch.commit();
        } catch (fsErr) {
          console.error('Firestore batch mark read failed:', fsErr);
        }
      }

      // Update in local cache
      const existing = localStorage.getItem('supervisor_eye_notifications');
      if (existing) {
        const notifs: NotificationRecord[] = JSON.parse(existing);
        const updated = notifs.map(n => (n.userId === userId || n.userId === null) ? { ...n, read: true } : n);
        localStorage.setItem('supervisor_eye_notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('supervisor_eye_notifications_updated'));
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }

  /**
   * Bootstrap initial mock notifications for testing.
   */
  static seedInitialNotifications(userId: string | null) {
    if (!localStorage.getItem('supervisor_eye_notifications')) {
      const initial: NotificationRecord[] = [
        {
          id: 'seed_notif_1',
          userId,
          title: 'Welcome to Supervisor Eye',
          message: 'Your executive onboarding is complete. Explore performance graphs and compliance triggers.',
          type: 'success',
          category: 'ACCOUNT_APPROVED',
          read: false,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5m ago
        },
        {
          id: 'seed_notif_2',
          userId,
          title: 'Platform Maintenance Notice',
          message: 'Supervisor Eye servers are upgrading on June 30, at 04:00 UTC. Expect 5 minutes downtime.',
          type: 'info',
          category: 'ADMIN_ANNOUNCEMENT',
          read: false,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1h ago
        }
      ];
      localStorage.setItem('supervisor_eye_notifications', JSON.stringify(initial));
    }
  }
}
