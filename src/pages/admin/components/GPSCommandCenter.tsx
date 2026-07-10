import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Map, MapPin, Search, Shield, Users, AlertTriangle, 
  Activity, ActivityIcon, RefreshCw, Filter, Compass, 
  Layers, Flame, CheckCircle, Info, ExternalLink, User, CheckSquare 
} from 'lucide-react';
import L from 'leaflet';

export default function GPSCommandCenter() {
  const { getToken } = useAuth();
  
  // Data States
  const [gisData, setGisData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    department: 'ALL',
    status: 'ALL',
    layer: 'ALL', // ALL, WORKFORCE, EVIDENCE, GEOFENCE, ESCALATIONS, AI_RISK, HEATMAP
    heatmapType: 'risk' // escalation, compliance, productivity, density, risk
  });

  // Selected Object for Drilldown
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Live WebSocket Event Stream
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');

  // Leaflet Map Refs & Instances
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);
  const riskLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const liveEventLayerRef = useRef<L.LayerGroup | null>(null);

  // Append Leaflet CSS dynamically to document head
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Fetch initial GIS Intelligence Dataset from our new backend endpoint
  const fetchGISDataset = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch('/api/v1/governance/gis-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGisData(data);
      }
    } catch (err) {
      console.error('Error fetching GIS dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGISDataset();
  }, []);

  // WebSocket connection for real-time simulated broadcasts
  useEffect(() => {
    let ws: WebSocket;
    const connectWS = () => {
      setWsStatus('CONNECTING');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsStatus('CONNECTED');
        console.log('GIS WebSocket Connected successfully.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Push to events list
          setLiveEvents(prev => [data, ...prev.slice(0, 19)]);

          // Update GIS metrics based on incoming event to make it feel live
          setGisData((prev: any) => {
            if (!prev) return prev;
            
            // Dynamically increment values to show active feedback loops
            let updatedMetrics = { ...prev.metrics };
            if (data.type === 'ESCALATION_TRIGGERED') {
              updatedMetrics.activeEscalations += 1;
              updatedMetrics.riskAlerts += 1;
            } else if (data.type === 'EVIDENCE_UPLOADED' && data.outsideGeofence) {
              updatedMetrics.geofenceViolations += 1;
              updatedMetrics.riskAlerts += 1;
            } else if (data.type === 'REPORT_SUBMITTED') {
              updatedMetrics.complianceScore = Math.min(100, Math.max(0, updatedMetrics.complianceScore + (data.status === 'VERIFIED' ? 0.1 : -0.2)));
            }

            return {
              ...prev,
              metrics: updatedMetrics
            };
          });

          // Draw a real-time pulse beacon on the Leaflet map at the incoming coordinate
          if (mapRef.current && liveEventLayerRef.current && data.lat && data.lng) {
            const eventLatLng = L.latLng(data.lat, data.lng);
            
            const pulseIcon = L.divIcon({
              className: 'custom-pulse-marker',
              html: `
                <div class="relative flex items-center justify-center">
                  <span class="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-pink-500 opacity-60"></span>
                  <span class="relative inline-flex rounded-full h-4 w-4 bg-pink-600 border border-white"></span>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            const marker = L.marker(eventLatLng, { icon: pulseIcon }).addTo(liveEventLayerRef.current);
            
            // Auto-pan slightly towards the live update
            mapRef.current.setView(eventLatLng, mapRef.current.getZoom(), { animate: true });

            // Create a temporary beautiful popup
            marker.bindPopup(`
              <div class="p-2 font-sans">
                <div class="text-[10px] font-extrabold text-pink-600 uppercase tracking-widest animate-pulse">⚡ LIVE BROADCAST</div>
                <div class="font-black text-sm text-slate-900 mt-1">${data.title}</div>
                <div class="text-xs text-slate-600 mt-0.5">Assigned to: <strong>${data.employeeName}</strong></div>
                <div class="text-[10px] text-slate-400 font-mono mt-1">${new Date(data.timestamp).toLocaleTimeString()}</div>
              </div>
            `, { closeButton: false }).openPopup();

            // Clean up marker after 6 seconds
            setTimeout(() => {
              if (liveEventLayerRef.current && marker) {
                liveEventLayerRef.current.removeLayer(marker);
              }
            }, 6000);
          }
        } catch (err) {
          console.error('Error reading WS message:', err);
        }
      };

      ws.onclose = () => {
        setWsStatus('DISCONNECTED');
        console.log('GIS WebSocket Disconnected. Reconnecting...');
        setTimeout(connectWS, 10000); // Attempt reconnect every 10 seconds
      };

      ws.onerror = () => {
        setWsStatus('DISCONNECTED');
      };
    };

    connectWS();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Initialize and redraw Leaflet Map based on active layers and filters
  useEffect(() => {
    if (!gisData) return;

    // Center map around Uganda (Kampala center)
    const defaultCenter: L.LatLngExpression = [0.3476, 32.5825];
    const defaultZoom = 8;

    if (!mapRef.current) {
      // Create main Map
      mapRef.current = L.map('gis-map-canvas', {
        zoomControl: true,
        attributionControl: false
      }).setView(defaultCenter, defaultZoom);

      // Add OpenStreetMap Tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      // Initialize Layer Groups
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      geofenceLayerRef.current = L.layerGroup().addTo(mapRef.current);
      riskLayerRef.current = L.layerGroup().addTo(mapRef.current);
      heatmapLayerRef.current = L.layerGroup().addTo(mapRef.current);
      liveEventLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Clear all layers before drawing to support dynamic updates
    markersLayerRef.current?.clearLayers();
    geofenceLayerRef.current?.clearLayers();
    riskLayerRef.current?.clearLayers();
    heatmapLayerRef.current?.clearLayers();

    const { workforce, evidenceMarkers, taskGeofences, escalationMarkers, riskZones } = gisData;

    // Apply Filter Search Terms
    const filterBySearch = (val: string) => {
      if (!activeFilters.search) return true;
      const term = activeFilters.search.toLowerCase();
      return val.toLowerCase().includes(term);
    };

    const filterByDept = (dept: string) => {
      if (activeFilters.department === 'ALL') return true;
      return dept.toUpperCase() === activeFilters.department.toUpperCase();
    };

    // 1. Draw Workforce Intelligence Layer
    if (activeFilters.layer === 'ALL' || activeFilters.layer === 'WORKFORCE') {
      workforce.forEach((w: any) => {
        if (!filterBySearch(`${w.firstName} ${w.lastName} ${w.employeeNumber} ${w.department}`)) return;
        if (!filterByDept(w.department)) return;
        if (activeFilters.status !== 'ALL' && w.status !== activeFilters.status) return;

        // Leaflet marker with clean custom SVG design representing state colors
        const color = w.status === 'ACTIVE' ? '#10b981' : w.status === 'IDLE' ? '#f59e0b' : '#ef4444';
        
        const customIcon = L.divIcon({
          className: 'custom-wf-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-7 w-7 rounded-full opacity-35 animate-ping" style="background-color: ${color}"></span>
              <div class="relative rounded-full h-5 w-5 flex items-center justify-center text-white text-[9px] font-black shadow-lg border border-white" style="background-color: ${color}">
                ${w.firstName[0]}${w.lastName[0]}
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([w.lat, w.lng], { icon: customIcon })
          .addTo(markersLayerRef.current!)
          .on('click', () => {
            setSelectedItem({
              type: 'WORKFORCE',
              data: w
            });
          });
      });
    }

    // 2. Draw Evidence Intelligence Layer
    if (activeFilters.layer === 'ALL' || activeFilters.layer === 'EVIDENCE') {
      evidenceMarkers.forEach((e: any) => {
        if (!filterBySearch(e.employeeName)) return;

        const isVerified = e.verificationStatus === 'VERIFIED';
        const isRejected = e.verificationStatus === 'REJECTED';
        const isFlagged = e.verificationStatus === 'FLAGGED' || e.outsideGeofence || e.fraudFlag;
        
        const color = isVerified ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
        const badgeText = e.outsideGeofence ? 'OUTSIDE' : isVerified ? 'VERIFIED' : 'PENDING';

        const customIcon = L.divIcon({
          className: 'custom-ev-marker',
          html: `
            <div class="w-6 h-6 rounded-lg shadow-md border-2 border-white flex items-center justify-center text-white" style="background-color: ${color}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([e.lat, e.lng], { icon: customIcon })
          .addTo(markersLayerRef.current!)
          .on('click', () => {
            setSelectedItem({
              type: 'EVIDENCE',
              data: e
            });
          });
      });
    }

    // 3. Draw Geofence Compliance Layer (Task targets + boundary buffers)
    if (activeFilters.layer === 'ALL' || activeFilters.layer === 'GEOFENCE') {
      taskGeofences.forEach((g: any) => {
        if (!filterBySearch(`${g.title} ${g.assigneeName} ${g.department}`)) return;
        if (!filterByDept(g.department)) return;

        // Custom Geofence target pin
        const pinIcon = L.divIcon({
          className: 'custom-gf-marker',
          html: `
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#3b82f6" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 22]
        });

        const marker = L.marker([g.lat, g.lng], { icon: pinIcon })
          .addTo(geofenceLayerRef.current!)
          .on('click', () => {
            setSelectedItem({
              type: 'GEOFENCE',
              data: g
            });
          });

        // Draw circular Geofence boundary buffer
        L.circle([g.lat, g.lng], {
          radius: g.radius,
          color: '#3b82f6',
          weight: 1.5,
          opacity: 0.8,
          fillColor: '#3b82f6',
          fillOpacity: 0.12
        }).addTo(geofenceLayerRef.current!);
      });
    }

    // 4. Draw Escalation Intelligence Layer
    if (activeFilters.layer === 'ALL' || activeFilters.layer === 'ESCALATIONS') {
      escalationMarkers.forEach((esc: any) => {
        if (!filterBySearch(`${esc.reason} ${esc.employeeName} ${esc.department}`)) return;
        if (!filterByDept(esc.department)) return;

        const color = esc.severity === 'CRITICAL' ? '#ef4444' : esc.severity === 'HIGH' ? '#f97316' : '#eab308';

        const customIcon = L.divIcon({
          className: 'custom-esc-marker',
          html: `
            <div class="relative flex items-center justify-center animate-bounce">
              <div class="w-5 h-5 rotate-45 border-2 border-white flex items-center justify-center shadow-lg" style="background-color: ${color}">
                <div class="-rotate-45 text-[8px] font-black text-white">!</div>
              </div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([esc.lat, esc.lng], { icon: customIcon })
          .addTo(markersLayerRef.current!)
          .on('click', () => {
            setSelectedItem({
              type: 'ESCALATION',
              data: esc
            });
          });
      });
    }

    // 5. Draw AI Risk Intelligence Layer
    if (activeFilters.layer === 'ALL' || activeFilters.layer === 'AI_RISK') {
      riskZones.forEach((z: any) => {
        // Red translucent polygons/circles for high risk density
        L.circle([z.lat, z.lng], {
          radius: z.radius,
          color: '#db2777',
          weight: 2,
          dashArray: '5, 8',
          opacity: 0.8,
          fillColor: '#db2777',
          fillOpacity: 0.18
        }).addTo(riskLayerRef.current!)
        .on('click', () => {
          setSelectedItem({
            type: 'AI_RISK',
            data: z
          });
        });
      });
    }

    // 6. Draw Heatmap Layer (renders dense low-opacity overlay layers derived dynamically from actual database records)
    if (activeFilters.layer === 'HEATMAP') {
      let heatmapData: any[] = [];
      let colorGradient = '#f43f5e'; // red

      if (activeFilters.heatmapType === 'escalation') {
        heatmapData = escalationMarkers;
        colorGradient = '#ef4444'; // critical red
      } else if (activeFilters.heatmapType === 'compliance') {
        heatmapData = evidenceMarkers.filter((e: any) => e.outsideGeofence || e.fraudFlag);
        colorGradient = '#f57c00'; // orange
      } else if (activeFilters.heatmapType === 'productivity') {
        heatmapData = workforce.filter((w: any) => w.performanceRating > 85);
        colorGradient = '#10b981'; // emerald productivity
      } else if (activeFilters.heatmapType === 'density') {
        heatmapData = workforce;
        colorGradient = '#8b5cf6'; // purple density
      } else { // default to overall risk
        heatmapData = [...escalationMarkers, ...evidenceMarkers.filter((e: any) => e.fraudFlag)];
        colorGradient = '#db2777'; // pink risk
      }

      heatmapData.forEach((pt: any) => {
        L.circle([pt.lat, pt.lng], {
          radius: 35000,
          color: colorGradient,
          weight: 0,
          opacity: 0,
          fillColor: colorGradient,
          fillOpacity: 0.25
        }).addTo(heatmapLayerRef.current!);
        
        L.circle([pt.lat, pt.lng], {
          radius: 12000,
          color: colorGradient,
          weight: 0,
          opacity: 0,
          fillColor: colorGradient,
          fillOpacity: 0.45
        }).addTo(heatmapLayerRef.current!);
      });
    }

  }, [gisData, activeFilters]);

  // Adjust map fit bounds to fit Uganda perfectly
  const resetMapBounds = () => {
    if (mapRef.current) {
      mapRef.current.setView([0.3476, 32.5825], 8, { animate: true });
    }
  };

  return (
    <div id="gps-command-center" className="max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      
      {/* Dynamic Header Metrics Dashboard */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Staff</div>
            <div className="text-xl font-black text-slate-800">
              {gisData?.metrics?.activeWorkforce || 0} <span className="text-xs font-normal text-slate-500">/ {gisData?.metrics?.totalWorkforce || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escalations</div>
            <div className="text-xl font-black text-slate-800">
              {gisData?.metrics?.activeEscalations || 0}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geofence Viol.</div>
            <div className="text-xl font-black text-slate-800">
              {gisData?.metrics?.geofenceViolations || 0}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Alerts</div>
            <div className="text-xl font-black text-slate-800">
              {gisData?.metrics?.riskAlerts || 0}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance</div>
            <div className="text-xl font-black text-slate-800">
              {gisData?.metrics?.complianceScore ? `${gisData.metrics.complianceScore.toFixed(1)}%` : '0.0%'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3 bg-slate-900 text-white border-slate-950">
          <div className="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-pink-500 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GIS System Status</div>
            <div className="text-sm font-black text-emerald-400 tracking-wider">
              {wsStatus === 'CONNECTED' ? '● LIVE SYNC' : '● RETRYING'}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Control & Layout Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Left Side: Filter, Map & Live Update Feed */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          
          {/* Advanced Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              {/* Universal Search bar */}
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search Employee, Code or Region..."
                  value={activeFilters.search}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9 pr-4 py-1.5 w-full text-xs font-medium border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 text-slate-800 placeholder:text-slate-400 transition"
                />
              </div>

              {/* Department selector */}
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50">
                <Filter className="w-3.5 h-3.5" />
                <select 
                  value={activeFilters.department}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Sales">Sales</option>
                  <option value="Merchandising">Merchandising</option>
                  <option value="Field Audit">Field Audit</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>

              {/* Status selector */}
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50">
                <ActivityIcon className="w-3.5 h-3.5" />
                <select 
                  value={activeFilters.status}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  <option value="ALL">All Staff States</option>
                  <option value="ACTIVE">🟢 Active</option>
                  <option value="IDLE">🟡 Idle</option>
                  <option value="HIGH_RISK">🔴 High Risk</option>
                </select>
              </div>

              {/* Layer Selection */}
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50">
                <Layers className="w-3.5 h-3.5" />
                <select 
                  value={activeFilters.layer}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, layer: e.target.value }))}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  <option value="ALL">Show All GIS Layers</option>
                  <option value="WORKFORCE">Workforce Layer</option>
                  <option value="EVIDENCE">Evidence Layer</option>
                  <option value="GEOFENCE">Geofence Boundaries</option>
                  <option value="ESCALATIONS">Escalation Hotspots</option>
                  <option value="AI_RISK">AI Risk Areas</option>
                  <option value="HEATMAP">Heatmap Overlays</option>
                </select>
              </div>

              {/* Heatmap Type Sub-Selector */}
              {activeFilters.layer === 'HEATMAP' && (
                <div className="flex items-center gap-1.5 border border-pink-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-pink-700 bg-pink-50 animate-fadeIn">
                  <Flame className="w-3.5 h-3.5" />
                  <select 
                    value={activeFilters.heatmapType}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, heatmapType: e.target.value }))}
                    className="bg-transparent outline-none cursor-pointer"
                  >
                    <option value="risk">Risk Heatmap</option>
                    <option value="escalation">Escalation Hotspots</option>
                    <option value="compliance">Compliance Mismatch</option>
                    <option value="productivity">Productivity Density</option>
                    <option value="density">Workforce Density</option>
                  </select>
                </div>
              )}
            </div>

            <button 
              onClick={resetMapBounds}
              title="Reset Map to Uganda Bounds"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset View
            </button>
          </div>

          {/* Map canvas container */}
          <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner relative overflow-hidden min-h-0">
            <div id="gis-map-canvas" className="w-full h-full z-0" />
            
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
                <RefreshCw className="w-10 h-10 text-pink-600 animate-spin" />
                <span className="font-bold text-slate-700 text-sm tracking-tight">Accessing Uganda GIS Dataset...</span>
              </div>
            )}
          </div>

          {/* Real-time WebSocket Live Feed log */}
          <div className="bg-slate-950 text-slate-300 rounded-xl p-4 border border-slate-800 shadow-md shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
              <span className="text-xs font-black tracking-widest text-pink-500 uppercase">Live Spatial Feed</span>
            </div>
            
            <div className="flex-1 text-xs text-slate-400 font-mono overflow-hidden truncate">
              {liveEvents.length > 0 ? (
                <span>
                  <strong className="text-emerald-400">[{(liveEvents[0].type || '').toUpperCase()}]</strong> {liveEvents[0].title} - Submitter: <strong className="text-white">{liveEvents[0].employeeName}</strong> ({liveEvents[0].department})
                </span>
              ) : (
                <span className="animate-pulse">Awaiting satellite spatial transmissions on Uganda network...</span>
              )}
            </div>
            
            <div className="text-[10px] font-bold font-mono text-slate-500 uppercase">
              {wsStatus === 'CONNECTED' ? 'SAT_ONLINE' : 'SAT_RECONNECT'}
            </div>
          </div>
        </div>

        {/* Right Side: Navigation, Incident List & Drilldown details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-600" /> GIS Intelligence Inspector
            </h3>
            {selectedItem && (
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedItem ? (
              // Default view: Instruct User how to interact
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 mb-3 animate-pulse">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Geospatial Explorer</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Click any marker or overlay region on the map to inspect live employee details, report evidence, and verify compliance.
                </p>
                
                {/* Simulated quick links to jump context */}
                <div className="mt-6 w-full space-y-2 border-t border-slate-100 pt-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left mb-2">Operational hotspots</div>
                  
                  {gisData?.escalationMarkers?.slice(0, 3).map((esc: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedItem({ type: 'ESCALATION', data: esc })}
                      className="w-full text-left p-2 rounded-lg border border-slate-100 hover:border-pink-300 hover:bg-pink-50/30 transition text-xs flex justify-between items-center gap-2"
                    >
                      <span className="truncate font-semibold text-slate-700">{esc.reason}</span>
                      <span className="shrink-0 text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase">CRITICAL</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Active context details: Drill-down panels (No dead ends!)
              <div className="space-y-4 animate-fadeIn">
                
                {/* Workforce Employee Profile */}
                {selectedItem.type === 'WORKFORCE' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                        {selectedItem.data.firstName[0]}{selectedItem.data.lastName[0]}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                          {selectedItem.data.firstName} {selectedItem.data.lastName}
                        </h4>
                        <div className="text-xs text-slate-500">{selectedItem.data.jobTitle}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Staff ID</span>
                        <strong className="text-slate-700 font-mono">{selectedItem.data.employeeNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Department</span>
                        <strong className="text-slate-700">{selectedItem.data.department}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Status</span>
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black rounded-sm uppercase mt-0.5 ${
                          selectedItem.data.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          selectedItem.data.status === 'IDLE' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {selectedItem.data.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Compliance Rating</span>
                        <strong className="text-slate-700">{selectedItem.data.performanceRating}%</strong>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Current Spatial Coordinates</h5>
                      <p className="font-mono text-xs text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {selectedItem.data.lat.toFixed(6)}, {selectedItem.data.lng.toFixed(6)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">Active Mission</span>
                      <div className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-100 p-2 rounded-lg">
                        {selectedItem.data.currentTask}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">Last Active Connection</span>
                      <div className="text-xs text-slate-600 font-medium">
                        {new Date(selectedItem.data.lastActivity).toLocaleString()}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          window.location.search = `?tab=staff-intelligence&search=${selectedItem.data.firstName}`;
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5" /> Personnel Analytics Profile
                      </button>
                    </div>
                  </div>
                )}

                {/* Evidence Details */}
                {selectedItem.type === 'EVIDENCE' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-pink-100 text-pink-700">
                        {selectedItem.data.mediaType}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        selectedItem.data.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        selectedItem.data.verificationStatus === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedItem.data.verificationStatus}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-800">Captured Field Evidence</h4>
                    
                    <div className="aspect-video w-full rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400" 
                        alt="Evidence placeholder" 
                        className="object-cover w-full h-full opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                        <div className="text-[10px] font-bold text-white tracking-tight flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> GPS Latched Image
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Field Staff</span>
                        <strong className="text-slate-700">{selectedItem.data.employeeName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Geofence Compliance Status</span>
                        <div className={`mt-1 flex items-center gap-1.5 font-bold ${selectedItem.data.outsideGeofence ? 'text-rose-600' : 'text-emerald-600'}`}>
                          <Compass className="w-4 h-4" />
                          {selectedItem.data.outsideGeofence ? '🚨 GEOFENCE BREACH DETECTED' : '✅ Verified location match'}
                        </div>
                      </div>
                      {selectedItem.data.outsideGeofence && (
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 text-rose-800">
                          <strong>Breach Alert:</strong> Submission coordinate was captured beyond the 50m allowable buffer radius for the assigned retail outlet.
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Captured GPS Coordinates</span>
                        <span className="font-mono text-slate-600 block bg-slate-50 p-1.5 rounded border mt-0.5">
                          {selectedItem.data.lat.toFixed(6)}, {selectedItem.data.lng.toFixed(6)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Captured Timestamp</span>
                        <span className="text-slate-600 block">
                          {new Date(selectedItem.data.capturedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          window.location.search = `?tab=media&search=${selectedItem.data.id.substring(0,6)}`;
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Media Governance Review
                      </button>
                    </div>
                  </div>
                )}

                {/* Geofence Boundary details */}
                {selectedItem.type === 'GEOFENCE' && (
                  <div className="space-y-4 text-xs">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-700">
                      Geofence Boundary
                    </span>
                    
                    <h4 className="font-black text-sm text-slate-800">{selectedItem.data.title}</h4>
                    <p className="text-slate-600">{selectedItem.data.description}</p>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Assigned Retail Representative</span>
                        <strong className="text-slate-700">{selectedItem.data.assigneeName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Operating Department</span>
                        <strong className="text-slate-700">{selectedItem.data.department}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Allowed Tolerance Radius</span>
                        <strong className="text-slate-700">{selectedItem.data.radius} meters</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Target Center GPS Location</span>
                        <span className="font-mono text-slate-600 block bg-slate-50 p-1.5 rounded border mt-0.5">
                          {selectedItem.data.lat.toFixed(6)}, {selectedItem.data.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          window.location.search = `?tab=compliance&search=${selectedItem.data.assigneeName}`;
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Compliance Verification Center
                      </button>
                    </div>
                  </div>
                )}

                {/* Escalations hotspot details */}
                {selectedItem.type === 'ESCALATION' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-700 animate-pulse">
                        ESCALATED
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-700">
                        {selectedItem.data.severity} SEVERITY
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-800">Compliance SLA Incident</h4>
                    
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-900 space-y-1.5">
                      <span className="block text-[9px] font-bold text-rose-500 uppercase">Root Cause Detail</span>
                      <strong className="text-xs leading-relaxed block">{selectedItem.data.reason}</strong>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Responsible Staff Member</span>
                        <strong className="text-slate-700">{selectedItem.data.employeeName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Incident Department</span>
                        <strong className="text-slate-700">{selectedItem.data.department}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Escalated Escalation Authority</span>
                        <strong className="text-slate-700">{selectedItem.data.escalatedTo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Incident Location Coordinates</span>
                        <span className="font-mono text-slate-600 block bg-slate-50 p-1.5 rounded border mt-0.5">
                          {selectedItem.data.lat.toFixed(6)}, {selectedItem.data.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          window.location.search = `?tab=escalations&search=${selectedItem.data.employeeName}`;
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Escalations Management Engine
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Risk Area detail */}
                {selectedItem.type === 'AI_RISK' && (
                  <div className="space-y-4 text-xs">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-pink-100 text-pink-700 animate-pulse">
                      AI RISK PREDICTION
                    </span>
                    
                    <h4 className="font-black text-sm text-slate-800">{selectedItem.data.name}</h4>
                    
                    <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 text-pink-900 space-y-1">
                      <div className="text-[10px] font-bold text-pink-500 uppercase">AI Predictive Risk Score</div>
                      <div className="text-2xl font-black">{selectedItem.data.riskScore}%</div>
                      <p className="text-[11px] leading-snug text-pink-700 mt-1">
                        High density of geofence mismatches and SLA delays detected. The anomaly engine predicts an 84% probability of compliance drop within this geographic boundary next week.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Risk Vector Type</span>
                        <strong className="text-slate-700 uppercase font-mono">{selectedItem.data.riskType}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Trend Projection</span>
                        <strong className={`uppercase ${selectedItem.data.trend === 'UPWARD' ? 'text-rose-600' : selectedItem.data.trend === 'DOWNWARD' ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {selectedItem.data.trend === 'UPWARD' ? '📈 UPWARD RISK' : selectedItem.data.trend === 'DOWNWARD' ? '📉 RECOVERING' : '➡️ STABLE'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Affected Departments</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedItem.data.affectedDepts.map((d: string, i: number) => (
                            <span key={i} className="bg-slate-100 border text-[9px] font-bold text-slate-600 px-2 py-0.5 rounded-sm">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          window.location.search = `?tab=ai-insights&search=compliance`;
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" /> AI Insights Center
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
