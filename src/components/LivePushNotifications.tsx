import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Bell } from 'lucide-react';

export default function LivePushNotifications() {
  const { currentUser: user, profile } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user || !profile) return;
    
    // Check Notification API permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
       if (Notification.permission === 'default') {
          Notification.requestPermission();
       }
    }

    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Authenticate the websocket connection
        ws.send(JSON.stringify({ 
           type: 'AUTH', 
           userId: user.uid,
           role: profile.role || ''
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'LIVE_NOTIFICATION') {
             // In-App Toast
             toast(data.message, 'success');

             // Browser Push Notification
             if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(data.title, {
                  body: data.message,
                  icon: '/icon.png'
                });
             }
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        // Reconnect after 5 seconds
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [user, profile, toast]);

  return null;
}
