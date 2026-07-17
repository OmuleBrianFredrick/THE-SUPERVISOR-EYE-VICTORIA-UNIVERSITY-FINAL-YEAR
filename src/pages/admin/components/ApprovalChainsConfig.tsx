import React, { useState, useEffect } from 'react';
import { GitMerge, Plus, ArrowRight, Settings, Users, Watch, Loader2, X, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export default function ApprovalChainsConfig() {
  const { getToken } = useAuth();
  const { error, success: showSuccessToast } = useToast();
  const [chains, setChains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    taskType: '',
  });

  const [steps, setSteps] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChains();
    fetchMetadata();
  }, []);

  const fetchChains = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch('/api/v1/approvals/chains', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChains(await res.json());
      } else {
        error('Failed to load approval chains');
      }
    } catch (e) {
      error('An error occurred loading chains');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const token = await getToken();
      const [deptRes, rolesRes] = await Promise.all([
        fetch('/api/v1/admin/departments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/roles', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
    } catch (e) {
      console.error("Failed to load metadata", e);
    }
  };

  const openModal = () => {
    setFormData({ name: '', departmentId: '', taskType: '' });
    setSteps([{ roleId: '', slaHours: 24, slaAction: 'ESCALATE' }]);
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    setSteps([...steps, { roleId: '', slaHours: 24, slaAction: 'ESCALATE' }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return error("Chain Name is required");
    if (steps.length === 0) return error("At least one step is required");
    
    // validate steps
    for (let i = 0; i < steps.length; i++) {
       if (!steps[i].roleId) return error(`Role is required for Step ${i + 1}`);
    }

    try {
      setSubmitting(true);
      const token = await getToken();

      const payload = {
        name: formData.name,
        departmentId: formData.departmentId || undefined,
        taskType: formData.taskType || undefined,
        steps: steps.map((s, idx) => ({ 
           roleId: s.roleId || undefined,
           slaHours: s.slaHours,
           slaAction: s.slaAction,
           stepOrder: idx + 1 
        }))
      };

      const res = await fetch('/api/v1/approvals/chains', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSuccessToast('Approval Chain created successfully!');
        setIsModalOpen(false);
        fetchChains();
      } else {
        const err = await res.json();
        error(err.error || 'Failed to create chain');
      }
    } catch (e) {
      error('An error occurred creating the chain');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col relative">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Approval Chains & Governance</h2>
           <p className="text-slate-500">Design multi-tier verification workflows and SLA policies.</p>
         </div>
         <button onClick={openModal} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 cursor-pointer">
            <Plus className="w-4 h-4" /> CREATE CHAIN
         </button>
       </div>

       <div className="flex-1 overflow-y-auto space-y-6">
          {loading ? (
             <div className="flex items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
             </div>
          ) : chains.length === 0 ? (
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                <div className="mx-auto w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                   <GitMerge className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Approval Chains</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2 mb-6">Create a dynamic workflow to automatically route reports for verification based on role or department.</p>
                <button onClick={openModal} className="mx-auto bg-white border border-slate-200 text-slate-900 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 shadow-sm transition cursor-pointer">
                   <Plus className="w-4 h-4" /> CREATE NEW CHAIN
                </button>
             </div>
          ) : (
             chains.map((chain) => (
                <div key={chain.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                   <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><GitMerge className="w-5 h-5"/></div>
                         <div>
                           <h3 className="font-bold text-slate-800">{chain.name} {chain.department ? `(${chain.department.name})` : ''}</h3>
                           <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Status: <span className={chain.isActive ? "text-emerald-500" : "text-slate-400"}>{chain.isActive ? 'ACTIVE' : 'INACTIVE'}</span></p>
                         </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><Settings className="w-5 h-5"/></button>                   </div>
                   
                   <div className="p-6">
                      <div className="flex flex-wrap items-center gap-4">
                         {chain.steps?.map((step: any, idx: number) => (
                            <React.Fragment key={step.id}>
                               <div className="border border-slate-200 rounded-xl p-4 bg-white flex-1 min-w-[250px] max-w-[300px]">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Step {step.stepOrder}</div>
                                  <div className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                                     <Users className="w-4 h-4 text-slate-500"/> {step.role?.name || step.user?.firstName || 'Assigned Reviewer'}
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                     <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Watch className="w-3.5 h-3.5 text-slate-400" /> {step.slaHours} HR SLA</div>
                                     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                                       step.slaAction === 'ESCALATE' ? 'bg-rose-100 text-rose-700' :
                                       step.slaAction === 'AUTO_APPROVE' ? 'bg-emerald-100 text-emerald-700' :
                                       'bg-blue-100 text-blue-700'
                                     }`}>
                                        {step.slaAction} on breach
                                     </span>
                                  </div>                               </div>
                               {idx < chain.steps.length - 1 && (
                                  <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                               )}
                            </React.Fragment>
                         ))}
                         
                         <button className="h-full min-h-[120px] flex-1 max-w-[150px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition cursor-pointer">
                            <Plus className="w-6 h-6 mb-2" />
                            <span className="text-xs font-bold">ADD STEP</span>
                         </button>
                      </div>                   </div>
                </div>
             ))          )}
       </div>

       {/* Create Chain Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-indigo-600" /> 
                Create Approval Chain
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="create-chain-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Basic Info */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-widest">Chain Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chain Name *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Finance Audits"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Department (Optional)</label>
                      <select 
                        value={formData.departmentId}
                        onChange={e => setFormData({...formData, departmentId: e.target.value})}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">-- All Departments --</option>
                        {departments.map(d => (
                           <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Task Type (Optional)</label>
                      <select 
                        value={formData.taskType}
                        onChange={e => setFormData({...formData, taskType: e.target.value})}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">-- Any Task Type --</option>
                        <option value="STOCK_AUDIT">Stock Audit</option>
                        <option value="MERCHANDISING">Merchandising</option>
                        <option value="EXPENSE_REPORT">Expense Report</option>
                        <option value="GENERAL_VISIT">General Visit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest">Workflow Steps</h3>
                    <button type="button" onClick={handleAddStep} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> ADD STEP
                    </button>
                  </div>

                  <div className="space-y-4">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="bg-slate-200 text-slate-700 font-black text-xs px-2.5 py-1 rounded shrink-0">
                          {idx + 1}
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reviewer Role *</label>
                            <select 
                              required
                              value={step.roleId}
                              onChange={e => updateStep(idx, 'roleId', e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white"
                            >
                              <option value="">-- Select Role --</option>
                              {roles.map(r => (
                                 <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SLA Limit (Hours)</label>
                            <input 
                              type="number"
                              min="1"
                              value={step.slaHours}
                              onChange={e => updateStep(idx, 'slaHours', parseInt(e.target.value))}
                              className="w-full border border-slate-200 rounded p-2 text-xs outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Action on SLA Breach</label>
                            <select 
                              value={step.slaAction}
                              onChange={e => updateStep(idx, 'slaAction', e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white"
                            >
                              <option value="ESCALATE">Escalate to Admin</option>
                              <option value="AUTO_APPROVE">Auto-Approve</option>
                              <option value="REASSIGN">Reassign in Dept</option>
                            </select>
                          </div>
                        </div>

                        <button type="button" onClick={() => handleRemoveStep(idx)} disabled={steps.length <= 1} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0 disabled:opacity-30 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer">
                CANCEL
              </button>
              <button type="submit" form="create-chain-form" disabled={submitting} className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? 'SAVING...' : 'SAVE CHAIN'}
              </button>
            </div>
          </div>
        </div>
       )}
    </div>
  );
}
