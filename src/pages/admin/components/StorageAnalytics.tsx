import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { HardDrive, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function StorageAnalytics() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchStorage();
  }, []);

  const fetchStorage = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/governance/storage-analytics', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  if (!data) return <div className="text-slate-400 p-8">Loading storage data...</div>;

  const chartData = [
    { name: 'Photos', count: data.totalPhotos, fill: '#3b82f6' },
    { name: 'Videos', count: data.totalVideos, fill: '#8b5cf6' },
    { name: 'Documents', count: data.totalDocuments, fill: '#64748b' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
       <div>
        <h2 className="text-2xl font-black text-slate-800">Storage & Media Analytics</h2>
        <p className="text-slate-500">Resource utilization and digital evidence management insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
           <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Uploads</div>
           <div className="text-4xl font-black">{data.totalFiles}</div>
           <HardDrive className="absolute right-4 bottom-4 w-12 h-12 text-slate-800" />
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-blue-500"/> Photos</div>
           <div className="text-3xl font-black text-slate-800">{data.totalPhotos}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Video className="w-4 h-4 text-purple-500"/> Videos</div>
           <div className="text-3xl font-black text-slate-800">{data.totalVideos}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500"/> Documents</div>
           <div className="text-3xl font-black text-slate-800">{data.totalDocuments}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-6">File Type Distribution</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} />
                 <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px' }} />
                 <Bar dataKey="count" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
           <div className="w-24 h-24 rounded-full border-4 border-slate-100 flex items-center justify-center mb-4 relative">
              <svg className="w-full h-full text-indigo-500 absolute rotate-[-90deg]" viewBox="0 0 36 36">
                <path
                  className="stroke-current"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${Math.min(100, Math.max(1, data.totalStorageGB * 10))}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <HardDrive className="w-8 h-8 text-slate-400" />
           </div>
           <div className="text-3xl font-black text-slate-800">{data.totalStorageGB} GB</div>
           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Estimated Cloud Usage</div>
        </div>
      </div>
    </div>
  );
}
