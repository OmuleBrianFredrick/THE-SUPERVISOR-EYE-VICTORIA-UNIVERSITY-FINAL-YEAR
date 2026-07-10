import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { useToast } from '../../contexts/ToastContext';
import { AuditLogger, AuditLogRecord } from '../../services/AuditLogger';
import { NotificationService } from '../../services/NotificationService';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Download,
  Trash2,
  Users,
  ShieldAlert,
  FileText,
  History,
  Globe,
  Laptop,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import AdministrativeAuditPanel from "./components/AdministrativeAuditPanel";
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import { useUsersQuery, useInvalidateQueries } from "../../hooks/useQueries";
import NotificationDropdown from '../../components/notifications/NotificationDropdown';

type StatusTab = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'ALL';

export default function ApprovalQueue({ inline = false }: { inline?: boolean }) {
  const { getToken, profile, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Core States
  const { data: usersResponse, isLoading: loading } = useUsersQuery();
  const users = usersResponse?.data || usersResponse || [];
  const invalidateQueries = useInvalidateQueries();
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter & Search & Sort
  const [activeTab, setActiveTab] = useState<StatusTab>('PENDING_APPROVAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'department'>('newest');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Pagination states for Users
  const [userPage, setUserPage] = useState(1);
  const itemsPerPage = 6;

  // Audit Logs Section States
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const auditPerPage = 6;

  useEffect(() => {
    invalidateQueries([["users"]]);
    setAuditRefreshKey(prev => prev + 1);
  }, []);



  // User Actions
  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const userToProcess = users.find(u => u.id === id);
    if (!userToProcess) return;
    const userName = `${userToProcess.firstName} ${userToProcess.lastName}`;

    try {
      setActionLoading(id);
      const token = await getToken();
      if (!token) return;
      
      const res = await fetch(`/api/v1/admin/users/${id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });

      if (!res.ok) throw new Error(`Failed to update status on target database record.`);

      // Update local state
      invalidateQueries([["users"]]);
      setSelectedUsers(prev => prev.filter(userId => userId !== id));

      // Audit Log
      await AuditLogger.logEvent(
        action === 'APPROVE' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
        'ADMIN',
        `Administrator (${profile?.firstName} ${profile?.lastName}) ${action.toLowerCase()}d user registration: ${userName}`,
        profile,
        token
      );
      setAuditRefreshKey(prev => prev + 1);

      // Dispatch real-time notification to the target user
      await NotificationService.sendNotification(
        id,
        action === 'APPROVE' ? 'Account Verified' : 'Account Rejected',
        action === 'APPROVE' 
          ? 'Your corporate registration with Movit Group is active. Welcome to Supervisor Eye!' 
          : 'Your workspace registration was rejected by compliance. Contact support.',
        action === 'APPROVE' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
        action === 'APPROVE' ? 'success' : 'error'
      );

      toast.success(`${action === 'APPROVE' ? 'Approved' : 'Rejected'} registration of ${userName}`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Operations
  const handleBulkAction = async (action: 'APPROVE' | 'REJECT') => {
    if (selectedUsers.length === 0) return;
    
    const count = selectedUsers.length;
    try {
      setActionLoading("all");
      const token = await getToken();
      if (!token) return;

      toast.info(`Processing bulk ${action.toLowerCase()} of ${count} registrations...`);

      // Batch requests
      await Promise.all(selectedUsers.map(async (id) => {
        const u = users.find(usr => usr.id === id);
        const uName = u ? `${u.firstName} ${u.lastName}` : 'Workforce Staff';

        await fetch(`/api/v1/admin/users/${id}/approve`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ action })
        });

        // Dispatch individual notification
        await NotificationService.sendNotification(
          id,
          action === 'APPROVE' ? 'Account Verified' : 'Account Rejected',
          action === 'APPROVE' 
            ? 'Your registration has been approved. Welcome to the platform.' 
            : 'Your registration was rejected by administrators.',
          action === 'APPROVE' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
          action === 'APPROVE' ? 'success' : 'error'
        );
      }));

      // Update local state
      invalidateQueries([["users"]]);

      // Audit Log
      await AuditLogger.logEvent(
        action === 'APPROVE' ? 'BULK_APPROVE' : 'BULK_REJECT',
        'ADMIN',
        `Administrator (${profile?.firstName} ${profile?.lastName}) bulk ${action.toLowerCase()}d ${count} registrations`,
        profile,
        token
      );
      setAuditRefreshKey(prev => prev + 1);

      toast.success(`Bulk completed. ${count} accounts updated successfully.`);
      setSelectedUsers([]);
    } catch (err: any) {
      toast.error('An error occurred during bulk transactions.');
    } finally {
      setActionLoading(null);
    }
  };

  // Select / Deselect Logic
  const handleSelectUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = (pageUsers: any[]) => {
    const pageUserIds = pageUsers.map(u => u.id);
    const allSelected = pageUserIds.every(id => selectedUsers.includes(id));
    
    if (allSelected) {
      // Remove all page users from selected list
      setSelectedUsers(prev => prev.filter(id => !pageUserIds.includes(id)));
    } else {
      // Add all missing page users to selected list
      setSelectedUsers(prev => {
        const union = [...prev];
        pageUserIds.forEach(id => {
          if (!union.includes(id)) union.push(id);
        });
        return union;
      });
    }
  };

  // EXPORTERS
  const exportCSV = () => {
    const records = getFilteredUsers();
    if (records.length === 0) {
      toast.warning('No items found to export.');
      return;
    }

    try {
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Employee ID', 'Department', 'Role', 'Status', 'Registered Date'];
      const rows = records.map(u => [
        u.firstName,
        u.lastName,
        u.email,
        u.phone || 'N/A',
        u.employeeNumber || 'N/A',
        u.department?.name || u.department || 'Not specified',
        u.role?.name || u.role || 'Staff',
        u.status,
        new Date(u.createdAt).toLocaleDateString()
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `supervisor_eye_workforce_${activeTab.toLowerCase()}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Audit Log Export
      AuditLogger.logEvent('EXPORT_CSV', 'ADMIN', `Exported CSV report for workforce queue (${activeTab})`, profile, null);
      setAuditRefreshKey(prev => prev + 1);
      toast.success(`CSV file exported successfully (${records.length} records).`);
    } catch {
      toast.error('Failed to export CSV report.');
    }
  };

  const exportPDF = () => {
    const records = getFilteredUsers();
    if (records.length === 0) {
      toast.warning('No items found to export.');
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("SUPERVISOR EYE - WORKFORCE COMPLIANCE RECORD", 14, 15);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Corporate Segment: Movit Group | Queue: ${activeTab} | Count: ${records.length}`, 14, 21);
      doc.text(`Generated by: ${profile?.firstName} ${profile?.lastName} (${profile?.role}) | Date: ${new Date().toLocaleString()}`, 14, 25);
      
      const columns = ["Name", "Email/Contact", "Employee ID", "Department", "Role", "Status"];
      const rows = records.map(u => [
        `${u.firstName} ${u.lastName}`,
        `${u.email}\n${u.phone || 'N/A'}`,
        u.employeeNumber || 'N/A',
        u.department?.name || u.department || 'Not specified',
        u.role?.name || u.role || 'Staff',
        u.status
      ]);

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      doc.save(`supervisor_eye_compliance_${activeTab.toLowerCase()}_${Date.now()}.pdf`);

      // Audit Log Export
      AuditLogger.logEvent('EXPORT_PDF', 'ADMIN', `Exported PDF compliance report for workforce queue (${activeTab})`, profile, null);
      setAuditRefreshKey(prev => prev + 1);
      toast.success(`PDF report generated and downloaded successfully.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF report.');
    }
  };

  // Filtering / Searching / Sorting of Users
  const getFilteredUsers = () => {
    return users.filter(u => {
      // 1. Status Filter
      if (activeTab === 'PENDING_APPROVAL' && u.status !== 'PENDING_APPROVAL') return false;
      if (activeTab === 'ACTIVE' && u.status !== 'ACTIVE') return false;
      if (activeTab === 'REJECTED' && u.status !== 'REJECTED') return false;

      // 2. Search Query Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const fName = (u.firstName || '').toLowerCase();
        const lName = (u.lastName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const empNo = (u.employeeNumber || '').toLowerCase();
        const dept = (u.department?.name || u.department || '').toLowerCase();
        const role = (u.role?.name || u.role || '').toLowerCase();

        return fName.includes(query) || 
               lName.includes(query) || 
               email.includes(query) || 
               empNo.includes(query) || 
               dept.includes(query) || 
               role.includes(query);
      }
      return true;
    }).sort((a, b) => {
      // 3. Sorting
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'department') {
        const deptA = (a.department?.name || a.department || '').toLowerCase();
        const deptB = (b.department?.name || b.department || '').toLowerCase();
        return deptA.localeCompare(deptB);
      }
      return 0;
    });
  };

  // Filter audit logs

  const filteredUsers = getFilteredUsers();
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);


  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-slate-800 mb-4" />
        <p className="text-slate-500 font-bold text-sm tracking-wide uppercase animate-pulse">Syncing corporate databases...</p>
      </div>
    );
  }

  const isExecutive = profile?.role === 'Executive' || profile?.role === 'MD / Ops Director' || profile?.role === 'Platform Admin' || profile?.role === 'SUPER_ADMIN' || profile?.role === 'Administrator' || profile?.role === 'SYSTEM_ADMIN' || ['IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN'].includes(profile?.role || '');

  const mainContent = (
    <div className={inline ? "max-w-7xl mx-auto" : "p-6 max-w-7xl mx-auto font-sans text-slate-900"}>
      
      {/* Title Header Row */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          {!inline && (
            <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-semibold mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </button>
          )}
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-800" />
            Workforce Compliance & Approvals
          </h1>
          <p className="text-slate-500 text-sm font-semibold">
            Onboard new registrations, review security privileges, and export audit trails.
          </p>
        </div>
        
        {/* Top Control Bar (Search, Sort, Export) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button 
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition border border-slate-200 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {/* Export PDF */}
          <button 
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          
          {!inline && (
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-extrabold text-xs rounded-xl transition shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 font-bold text-sm rounded-xl mb-6">{error}</div>}

      {/* Primary Grid: Registrations Queue (Left/Top) & Custom Filters Panel */}
      <div className="space-y-6">
        
        {/* Grid Filters and Search Row */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            {(['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'ALL'] as StatusTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setUserPage(1); }}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition uppercase tracking-tight ${
                  activeTab === tab 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'PENDING_APPROVAL' ? 'Pending' : tab === 'ACTIVE' ? 'Active' : tab === 'REJECTED' ? 'Rejected' : 'All'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setUserPage(1); }}
              placeholder="Search staff registry..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg text-slate-700 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="department">Department</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Table Header toolbar for bulk actions */}
          {selectedUsers.length > 0 && (
            <div className="p-3 bg-amber-50 border-b border-slate-200 flex items-center justify-between animate-fadeIn px-6">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" /> {selectedUsers.length} Users Selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('APPROVE')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => handleBulkAction('REJECT')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition"
                >
                  Bulk Reject
                </button>
              </div>
            </div>
          )}

          {paginatedUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm font-semibold">
              No registration records found matching the query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-tight">
                  <tr>
                    <th className="px-6 py-3.5 w-12 text-center">
                      <button 
                        onClick={() => handleSelectAllOnPage(paginatedUsers)}
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        {paginatedUsers.every(u => selectedUsers.includes(u.id)) ? (
                          <CheckSquare className="w-4 h-4 text-slate-800 mx-auto" />
                        ) : (
                          <Square className="w-4 h-4 mx-auto" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3.5">Name / ID</th>
                    <th className="px-6 py-3.5">Contact Email / Phone</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(user => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                      <tr key={user.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-slate-50/70' : ''}`}>
                        {/* Selector */}
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleSelectUser(user.id)}
                            className="text-slate-400 hover:text-slate-600 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4.5 h-4.5 text-slate-800 mx-auto" />
                            ) : (
                              <Square className="w-4.5 h-4.5 mx-auto" />
                            )}
                          </button>
                        </td>
                        
                        {/* Name and ID */}
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-900">{user.firstName} {user.lastName}</div>
                          {user.employeeNumber ? (
                            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-0.5">ID: {user.employeeNumber}</div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">No Employee ID</div>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{user.email}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{user.phone || 'No phone recorded'}</div>
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {user.department?.name || user.department || 'Not specified'}
                        </td>

                        {/* Assigned Role */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-full uppercase tracking-tight">
                            {user.role?.name || user.role || 'Staff'}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
                            user.status === 'ACTIVE' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : user.status === 'PENDING_APPROVAL' 
                              ? 'bg-amber-50 text-amber-700 animate-pulse' 
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {user.status === 'ACTIVE' ? 'Active' : user.status === 'PENDING_APPROVAL' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right">
                          {actionLoading === user.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-slate-500 ml-auto" />
                          ) : (
                            <div className="flex justify-end gap-2">
                              {user.status !== 'ACTIVE' && (
                                <button 
                                  onClick={() => handleAction(user.id, 'APPROVE')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-100 transition-colors"
                                  title="Approve onboarding"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                              )}
                              {user.status !== 'REJECTED' && (
                                <button 
                                  onClick={() => handleAction(user.id, 'REJECT')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 font-bold text-xs rounded-lg hover:bg-red-100 transition-colors"
                                  title="Reject registration"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalUserPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                Page {userPage} of {totalUserPages} ({filteredUsers.length} records)
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={userPage >= totalUserPages}
                  onClick={() => setUserPage(prev => Math.min(totalUserPages, prev + 1))}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* ADMINISTRATIVE AUDIT STREAM PANEL */}
        <AdministrativeAuditPanel refreshKey={auditRefreshKey} />
      </div>
    </div>
    );


  if (!inline) {
    return (
      <div className="h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <span className="font-black text-xl italic tracking-tighter text-slate-900">MOVIT</span>
              <span className="font-bold text-slate-400 text-sm">Supervisor Eye</span>
            </div>
            
            {/* Admin Navigation Pills */}
            <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-6">
              {isExecutive && (
                <button 
                  onClick={() => navigate('/eacc')}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  EACC Command
                </button>
              )}
              <button 
                onClick={() => navigate('/admin/approvals')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 uppercase tracking-wider"
              >
                Approvals
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{profile?.firstName || 'User'} {profile?.lastName || ''}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">{profile?.jobTitle || profile?.role || 'Staff'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white border-2 border-slate-200 shadow-sm flex items-center justify-center font-black text-sm uppercase">
                {profile?.firstName?.[0] || 'U'}{profile?.lastName?.[0] || ''}
              </div>
            </div>
            <button onClick={logout} className="ml-4 text-xs font-bold text-slate-400 hover:text-slate-800 transition uppercase tracking-wider">LOGOUT</button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto">
          {mainContent}
        </main>
      </div>
    );
  }

  return mainContent;
}
