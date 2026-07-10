import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Settings, Key, Webhook, Activity, Download, Upload, Shield, RefreshCw } from 'lucide-react';

export default function EnterpriseIntegrationPlatform() {
  const { getToken } = useAuth();
  const { error, success } = useToast();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      if (activeTab === 'api-keys') {
         const res = await fetch('/api/v1/integration/api-keys', { headers });
         if (res.ok) setApiKeys(await res.json());
      } else if (activeTab === 'webhooks') {
         const res = await fetch('/api/v1/integration/webhooks', { headers });
         if (res.ok) setWebhooks(await res.json());
      } else if (activeTab === 'sync-logs') {
         const res = await fetch('/api/v1/integration/sync-logs', { headers });
         if (res.ok) setSyncLogs(await res.json());
      } else if (activeTab === 'webhook-logs') {
         const res = await fetch('/api/v1/integration/webhook-logs', { headers });
         if (res.ok) setWebhookLogs(await res.json());
      }
    } catch (e) {
      error('Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName) return error('Name required');
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/integration/api-keys', {
        method: 'POST',
        headers: { 
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newKeyName })
      });
      if (res.ok) {
         const data = await res.json();
         setGeneratedKey(data.key);
         setNewKeyName('');
         fetchData();
         success('API Key generated successfully. Please copy it now.');
      } else {
         error('Failed to generate key');
      }
    } catch (e) {
      error('An error occurred');
    }
  };

  const revokeKey = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/integration/api-keys/${id}/revoke`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
         success('API Key revoked');
         fetchData();
      }
    } catch (e) {
      error('Failed to revoke key');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Enterprise Integration Platform</h2>
           <p className="text-slate-500">Manage APIs, Webhooks, and System Synchronization.</p>
         </div>
         <div className="flex bg-slate-200 p-1 rounded-xl">
           {[
             { id: 'api-keys', label: 'API Keys', icon: Key },
             { id: 'webhooks', label: 'Webhooks', icon: Webhook },
             { id: 'data-transfer', label: 'Import/Export', icon: Download },
             { id: 'sync-logs', label: 'Sync Logs', icon: RefreshCw },
             { id: 'webhook-logs', label: 'Webhook Logs', icon: Activity }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
           ))}
         </div>
       </div>

       <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          {activeTab === 'api-keys' && (
             <div className="space-y-6">
                <div className="flex gap-4 items-end bg-slate-50 p-6 rounded-xl border border-slate-200">
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">New API Key Name</label>
                      <input 
                         type="text" 
                         value={newKeyName}
                         onChange={e => setNewKeyName(e.target.value)}
                         placeholder="e.g. ERP Integration Service"
                         className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" 
                      />
                   </div>
                   <button onClick={createApiKey} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition whitespace-nowrap">
                      GENERATE NEW KEY
                   </button>
                </div>
                
                {generatedKey && (
                   <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                      <h4 className="font-bold text-emerald-800 text-sm mb-2">Key Generated Successfully!</h4>
                      <p className="text-xs text-emerald-600 mb-3">Please copy this key and store it securely. You will not be able to see it again.</p>
                      <div className="bg-emerald-900 text-emerald-100 p-3 rounded-lg font-mono text-sm break-all select-all">
                         {generatedKey}
                      </div>
                   </div>
                )}
                
                <div>
                   <h3 className="font-bold text-slate-800 mb-4">Active API Keys</h3>
                   {loading ? (
                      <div className="text-slate-400 text-sm">Loading...</div>
                   ) : apiKeys.length === 0 ? (
                      <div className="text-slate-400 text-sm italic">No API keys found.</div>
                   ) : (
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                         {apiKeys.map(key => (
                            <div key={key.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                               <div>
                                  <div className="font-bold text-slate-800 flex items-center gap-2">
                                     {key.name}
                                     {!key.isActive && <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">Revoked</span>}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono mt-1">Prefix: {key.keyPrefix}••••••••</div>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="text-xs text-slate-400">Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                                  {key.isActive && (
                                     <button onClick={() => revokeKey(key.id)} className="text-rose-600 font-bold text-xs hover:underline">Revoke</button>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}
          
          {activeTab === 'webhooks' && (
             <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                   <div className="flex flex-col items-center justify-center text-center mb-6">
                      <Webhook className="w-8 h-8 text-slate-400 mb-3" />
                      <h3 className="font-bold text-slate-800 text-lg">Webhook Engine Configuration</h3>
                      <p className="text-slate-500 text-sm max-w-md mt-2">Subscribe to real-time events across the Supervisor Eye platform to synchronize with external HR or ERP systems.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Webhook Name</label>
                         <input type="text" id="webhookName" placeholder="e.g. HR Profile Sync" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Endpoint URL</label>
                         <input type="url" id="webhookUrl" placeholder="https://api.example.com/webhook" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" />
                      </div>
                   </div>
                   <button onClick={async () => {
                      const name = (document.getElementById('webhookName') as HTMLInputElement).value;
                      const url = (document.getElementById('webhookUrl') as HTMLInputElement).value;
                      if (!name || !url) return error('Name and URL required');
                      try {
                         const token = await getToken();
                         const res = await fetch('/api/v1/integration/webhooks', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ name, endpointUrl: url, events: ['*'] })
                         });
                         if (res.ok) {
                            success('Webhook registered');
                            (document.getElementById('webhookName') as HTMLInputElement).value = '';
                            (document.getElementById('webhookUrl') as HTMLInputElement).value = '';
                            fetchData();
                         }
                      } catch(e) {}
                   }} className="mt-4 w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition">
                      REGISTER WEBHOOK
                   </button>
                </div>
                
                <div>
                   <h3 className="font-bold text-slate-800 mb-4">Registered Webhooks</h3>
                   {loading ? <div className="text-slate-400 text-sm">Loading...</div> : webhooks.length === 0 ? (
                      <div className="text-slate-400 text-sm italic">No webhooks registered.</div>
                   ) : (
                      <div className="space-y-4">
                         {webhooks.map(wh => (
                            <div key={wh.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:bg-slate-50">
                               <div>
                                  <div className="font-bold text-slate-800">{wh.name}</div>
                                  <div className="text-xs text-slate-500 font-mono mt-1">{wh.endpointUrl}</div>
                               </div>
                               <div className="flex items-center gap-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${wh.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                     {wh.isActive ? 'ACTIVE' : 'INACTIVE'}
                                  </span>
                                  <button onClick={async () => {
                                     try {
                                        const token = await getToken();
                                        await fetch(`/api/v1/integration/webhooks/${wh.id}/toggle`, {
                                           method: 'PATCH',
                                           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                           body: JSON.stringify({ isActive: !wh.isActive })
                                        });
                                        fetchData();
                                     } catch(e) {}
                                  }} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition">
                                     Toggle
                                  </button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}
          
          {activeTab === 'data-transfer' && (
             <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                   <div className="flex flex-col items-center justify-center text-center mb-6">
                      <Download className="w-8 h-8 text-slate-400 mb-3" />
                      <h3 className="font-bold text-slate-800 text-lg">Data Import & Export</h3>
                      <p className="text-slate-500 text-sm max-w-md mt-2">Bulk import data or generate JSON/CSV exports for external systems.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
                         <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-3" />
                         <h4 className="font-bold text-slate-800 mb-2">Import Data</h4>
                         <p className="text-xs text-slate-500 mb-4">Upload CSV or JSON files to bulk sync users, tasks, or historical reports.</p>
                         <button onClick={async () => {
                             try {
                                const token = await getToken();
                                const res = await fetch('/api/v1/integration/import', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                   body: JSON.stringify({ entity: 'users', format: 'csv', url: 's3://bucket/import.csv' })
                                });
                                if (res.ok) success('Import Job Queued');
                             } catch(e) {}
                         }} className="bg-indigo-50 text-indigo-700 w-full py-2.5 rounded-lg font-bold text-xs hover:bg-indigo-100 transition">
                            START IMPORT WIZARD
                         </button>
                      </div>
                      
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
                         <Download className="w-6 h-6 text-emerald-500 mx-auto mb-3" />
                         <h4 className="font-bold text-slate-800 mb-2">Export Data</h4>
                         <p className="text-xs text-slate-500 mb-4">Generate bulk exports of reports, evidence, and platform metrics.</p>
                         <button onClick={async () => {
                             try {
                                const token = await getToken();
                                const res = await fetch('/api/v1/integration/export', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                   body: JSON.stringify({ entity: 'reports', format: 'csv' })
                                });
                                if (res.ok) success('Export Generated Successfully');
                             } catch(e) {}
                         }} className="bg-emerald-50 text-emerald-700 w-full py-2.5 rounded-lg font-bold text-xs hover:bg-emerald-100 transition">
                            GENERATE EXPORT
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          )}
          
          {activeTab === 'sync-logs' && (
             <div>
                <h3 className="font-bold text-slate-800 mb-4">Background Synchronization Logs</h3>
                {loading ? <div className="text-slate-400 text-sm">Loading...</div> : syncLogs.length === 0 ? (
                   <div className="text-slate-400 text-sm italic">No synchronization logs found.</div>
                ) : (
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                            <tr>
                               <th className="p-3">System</th>
                               <th className="p-3">Type</th>
                               <th className="p-3">Status</th>
                               <th className="p-3">Time</th>
                               <th className="p-3">Details</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {syncLogs.map(log => (
                               <tr key={log.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-bold text-slate-800">{log.systemName}</td>
                                  <td className="p-3"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase">{log.syncType}</span></td>
                                  <td className="p-3">
                                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                        log.status === 'FAILED' ? 'bg-rose-100 text-rose-700' :
                                        'bg-amber-100 text-amber-700'
                                     }`}>{log.status}</span>
                                  </td>
                                  <td className="p-3 text-slate-500 text-xs">{new Date(log.syncedAt).toLocaleString()}</td>
                                  <td className="p-3 text-slate-400 text-xs">{log.errorReason || 'OK'}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                )}
             </div>
          )}
          
          {activeTab === 'webhook-logs' && (
             <div>
                <h3 className="font-bold text-slate-800 mb-4">Webhook Delivery Logs</h3>
                {loading ? <div className="text-slate-400 text-sm">Loading...</div> : webhookLogs.length === 0 ? (
                   <div className="text-slate-400 text-sm italic">No webhook deliveries recorded.</div>
                ) : (
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                            <tr>
                               <th className="p-3">Event</th>
                               <th className="p-3">Status</th>
                               <th className="p-3">Response</th>
                               <th className="p-3">Time</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {webhookLogs.map(log => (
                               <tr key={log.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-bold text-slate-800">{log.event}</td>
                                  <td className="p-3">
                                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                        log.status === 'FAILED' ? 'bg-rose-100 text-rose-700' :
                                        'bg-amber-100 text-amber-700'
                                     }`}>{log.status}</span>
                                  </td>
                                  <td className="p-3 text-slate-500 text-xs">{log.responseStatus || log.errorReason}</td>
                                  <td className="p-3 text-slate-500 text-xs">{new Date(log.sentAt).toLocaleString()}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                )}
             </div>
          )}
       </div>
    </div>
  );
}
