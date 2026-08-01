import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Navigation, Signal, RefreshCw, Eye, EyeOff, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface LocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: string | null;
  status: 'INITIALIZING' | 'ACTIVE' | 'PAUSED' | 'PERMISSION_DENIED' | 'UNSUPPORTED' | 'ERROR';
  errorMessage: string | null;
}

export default function AutomaticLocationTracker() {
  const { currentUser: user, profile, getToken } = useAuth();
  
  // Enabled by default across all signed in users and departments
  const [isSharingEnabled, setIsSharingEnabled] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  
  const [locationState, setLocationState] = useState<LocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    speed: null,
    heading: null,
    timestamp: null,
    status: 'INITIALIZING',
    errorMessage: null
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Send location ping to backend server
  const sendLocationPing = useCallback(async (
    lat: number, 
    lng: number, 
    accuracy?: number | null, 
    speed?: number | null, 
    heading?: number | null,
    overrideSharing?: boolean
  ) => {
    if (!user) return;
    setIsSyncing(true);

    const sharing = overrideSharing !== undefined ? overrideSharing : isSharingEnabled;

    try {
      const token = await getToken();
      if (!token) return;

      const payload = {
        lat,
        lng,
        accuracy,
        speed,
        heading,
        isSharing: sharing,
        deviceInfo: navigator.userAgent
      };

      // 1. Send via HTTP API
      const res = await fetch('/api/v1/auth/location-ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setLastSyncTime(new Date().toLocaleTimeString());
      }

      // 2. Send via WebSocket if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'LOCATION_PING',
          userId: user.uid,
          role: profile?.role || '',
          department: profile?.department || '',
          employeeName: profile ? `${profile.firstName} ${profile.lastName}` : user.email,
          lat,
          lng,
          accuracy,
          speed,
          heading,
          isSharing: sharing,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error('Failed to send location ping:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user, profile, getToken, isSharingEnabled]);

  // Connect WebSocket for low-latency live streaming
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'AUTH',
        userId: user.uid,
        role: profile?.role || ''
      }));
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, profile]);

  // Handle position success callback
  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const timeStr = new Date(position.timestamp).toISOString();

    setLocationState({
      lat: latitude,
      lng: longitude,
      accuracy: Math.round(accuracy),
      speed: speed ? Math.round(speed * 3.6) : 0, // convert m/s to km/h
      heading: heading ? Math.round(heading) : null,
      timestamp: timeStr,
      status: isSharingEnabled ? 'ACTIVE' : 'PAUSED',
      errorMessage: null
    });

    if (isSharingEnabled) {
      sendLocationPing(latitude, longitude, accuracy, speed, heading, true);
    }
  }, [isSharingEnabled, sendLocationPing]);

  // Handle position error callback
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let msg = 'Unable to acquire GPS fix.';
    let status: LocationState['status'] = 'ERROR';

    if (error.code === error.PERMISSION_DENIED) {
      msg = 'Location permission denied by browser/device settings.';
      status = 'PERMISSION_DENIED';
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      msg = 'GPS signal unavailable or weak.';
    } else if (error.code === error.TIMEOUT) {
      msg = 'GPS location request timed out.';
    }

    setLocationState(prev => ({
      ...prev,
      status,
      errorMessage: msg
    }));
  }, []);

  // Request & Watch position continuously
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationState(prev => ({
        ...prev,
        status: 'UNSUPPORTED',
        errorMessage: 'Geolocation is not supported by your browser.'
      }));
      return;
    }

    // Clear previous watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    };

    // First request immediate current position
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );
  }, [handlePositionSuccess, handlePositionError]);

  // Trigger tracking on mount when user is authenticated
  useEffect(() => {
    if (!user) return;

    startTracking();

    // Heartbeat timer every 15 seconds to ensure active pings
    const heartbeatInterval = setInterval(() => {
      if (navigator.geolocation && isSharingEnabled) {
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          () => {}, // ignore heartbeat error
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
      }
    }, 15000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clearInterval(heartbeatInterval);
    };
  }, [user, startTracking, isSharingEnabled, handlePositionSuccess]);

  // Manual trigger for refresh
  const handleManualRefresh = () => {
    if (navigator.geolocation) {
      setIsSyncing(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionSuccess(pos);
          setIsSyncing(false);
        },
        (err) => {
          handlePositionError(err);
          setIsSyncing(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const toggleSharing = () => {
    const nextState = !isSharingEnabled;
    setIsSharingEnabled(nextState);
    if (locationState.lat && locationState.lng) {
      sendLocationPing(
        locationState.lat, 
        locationState.lng, 
        locationState.accuracy, 
        locationState.speed, 
        locationState.heading, 
        nextState
      );
    }
    setLocationState(prev => ({
      ...prev,
      status: nextState ? 'ACTIVE' : 'PAUSED'
    }));
  };

  if (!user || !profile) return null;

  return (
    <aside aria-label="Real-time Location Status" className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full sm:w-auto font-sans animate-fadeIn">
      <div className={`bg-slate-900/95 backdrop-blur-md text-white border ${
        locationState.status === 'ACTIVE' 
          ? 'border-emerald-500/50 shadow-emerald-900/30' 
          : locationState.status === 'PERMISSION_DENIED'
          ? 'border-amber-500/50 shadow-amber-900/30'
          : 'border-slate-700 shadow-slate-950/50'
      } rounded-2xl shadow-2xl overflow-hidden transition-all duration-300`}>
        
        {/* Header Bar */}
        <div className="p-3 flex items-center justify-between gap-3 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              {locationState.status === 'ACTIVE' && (
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              )}
              <div className={`w-2.5 h-2.5 rounded-full ${
                locationState.status === 'ACTIVE' ? 'bg-emerald-500' :
                locationState.status === 'PAUSED' ? 'bg-amber-500' :
                locationState.status === 'PERMISSION_DENIED' ? 'bg-rose-500' : 'bg-slate-500'
              }`} />
            </div>
            
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold tracking-tight text-slate-200">
                Live GPS Location Sharing
              </span>
            </div>

            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
              locationState.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              locationState.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              locationState.status === 'PERMISSION_DENIED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              {locationState.status === 'ACTIVE' ? 'Active' :
               locationState.status === 'PAUSED' ? 'Paused' :
               locationState.status === 'PERMISSION_DENIED' ? 'Blocked' : 'Connecting'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isSyncing}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
              title="Re-sync Location Fix"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title={isMinimized ? 'Expand Location Details' : 'Minimize Details'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Details Body */}
        {!isMinimized && (
          <div className="p-3.5 space-y-3 bg-slate-900/90 text-xs">
            {locationState.status === 'ACTIVE' && locationState.lat && locationState.lng ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Coordinates</span>
                    <span className="font-mono text-slate-200 font-bold text-[11px]">
                      {locationState.lat.toFixed(5)}, {locationState.lng.toFixed(5)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">GPS Accuracy</span>
                    <span className="font-mono text-emerald-400 font-bold text-[11px]">
                      ±{locationState.accuracy ?? '--'} meters
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-indigo-400" />
                    <span>Speed: {locationState.speed ? `${locationState.speed} km/h` : 'Stationary'}</span>
                  </div>
                  <span>Last Ping: {lastSyncTime || 'Just now'}</span>
                </div>
              </div>
            ) : locationState.status === 'PERMISSION_DENIED' ? (
              <div className="p-2.5 bg-amber-950/40 border border-amber-800/50 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Browser location permission is disabled. Please enable location permissions in browser settings to share automatic real-time location.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startTracking}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  Enable Browser Geolocation
                </button>
              </div>
            ) : (
              <div className="p-2 bg-slate-950/60 rounded-xl text-center text-slate-400 text-[11px]">
                {locationState.errorMessage || 'Acquiring GPS fix from device...'}
              </div>
            )}

            {/* Department & Account Context */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate">Dept: <strong className="text-slate-200 font-semibold">{profile.department || 'Operations'}</strong></span>
              <button
                type="button"
                onClick={toggleSharing}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  isSharingEnabled 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isSharingEnabled ? (
                  <>
                    <EyeOff className="w-3 h-3 text-amber-400" />
                    <span>Pause Sharing</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 text-emerald-300" />
                    <span>Resume Sharing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
