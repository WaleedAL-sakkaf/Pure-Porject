import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, AccountStatus } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  getApprovalStats, 
  getAllUsers,
  deleteUser,
  changeUserStatus
} from '../services/authService';
import EditUserModal from '../components/modals/EditUserModal';
import ResetPasswordModal from '../components/modals/ResetPasswordModal';
import UserActivityModal from '../components/modals/UserActivityModal';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Phone,
  Briefcase,
  Calendar,
  Shield,
  Search,
  Filter,
  Eye,
  MoreVertical,
  UserPlus,
  Activity,
  Wifi,
  LogIn,
  Edit,
  Trash2,
  Key,
  Settings,
  ChevronDown
} from 'lucide-react';

interface PendingUser {
  id: string;
  username: string;
  role: UserRole;
  company_name: string;
  phoneNumbers: string[];
  created_at: string;
}

interface AllUsersUser {
  id: string;
  username: string;
  role: UserRole;
  company_name: string;
  phoneNumbers: string[];
  created_at: string;
  account_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  last_login_attempt?: string;
  last_attempt_type?: 'success' | 'failed_password' | 'account_pending' | 'account_rejected';
  last_ip?: string;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const UserManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<AllUsersUser[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AllUsersUser | null>(null);
  
  // Dropdown states
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
  
  // Success messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pendingUsersData, statsData, allUsersData] = await Promise.all([
        getPendingUsers(),
        getApprovalStats(),
        getAllUsers(statusFilter === 'all' ? undefined : statusFilter, searchTerm || undefined)
      ]);
      
      setPendingUsers(pendingUsersData);
      setStats(statsData);
      setAllUsers(allUsersData);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const allUsersData = await getAllUsers(
        statusFilter === 'all' ? undefined : statusFilter, 
        searchTerm || undefined
      );
      setAllUsers(allUsersData);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب قائمة المستخدمين');
    }
  };

  useEffect(() => {
    if (currentUser?.role === UserRole.Admin) {
      fetchData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === UserRole.Admin && activeTab === 'all') {
      fetchAllUsers();
    }
  }, [searchTerm, statusFilter, currentUser, activeTab]);

  const handleApproveUser = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      setActionLoading(userId);
      await approveUser(userId, currentUser.id);
      await fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الموافقة على الحساب');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      setActionLoading(userId);
      await rejectUser(userId, currentUser.id);
      await fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء رفض الحساب');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return 'مدير النظام';
      case UserRole.PosAgent:
        return 'موظف نقطة بيع';
      default:
        return role;
    }
  };

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            <Clock size={12} />
            <span>قيد المراجعة</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            <CheckCircle size={12} />
            <span>موافق عليه</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
            <XCircle size={12} />
            <span>مرفوض</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getAttemptTypeBadge = (attemptType: 'success' | 'failed_password' | 'account_pending' | 'account_rejected') => {
    switch (attemptType) {
      case 'success':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
            <LogIn size={10} />
            <span>دخول ناجح</span>
          </div>
        );
      case 'failed_password':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
            <XCircle size={10} />
            <span>كلمة مرور خاطئة</span>
          </div>
        );
      case 'account_pending':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
            <Clock size={10} />
            <span>حساب معلق</span>
          </div>
        );
      case 'account_rejected':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
            <XCircle size={10} />
            <span>حساب مرفوض</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Modal handlers
  const openEditModal = (user: AllUsersUser) => {
    setSelectedUser(user);
    setEditModalOpen(true);
    closeAllDropdowns();
  };

  const openResetPasswordModal = (user: AllUsersUser) => {
    setSelectedUser(user);
    setResetPasswordModalOpen(true);
    closeAllDropdowns();
  };

  const openActivityModal = (user: AllUsersUser) => {
    setSelectedUser(user);
    setActivityModalOpen(true);
    closeAllDropdowns();
  };

  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  const toggleDropdown = (userId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // User operations
  const handleDeleteUser = async (user: AllUsersUser) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${user.username}"؟\n\nهذا الإجراء لا يمكن التراجع عنه!`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      await deleteUser(user.id);
      showSuccessMessage(`تم حذف المستخدم "${user.username}" بنجاح`);
      fetchData();
      closeAllDropdowns();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حذف المستخدم');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeStatus = async (user: AllUsersUser, newStatus: string) => {
    try {
      setActionLoading(user.id);
      await changeUserStatus(user.id, newStatus);
      showSuccessMessage(`تم تغيير حالة المستخدم "${user.username}" بنجاح`);
      fetchData();
      closeAllDropdowns();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تغيير حالة المستخدم');
    } finally {
      setActionLoading(null);
    }
  };

  const handleModalSuccess = () => {
    fetchData();
  };

  if (currentUser?.role !== UserRole.Admin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold mb-2">الوصول محظور</h2>
          <p className="text-muted-foreground">
            هذه الصفحة مخصصة للمديرين فقط
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Users className="text-primary me-3" size={32} />
        <h1 className="text-2xl font-bold">إدارة الحسابات</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="text-yellow-500 me-3" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 me-3" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">موافق عليها</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <XCircle className="text-red-500 me-3" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">مرفوضة</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Users className="text-blue-500 me-3" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Card className="mb-6 p-4 border-red-200 bg-red-50">
          <div className="flex items-center text-red-700">
            <AlertCircle size={20} className="me-2" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Card className="mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'pending'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="inline me-2" size={16} />
            الحسابات المعلقة ({stats?.pending || 0})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="inline me-2" size={16} />
            جميع المستخدمين ({stats?.total || 0})
          </button>
        </div>

        {/* Search and Filter for All Users */}
        {activeTab === 'all' && (
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="البحث في اسم المستخدم أو الشركة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-10 pr-8 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">قيد المراجعة</option>
                  <option value="approved">موافق عليها</option>
                  <option value="rejected">مرفوضة</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-muted-foreground">جاري جلب البيانات...</p>
        </Card>
      )}

      {/* Content based on active tab */}
      {!loading && activeTab === 'pending' && (
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <Clock className="me-2" size={20} />
              الحسابات المعلقة ({pendingUsers.length})
            </h2>
          </div>
          
          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
              <h3 className="text-lg font-semibold mb-2">لا توجد حسابات معلقة</h3>
              <p className="text-muted-foreground">
                جميع طلبات الحسابات تم مراجعتها
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid gap-4">
                {pendingUsers.map((user) => (
                  <Card key={user.id} className="p-4 border">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{user.username}</h3>
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            <Shield size={12} />
                            <span>{getRoleLabel(user.role)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Briefcase size={14} />
                            <span>{user.company_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone size={14} />
                            <span>{user.phoneNumbers.join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>تاريخ الطلب: {formatDate(user.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApproveUser(user.id)}
                          disabled={actionLoading === user.id}
                          isLoading={actionLoading === user.id}
                          leftIcon={<UserCheck size={16} />}
                        >
                          موافقة
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRejectUser(user.id)}
                          disabled={actionLoading === user.id}
                          isLoading={actionLoading === user.id}
                          leftIcon={<UserX size={16} />}
                        >
                          رفض
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* All Users List */}
      {!loading && activeTab === 'all' && (
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <Users className="me-2" size={20} />
              جميع المستخدمين ({allUsers.length})
            </h2>
          </div>
          
          {allUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold mb-2">لا توجد مستخدمين</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'لا توجد نتائج مطابقة للبحث أو الفلترة'
                  : 'لا يوجد مستخدمين في النظام'
                }
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid gap-4">
                {allUsers.map((user) => (
                  <Card key={user.id} className="p-4 border">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg">{user.username}</h3>
                          {getStatusBadge(user.account_status)}
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            <Shield size={12} />
                            <span>{getRoleLabel(user.role)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Briefcase size={14} />
                            <span>{user.company_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone size={14} />
                            <span>{user.phoneNumbers.join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>تاريخ التسجيل: {formatDate(user.created_at)}</span>
                          </div>
                          {user.approved_at && (
                            <div className="flex items-center gap-1">
                              <Activity size={14} />
                              <span>
                                {user.account_status === 'approved' ? 'تمت الموافقة' : 'تم الرفض'}: {formatDate(user.approved_at)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Last Login Attempt Info */}
                        {user.last_login_attempt && (
                          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground">آخر محاولة دخول:</span>
                              {user.last_attempt_type && getAttemptTypeBadge(user.last_attempt_type)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{formatDate(user.last_login_attempt)}</span>
                              </div>
                              {user.last_ip && (
                                <div className="flex items-center gap-1">
                                  <Wifi size={12} />
                                  <span>{user.last_ip}</span>
                                </div>
                              )}
                            </div>
                          </div>
                                                 )}

                         {user.approved_by && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            بواسطة: {user.approved_by}
                          </div>
                        )}
                      </div>
                      
                                             <div className="flex gap-2">
                         {user.account_status === 'pending' && (
                           <>
                             <Button
                               variant="success"
                               size="sm"
                               onClick={() => handleApproveUser(user.id)}
                               disabled={actionLoading === user.id}
                               isLoading={actionLoading === user.id}
                               leftIcon={<UserCheck size={16} />}
                             >
                               موافقة
                             </Button>
                             <Button
                               variant="danger"
                               size="sm"
                               onClick={() => handleRejectUser(user.id)}
                               disabled={actionLoading === user.id}
                               isLoading={actionLoading === user.id}
                               leftIcon={<UserX size={16} />}
                             >
                               رفض
                             </Button>
                           </>
                         )}
                         
                         {/* Actions Dropdown */}
                         <div className="relative">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => toggleDropdown(user.id)}
                             leftIcon={<Settings size={16} />}
                             rightIcon={<ChevronDown size={16} />}
                             disabled={actionLoading === user.id}
                           >
                             إدارة
                           </Button>
                           
                           {openDropdowns[user.id] && (
                             <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                               <div className="py-1">
                                 <button
                                   onClick={() => openEditModal(user)}
                                   className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                                 >
                                   <Edit size={16} />
                                   تعديل البيانات
                                 </button>
                                 
                                 <button
                                   onClick={() => openResetPasswordModal(user)}
                                   className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                                 >
                                   <Key size={16} />
                                   إعادة تعيين كلمة المرور
                                 </button>
                                 
                                 <button
                                   onClick={() => openActivityModal(user)}
                                   className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                                 >
                                   <Activity size={16} />
                                   عرض النشاط
                                 </button>
                                 
                                 <div className="border-t border-gray-100 my-1"></div>
                                 
                                 {user.account_status !== 'approved' && (
                                   <button
                                     onClick={() => handleChangeStatus(user, 'approved')}
                                     className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-right"
                                   >
                                     <CheckCircle size={16} />
                                     الموافقة على الحساب
                                   </button>
                                 )}
                                 
                                 {user.account_status !== 'pending' && (
                                   <button
                                     onClick={() => handleChangeStatus(user, 'pending')}
                                     className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 w-full text-right"
                                   >
                                     <Clock size={16} />
                                     تعليق الحساب
                                   </button>
                                 )}
                                 
                                 {user.account_status !== 'rejected' && (
                                   <button
                                     onClick={() => handleChangeStatus(user, 'rejected')}
                                     className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-right"
                                   >
                                     <XCircle size={16} />
                                     رفض الحساب
                                   </button>
                                 )}
                                 
                                 <div className="border-t border-gray-100 my-1"></div>
                                 
                                 <button
                                   onClick={() => handleDeleteUser(user)}
                                   className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-right"
                                 >
                                   <Trash2 size={16} />
                                   حذف المستخدم
                                 </button>
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          isLoading={loading}
        >
          تحديث البيانات
        </Button>
      </div>

      {/* Modals */}
      {selectedUser && (
        <>
          <EditUserModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            user={selectedUser}
            onSuccess={handleModalSuccess}
          />
          
          <ResetPasswordModal
            isOpen={resetPasswordModalOpen}
            onClose={() => setResetPasswordModalOpen(false)}
            user={selectedUser}
            onSuccess={handleModalSuccess}
          />
          
          <UserActivityModal
            isOpen={activityModalOpen}
            onClose={() => setActivityModalOpen(false)}
            user={selectedUser}
          />
        </>
      )}

      {/* Click outside to close dropdowns */}
      {Object.values(openDropdowns).some(open => open) && (
        <div
          className="fixed inset-0 z-5"
          onClick={closeAllDropdowns}
        />
      )}
    </div>
  );
};

export default UserManagementPage; 