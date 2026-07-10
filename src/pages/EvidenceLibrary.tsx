import React, { useState } from "react";
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, Camera, Search, Database, HardDrive, CheckCircle, AlertTriangle, Video, FileText, Filter, PieChart 
} from 'lucide-react';
import EvidenceGallery from "../components/features/EvidenceGallery";
import { useEvidenceQuery, useEvidenceAnalyticsQuery, useInvalidateQueries } from "../hooks/useQueries";

export default function EvidenceLibrary() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data: evidenceResponse, isLoading: loadingEvidence } = useEvidenceQuery();
  const { data: analytics, isLoading: loadingAnalytics } = useEvidenceAnalyticsQuery();
  const evidenceList = evidenceResponse?.data || evidenceResponse || [];
  const loading = loadingEvidence || loadingAnalytics;
  const invalidateQueries = useInvalidateQueries();
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredEvidence = evidenceList.filter(item => {
    const matchesSearch = item.report?.task?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.report?.submitter?.firstName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || item.mediaType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || item.verificationStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-slate-900 text-white p-6 md:px-8 border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-semibold mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </button>
            <h1 className="text-2xl font-black tracking-tight">Enterprise Evidence Library</h1>
            <p className="text-slate-400 text-sm mt-1">Centralized governance for operational media and documents.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8 min-h-0">
        
        {/* Analytics Section */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                 <Database className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Evidence</p>
                 <p className="text-2xl font-black text-slate-800">{analytics.totalEvidence}</p>
               </div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                 <CheckCircle className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified</p>
                 <p className="text-2xl font-black text-slate-800">{analytics.verifiedEvidence}</p>
               </div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                 <AlertTriangle className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Review</p>
                 <p className="text-2xl font-black text-slate-800">{analytics.pendingVerification}</p>
               </div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                 <HardDrive className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Storage</p>
                 <p className="text-2xl font-black text-slate-800">{formatBytes(analytics.estimatedStorageBytes)}</p>
               </div>
             </div>
          </div>
        )}

        {/* Filters and List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[500px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-slate-500" /> 
              Media Library
            </h2>
            <div className="flex flex-wrap sm:items-center items-stretch gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tasks, submitters..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-slate-900 transition"
                />
              </div>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 transition font-medium text-slate-700"
              >
                <option value="ALL">All Types</option>
                <option value="PHOTO">Photos</option>
                <option value="VIDEO">Videos</option>
                <option value="DOCUMENT">Documents</option>
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 transition font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending</option>
                <option value="FLAGGED">Flagged</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
          
          <div className="p-6 flex-1">
             {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>
             ) : (
                <EvidenceGallery evidenceList={filteredEvidence} isSupervisor={true} onRefresh={() => invalidateQueries([["evidence"], ["analytics", "evidence"]])} />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
