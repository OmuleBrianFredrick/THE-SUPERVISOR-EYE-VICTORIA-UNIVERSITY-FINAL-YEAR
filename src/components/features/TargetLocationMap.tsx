import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface TargetLocationMapProps {
  lat: number;
  lng: number;
  locationName?: string;
}

export default function TargetLocationMap({ lat, lng, locationName }: TargetLocationMapProps) {
  return (
    <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-200 z-10 relative">
      <MapContainer 
        center={[lat, lng]} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="font-bold text-xs text-slate-800">
              <Navigation className="w-3 h-3 inline-block mr-1 text-indigo-500" />
              Target Location
              {locationName && <div className="text-[10px] text-slate-500 font-normal mt-1">{locationName}</div>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
