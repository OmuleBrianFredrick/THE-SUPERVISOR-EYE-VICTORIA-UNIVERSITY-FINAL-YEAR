import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Bot, TrendingUp, AlertTriangle, Lightbulb, ThumbsUp, ThumbsDown, Megaphone, XCircle, Search } from 'lucide-react';

function FeedbackWidget({ insight, onUpdate }: { insight: any, onUpdate: () => void }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [actionTaken, setActionTaken] = useState(insight.feedback?.[0]?.actionTaken || '');
  const [comments, setComments] = useState(insight.feedback?.[0]?.comments || '');

  const submitFeedback = async (status: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      await fetch(`/api/v1/intelligence/insights/${insight.id}/feedback`, {
         method: 'POST',
         headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ status, comments, actionTaken })
      });
      onUpdate();
      setIsExpanding(false);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'USEFUL': return 'bg-emerald-100 text-emerald-700';
      case 'NOT_USEFUL': return 'bg-rose-100 text-rose-700';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-700';
      case 'DISMISSED': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-slate-100">
       <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Executive Review</div>
          {insight.feedbackStatus && (
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${getStatusColor(insight.feedbackStatus)}`}>
               {insight.feedbackStatus.replace('_', ' ')}
             </span>
          )}
       </div>

       {isExpanding ? (
         <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
           <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action Taken</label>
                <input type="text" value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="E.g., Initiated audit, Assigned to..." className="w-full text-sm border-slate-300 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Notes / Comments</label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)} className="w-full text-sm border-slate-300 rounded-lg p-2 h-20" placeholder="Optional notes..."></textarea>
              </div>
           </div>
           <div className="mt-4 flex flex-wrap gap-2">
              <button disabled={loading} onClick={() => submitFeedback('USEFUL')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                 <ThumbsUp className="w-4 h-4" /> Useful
              </button>
              <button disabled={loading} onClick={() => submitFeedback('NOT_USEFUL')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-50 text-rose-700 hover:bg-rose-100">
                 <ThumbsDown className="w-4 h-4" /> Not Useful
              </button>
              <button disabled={loading} onClick={() => submitFeedback('INVESTIGATING')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-700 hover:bg-blue-100">
                 <Search className="w-4 h-4" /> Investigating
              </button>
              <button disabled={loading} onClick={() => submitFeedback('DISMISSED')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-200 text-slate-700 hover:bg-slate-300">
                 <XCircle className="w-4 h-4" /> Dismiss
              </button>
              <div className="flex-1"></div>
              <button onClick={() => setIsExpanding(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5">Cancel</button>
           </div>
         </div>
       ) : (
         <div className="flex gap-2">
            <button onClick={() => setIsExpanding(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">
               <Megaphone className="w-4 h-4" /> Rate & Record Action
            </button>
         </div>
       )}

       {!isExpanding && insight.feedbackStatus && insight.feedback?.[0] && (
         <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg flex flex-col gap-2 border border-slate-100">
           {insight.feedback[0].actionTaken && (
             <div><span className="font-bold text-slate-800">Action:</span> {insight.feedback[0].actionTaken}</div>
           )}
           {insight.feedback[0].comments && (
             <div><span className="font-bold text-slate-800">Notes:</span> {insight.feedback[0].comments}</div>
           )}
         </div>
       )}
    </div>
  );
}

export default function AIInsightsCenter() {
  const { getToken } = useAuth();
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/intelligence/insights', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setInsights(await res.json());
    } catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">AI Insights & Explanation Engine</h2>
           <p className="text-slate-500">Self-generating operational intelligence streams with causality explanations.</p>
         </div>
         <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded text-sm font-bold">
            <Bot className="w-4 h-4"/> AI ACTIVE
         </div>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4">
          {insights.map((insight) => (
             <div key={insight.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                 <div className={`w-2 shrink-0 ${insight.type === 'RISK' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                 <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                               insight.type === 'RISK' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                               {insight.type}
                            </span>
                            <span className="text-xs font-bold text-slate-400">Confidence: {insight.confidence}%</span>
                         </div>
                         <h3 className="text-lg font-black text-slate-800">{insight.title}</h3>
                       </div>
                       {insight.type === 'RISK' ? <AlertTriangle className="w-6 h-6 text-rose-300"/> : <TrendingUp className="w-6 h-6 text-indigo-300"/>}
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                           <Bot className="w-3 h-3" /> AI Explanation Layer
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                           {insight.explanation}
                        </p>
                    </div>

                    {insight.recommendedAction && (
                       <div className="flex gap-3 items-start">
                          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Recommended Action</div>
                            <div className="text-sm text-slate-800 font-medium">{insight.recommendedAction}</div>
                          </div>
                       </div>
                    )}
                    
                    <FeedbackWidget insight={insight} onUpdate={fetchInsights} />
                 </div>
             </div>
          ))}
          {insights.length === 0 && (
             <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                 <Bot className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                 <h3 className="text-lg font-bold text-slate-600">No Insights Generated</h3>
                 <p className="text-slate-400 text-sm mt-1">The intelligence engine has not logged any anomalies or trends yet.</p>
             </div>
          )}
       </div>
    </div>
  );
}
