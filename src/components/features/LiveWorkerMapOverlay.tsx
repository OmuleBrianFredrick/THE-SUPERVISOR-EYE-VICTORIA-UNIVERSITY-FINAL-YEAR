import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { Maximize2, Minimize2, X, Navigation, Users, Search, Target } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create a custom icon for workers
const createWorkerIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-worker-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

interface WorkerLocation {
  userId: string;
  employeeName: string;
  role: string;
  department: string;
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  isRealDevice: boolean;
}

const CenterMapOnWorkers = ({ workers }: { workers: WorkerLocation[] }) => {
  const map = useMap();
  useEffect(() => {
    if (workers.length > 0) {
      const bounds = L.latLngBounds(workers.map(w => [w.lat, w.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [workers, map]);
  return null;
};

export default function LiveWorkerMapOverlay() {
  const { getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [workers, setWorkers] = useState<Map<string, WorkerLocation>>(new Map());
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial GIS data
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch('/api/v1/governance/gis-data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const initialMap = new Map<string, WorkerLocation>();
          data.workforce?.forEach((w: any) => {
            initialMap.set(w.id, {
              userId: w.id,
              employeeName: `${w.firstName} ${w.lastName}`,
              role: w.jobTitle || w.roleType,
              department: w.department,
              lat: w.lat,
              lng: w.lng,
              timestamp: w.lastActivity,
              speed: w.speed,
              heading: w.heading,
              accuracy: w.accuracy,
              isRealDevice: w.isRealDevice
            });
          });
          setWorkers(initialMap);
        }
      } catch (err) {
        console.error('Failed to fetch initial GIS data for workers', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'LIVE_NOTIFICATION' && msg.type === 'LIVE_LOCATION_PING') {
          setWorkers(prev => {
            const next = new Map(prev);
            next.set(msg.userId, {
              userId: msg.userId,
              employeeName: msg.employeeName,
              role: msg.role,
              department: msg.department,
              lat: msg.lat,
              lng: msg.lng,
              timestamp: msg.timestamp,
              speed: msg.speed,
              heading: msg.heading,
              accuracy: msg.accuracy,
              isRealDevice: msg.isRealDevice
            });
            return next;
          });
        }
      } catch (e) {
        // ignore
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [isOpen, getToken]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-[9990] bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer transition transform hover:scale-105 border border-indigo-400 font-bold text-xs"
        title="Open Live Worker Radar"
      >
        <Target className="w-5 h-5 animate-pulse" />
        <span>Live Worker Radar</span>
      </button>
    );
  }

  const workersList = Array.from(workers.values());

  return (
    <div className={`fixed z-[9995] bg-white border border-slate-200 shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
      isMinimized 
        ? 'bottom-24 right-4 w-64 h-12 rounded-xl' 
        : 'bottom-4 right-4 w-[400px] h-[550px] rounded-2xl max-w-[calc(100vw-32px)]'
    }`}>
      {/* Header (Draggable Handle ideally, but we make it simple here) */}
      <div className="bg-slate-900 text-white p-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-sm">Live Worker Radar</span>
          {!isMinimized && <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-black">{workersList.length} Active</span>}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 z-[1000] bg-slate-50/50 backdrop-blur-sm flex items-center justify-center">
              <span className="text-slate-500 font-bold text-xs animate-pulse">Initializing Radar...</span>
            </div>
          )}
          
          <MapContainer 
            center={[0.3476, 32.5825]} // Default to Kampala
            zoom={12} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {workersList.map(worker => (
              <Marker 
                key={worker.userId} 
                position={[worker.lat, worker.lng]} 
                icon={createWorkerIcon(worker.isRealDevice ? '#10b981' : '#6366f1')}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[150px]">
                    <h4 className="font-bold text-sm text-slate-900">{worker.employeeName}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{worker.role}</p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dept:</span>
                        <span className="font-semibold">{worker.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Speed:</span>
                        <span className="font-semibold">{worker.speed != null ? `${worker.speed} km/h` : '--'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last Ping:</span>
                        <span className="font-semibold">{new Date(worker.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            <CenterMapOnWorkers workers={workersList} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}
