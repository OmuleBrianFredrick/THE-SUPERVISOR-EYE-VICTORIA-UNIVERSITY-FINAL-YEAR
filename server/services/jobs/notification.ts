import { db } from '../../db/index.js';
import { notifications } from '../../db/schema.js';
import { systemEvents } from '../events.js';

export async function handleNotificationJob(job: any) {
  const { jobType, payload } = job;
  
  if (jobType === 'dispatch-notification') {
    const { userId, notificationType, title, message } = payload;
    
    // Simulate push notification / email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Insert into DB to show in UI
    await db.insert(notifications).values({ 
       userId,
       notificationType,
       title,
       message,
       isRead: false
    });
    
    // Emit live push notification via WebSocket
    systemEvents.emit('notification', {
      targetUserId: userId,
      title,
      message,
      type: notificationType,
      timestamp: new Date().toISOString()
    });
    
    return { delivered: true, userId, type: notificationType };
  }
  
  throw new Error(`Unknown Notification job type: ${jobType}`);
}
