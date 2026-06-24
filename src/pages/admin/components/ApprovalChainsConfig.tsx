import React from 'react';
import { GitMerge, Plus, ArrowRight, Settings, Users, Watch } from 'lucide-react';

export default function ApprovalChainsConfig() {
  const mockChains = [
    {
      id: 1,
      name: 'Merchandising Field Check',
      isActive: true,
      steps: [
        { order: 1, role: 'Field Supervisor', slaHours: 24, slaAction: 'ESCALATE' },
        { order: 2, role: 'Regional Manager', slaHours: 48, slaAction: 'AUTO_APPROVE' }
      ]
    },
    {
      id: 2,
      name: 'Stock Audit Variance',
      isActive: true,
      steps: [
        { order: 1, role: 'Audit Manager', slaHours: 12, slaAction: 'ESCALATE' },
        { order: 2, role: 'Finance Director', slaHours: 24, slaAction: 'NOTIFY' },
        { order: 3, role: 'Executive Board', slaHours: 72, slaAction: 'ESCALATE' }
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Approval Chains & Governance</h2>
           <p className="text-slate-500">Design multi-tier verification workflows and SLA policies.</p>
         </div>
         <button className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800">
            <Plus className="w-4 h-4" /> CREATE CHAIN
         </button>
       </div>

       <div className="flex-1 overflow-y-auto space-y-6">
          {mockChains.map((chain) => (
             <div key={chain.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><GitMerge className="w-5 h-5"/></div>
                      <div>
                        <h3 className="font-bold text-slate-800">{chain.name}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Status: <span className="text-emerald-500">ACTIVE</span></p>
                      </div>
                   </div>
                   <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><Settings className="w-5 h-5"/></button>
                </div>
                
                <div className="p-6">
                   <div className="flex flex-wrap items-center gap-4">
                      {chain.steps.map((step, idx) => (
                         <React.Fragment key={idx}>
                            <div className="border border-slate-200 rounded-xl p-4 bg-white flex-1 min-w-[250px] max-w-[300px]">
                               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Step {step.order}</div>
                               <div className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-slate-500"/> {step.role}</div>
                               <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Watch className="w-3.5 h-3.5 text-slate-400" /> {step.slaHours} HR SLA</div>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                                    step.slaAction === 'ESCALATE' ? 'bg-rose-100 text-rose-700' :
                                    step.slaAction === 'AUTO_APPROVE' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                     {step.slaAction} on breach
                                  </span>
                               </div>
                            </div>
                            {idx < chain.steps.length - 1 && (
                               <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                            )}
                         </React.Fragment>
                      ))}
                      
                      <button className="h-full min-h-[120px] flex-1 max-w-[150px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition cursor-pointer">
                         <Plus className="w-6 h-6 mb-2" />
                         <span className="text-xs font-bold">ADD STEP</span>
                      </button>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}
