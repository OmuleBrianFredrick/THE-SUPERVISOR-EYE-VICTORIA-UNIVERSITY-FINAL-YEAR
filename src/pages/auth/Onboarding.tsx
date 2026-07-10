import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  Sparkles, 
  Phone, 
  Briefcase, 
  BadgeCheck,
  User,
  ShieldCheck
} from 'lucide-react';

interface DeptItem {
  id: string;
  name: string;
}

interface SupervisorItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentId?: string | null;
  roleName?: string;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1); // Steps: 1 (Profile), 2 (Department), 3 (Supervisor)
  
  // Step 1 states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // Lists loaded from backend
  const [departmentsList, setDepartmentsList] = useState<DeptItem[]>([]);
  const [supervisorsList, setSupervisorsList] = useState<SupervisorItem[]>([]);
  
  // Wizard selections
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingLists, setFetchingLists] = useState(true);
  
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, requiresOnboarding, accountStatus, getToken, refreshProfile } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login', { replace: true });
      } else if (!requiresOnboarding) {
        if (accountStatus === 'PENDING_APPROVAL') {
          navigate('/pending-approval', { replace: true });
        } else if (accountStatus === 'REJECTED') {
          navigate('/rejected', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [currentUser, authLoading, requiresOnboarding, accountStatus, navigate]);
  
  const organization = 'Movit Group of Companies';

  useEffect(() => {
    async function loadOnboardingData() {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch seeded departments from database
        const deptRes = await fetch('/api/v1/auth/departments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (deptRes.ok) {
          const deptsData = await deptRes.json();
          setDepartmentsList(deptsData);
        }

        // Fetch seeded supervisors from database
        const supRes = await fetch('/api/v1/auth/supervisors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (supRes.ok) {
          const supsData = await supRes.json();
          setSupervisorsList(supsData);
        }
      } catch (err) {
        console.error('Failed to load onboarding metadata:', err);
        setError('Failed to connect to supervisor registry. Please reload page.');
      } finally {
        setFetchingLists(false);
      }
    }

    loadOnboardingData();
  }, [getToken]);

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSelectedManagerId(''); // Reset selected supervisor when department shifts
    const deptObj = departmentsList.find(d => d.id === deptId);
    setSelectedDeptName(deptObj ? deptObj.name : '');
  };

  // Displays only supervisors belonging to the selected department
  const getFilteredSupervisors = () => {
    if (!selectedDeptId) return [];
    return supervisorsList.filter(s => s.departmentId === selectedDeptId);
  };

  const handleNextStep = () => {
    setError('');
    
    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.');
        return;
      }
      if (!phone.trim()) {
        setError('Please enter a valid phone number.');
        return;
      }
      if (!jobTitle.trim()) {
        setError('Please enter your job title.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedDeptId) {
        setError('Please select a department to continue.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return;

    if (!selectedDeptId) {
      setError('Department selection is required.');
      return;
    }
    if (!selectedManagerId) {
      setError('Please select your direct supervisor.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName, 
          lastName, 
          phone, 
          employeeNumber: employeeNumber || null, 
          departmentId: selectedDeptId, 
          department: selectedDeptName, 
          managerId: selectedManagerId, 
          jobTitle,
          organization
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete enrollment.');
      }

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepsInfo = [
    { num: 1, label: 'Profile Details' },
    { num: 2, label: 'Select Department' },
    { num: 3, label: 'Select Supervisor' }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 md:p-8 font-sans">
      <div id="onboarding-wizard-container" className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm relative overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">
              Movit Employee Onboarding
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Workforce Access & Super-Admin Locked Role Security
            </p>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {stepsInfo.map((s, index) => (
              <div key={s.num} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1 relative">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                      currentStep === s.num 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : currentStep > s.num 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {currentStep > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`text-[11px] font-bold mt-2 transition-colors duration-300 uppercase tracking-wider ${
                    currentStep === s.num ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < stepsInfo.length - 1 && (
                  <div className={`h-[2px] flex-1 -mt-6 transition-all duration-500 ${
                    currentStep > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm mb-6 font-medium animate-shake">
            {error}
          </div>
        )}

        {fetchingLists ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-sm font-semibold tracking-wide">Initializing secure enterprise registry...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              
              {/* Step 1: Profile Details */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl mb-2">
                    <div className="flex gap-2 text-amber-800 text-xs leading-relaxed font-medium">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Welcome! Let's get your profile set up in the system. Your account is assigned 
                        the <strong className="text-amber-900 font-bold">Field Staff</strong> role by default under active status.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">First Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input 
                          type="text" 
                          placeholder="e.g. Samuel"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white transition-all font-medium text-slate-800 text-sm"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Last Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input 
                          type="text" 
                          placeholder="e.g. Okello"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white transition-all font-medium text-slate-800 text-sm"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input 
                          type="tel" 
                          placeholder="e.g. +256 701 234567"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white transition-all font-medium text-slate-800 text-sm"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Employee ID (Optional)</label>
                      <div className="relative">
                        <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input 
                          type="text" 
                          placeholder="e.g. EMP-2084"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white transition-all font-medium text-slate-800 text-sm"
                          value={employeeNumber}
                          onChange={(e) => setEmployeeNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Job Title</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        placeholder="e.g. Merchandising Specialist, Route Officer"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white transition-all font-medium text-slate-800 text-sm"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Choose Department */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Onboarding Wizard Step 1</span>
                    <h3 className="text-lg font-extrabold text-slate-800">Select Department</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Select the official Movit Group operational division you are reporting to.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {departmentsList.map(dept => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleDepartmentChange(dept.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selectedDeptId === dept.id 
                            ? 'border-slate-900 bg-slate-900/5 text-slate-900 shadow-sm' 
                            : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Building2 className={`w-5 h-5 shrink-0 ${
                          selectedDeptId === dept.id ? 'text-slate-900' : 'text-slate-400'
                        }`} />
                        <span className="text-sm font-bold tracking-tight">{dept.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Select Supervisor */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Onboarding Wizard Step 2</span>
                    <h3 className="text-lg font-extrabold text-slate-800">Select Supervisor</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Displaying managers/supervisors strictly assigned to your department: <strong className="text-slate-900 font-bold">{selectedDeptName}</strong>
                    </p>
                  </div>

                  {getFilteredSupervisors().length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center">
                      <p className="text-sm text-slate-500 font-bold italic">No active supervisor found in {selectedDeptName}.</p>
                      <p className="text-xs text-slate-400 mt-1">Please contact system admin to register supervisors in this department.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {getFilteredSupervisors().map(sup => (
                        <button
                          key={sup.id}
                          type="button"
                          onClick={() => setSelectedManagerId(sup.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            selectedManagerId === sup.id 
                              ? 'border-slate-900 bg-slate-900/5 text-slate-900 shadow-sm' 
                              : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              selectedManagerId === sup.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight text-slate-800">{sup.firstName} {sup.lastName}</p>
                              <p className="text-xs text-slate-500 font-medium">{sup.jobTitle || 'Supervisor'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {selectedDeptName}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-2.5 mt-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-950">Security & Account Status Guaranteed</p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-medium mt-0.5">
                        Approval is bypassed completely. Upon completing selection, onboarding is complete, 
                        and your active account is immediately permitted access to the system portal!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Stepper Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-sm ml-auto focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl font-bold text-sm transition-all shadow-sm ml-auto disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> ENROLLING...</>
                  ) : (
                    <>COMPLETE ENROLLMENT <CheckCircle2 className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
