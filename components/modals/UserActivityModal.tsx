import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getUserActivity } from '../../services/authService';
import { 
  Activity, 
  Calendar, 
  Wifi, 
  LogIn, 
  XCircle, 
  CheckCircle, 
  Clock, 
  Shield,
  Monitor
} from 'lucide-react';

interface UserActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

interface LoginAttempt {
  attempt_type: 'success' | 'failed_password' | 'account_pending' | 'account_rejected';
  ip_address: string;
  created_at: string;
  user_agent: string;
}

interface AdminOperation {
  operation_type: string;
  description: string;
  created_at: string;
  admin_id: string;
}

const UserActivityModal: React.FC<UserActivityModalProps> = ({ isOpen, onClose, user }) => {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [adminOperations, setAdminOperations] = useState<AdminOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'admin'>('login');

  useEffect(() => {
    if (isOpen) {
      fetchUserActivity();
    }
  }, [isOpen, user.id]);

  const fetchUserActivity = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUserActivity(user.id);
      setLoginAttempts(data.loginAttempts || []);
      setAdminOperations(data.adminOperations || []);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب سجل النشاط');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttemptIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <LogIn className="text-green-600" size={16} />;
      case 'failed_password':
        return <XCircle className="text-red-600" size={16} />;
      case 'account_pending':
        return <Clock className="text-yellow-600" size={16} />;
      case 'account_rejected':
        return <XCircle className="text-red-600" size={16} />;
      default:
        return <Activity className="text-gray-600" size={16} />;
    }
  };

  const getAttemptLabel = (type: string) => {
    switch (type) {
      case 'success':
        return 'دخول ناجح';
      case 'failed_password':
        return 'كلمة مرور خاطئة';
      case 'account_pending':
        return 'حساب معلق';
      case 'account_rejected':
        return 'حساب مرفوض';
      default:
        return type;
    }
  };

  const getAttemptColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed_password':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'account_pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'account_rejected':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'approve_user':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'reject_user':
        return <XCircle className="text-red-600" size={16} />;
      case 'edit_user':
        return <Shield className="text-blue-600" size={16} />;
      case 'reset_password':
        return <Shield className="text-orange-600" size={16} />;
      case 'change_status':
        return <Activity className="text-purple-600" size={16} />;
      default:
        return <Activity className="text-gray-600" size={16} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`نشاط المستخدم: ${user.username}`}>
      <div className="max-h-[70vh] overflow-y-auto">
        {/* User Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Shield size={16} />
            <span className="font-medium">معلومات المستخدم</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">اسم المستخدم:</span>
              <span className="font-medium mr-2">{user.username}</span>
            </div>
            <div>
              <span className="text-gray-600">الشركة:</span>
              <span className="font-medium mr-2">{user.companyName}</span>
            </div>
            <div>
              <span className="text-gray-600">الصلاحية:</span>
              <span className="font-medium mr-2">{user.role === 'admin' ? 'مدير' : 'موظف'}</span>
            </div>
            <div>
              <span className="text-gray-600">حالة الحساب:</span>
              <span className="font-medium mr-2">
                {user.accountStatus === 'approved' ? 'موافق عليه' : 
                 user.accountStatus === 'pending' ? 'معلق' : 'مرفوض'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('login')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'login'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LogIn className="inline mr-2" size={16} />
            محاولات الدخول ({loginAttempts.length})
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'admin'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="inline mr-2" size={16} />
            العمليات الإدارية ({adminOperations.length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Login Attempts Tab */}
            {activeTab === 'login' && (
              <div className="space-y-3">
                {loginAttempts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <LogIn className="mx-auto mb-2" size={32} />
                    <p>لا توجد محاولات دخول مسجلة</p>
                  </div>
                ) : (
                  loginAttempts.map((attempt, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getAttemptColor(attempt.attempt_type)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getAttemptIcon(attempt.attempt_type)}
                          <span className="font-medium">{getAttemptLabel(attempt.attempt_type)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>{formatDate(attempt.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Wifi size={14} />
                          <span>{attempt.ip_address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Monitor size={14} />
                          <span className="truncate max-w-xs">{attempt.user_agent}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Admin Operations Tab */}
            {activeTab === 'admin' && (
              <div className="space-y-3">
                {adminOperations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="mx-auto mb-2" size={32} />
                    <p>لا توجد عمليات إدارية مسجلة</p>
                  </div>
                ) : (
                  adminOperations.map((operation, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border bg-gray-50 border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getOperationIcon(operation.operation_type)}
                          <span className="font-medium">{operation.description}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>{formatDate(operation.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>بواسطة المدير: {operation.admin_id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <Button
            variant="outline"
            onClick={onClose}
          >
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserActivityModal; 