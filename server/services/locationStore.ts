import { systemEvents } from './events.js';

export interface UserLocationPing {
  userId: string;
  firebaseUid?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  employeeNumber?: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  updatedAt: string;
  isSharing: boolean;
  isRealDevice: boolean;
  deviceInfo?: string;
}

// In-memory store for active live user locations
const liveLocationMap = new Map<string, UserLocationPing>();

export function updateLocationStore(ping: UserLocationPing) {
  liveLocationMap.set(ping.userId, ping);
  
  // Emit event for real-time WebSocket broadcast
  systemEvents.emit('notification', {
    type: 'LIVE_LOCATION_PING',
    userId: ping.userId,
    firstName: ping.firstName,
    lastName: ping.lastName,
    employeeName: `${ping.firstName} ${ping.lastName}`,
    email: ping.email,
    department: ping.department,
    role: ping.role,
    lat: ping.lat,
    lng: ping.lng,
    accuracy: ping.accuracy,
    speed: ping.speed,
    heading: ping.heading,
    timestamp: ping.updatedAt,
    isRealDevice: true,
    isSharing: ping.isSharing
  });
}

export function getAllLiveLocations(): UserLocationPing[] {
  return Array.from(liveLocationMap.values()).filter(p => p.isSharing);
}

export function getLiveLocationByUserId(userId: string): UserLocationPing | undefined {
  return liveLocationMap.get(userId);
}
