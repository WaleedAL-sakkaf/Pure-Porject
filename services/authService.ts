import { User, UserRole } from '../types';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
// MOCK_USERS_DATA_KEY is no longer used to store the full list of users in localStorage.
// The backend will be the source of truth for users.

const apiCallDelay = (ms: number = 10) => new Promise(resolve => setTimeout(resolve, ms));

// Create an axios instance with base URL
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Password hashing and verification will be handled by the backend.

export const signup = async (username: string, password: string, companyName: string, phoneNumbers: string[], role: UserRole): Promise<User> => {
  try {
    const response = await authApi.post('/signup', {
      username,
      password,
      companyName,
      phoneNumbers,
      role
    });
    
    return response.data.user;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
  }
};

export const login = async (username: string, password: string): Promise<User | null> => {
  try {
    const response = await authApi.post('/login', {
      username,
      password
    });
    
    const user = response.data;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  } catch (error: any) {
    localStorage.removeItem('currentUser');
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
  }
};

export const logout = async (): Promise<void> => {
  try {
    localStorage.removeItem('currentUser');
    return Promise.resolve();
  } catch (e) {
    console.warn("Failed to remove current user from localStorage.", e);
    return Promise.resolve();
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    console.warn("Failed to get current user from localStorage.", e);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: { companyName?: string; phoneNumbers?: string[] }
): Promise<User | null> => {
  try {
    const response = await authApi.put(`/profile/${userId}`, updates);
    
    const updatedUser = response.data;
    const storedCurrentUser = getCurrentUser();
    
    if (storedCurrentUser && storedCurrentUser.id === userId) {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    
    return updatedUser;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.');
  }
};

// initializeMockUsers is removed as the full user list is no longer managed here.
// The minimal mock admin/posagent users are handled directly in the login function for demonstration.
// A real application would seed users in the MySQL database.

// Get pending users (Admin only)
export const getPendingUsers = async () => {
  try {
    const response = await authApi.get('/pending-users');
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في جلب الحسابات المعلقة');
  }
};

// Approve user (Admin only)
export const approveUser = async (userId: string, adminId: string) => {
  try {
    const response = await authApi.post('/approve-user', { userId, adminId });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في الموافقة على الحساب');
  }
};

// Reject user (Admin only)
export const rejectUser = async (userId: string, adminId: string) => {
  try {
    const response = await authApi.post('/reject-user', { userId, adminId });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في رفض الحساب');
  }
};

// Get approval statistics
export const getApprovalStats = async () => {
  try {
    const response = await authApi.get('/approval-stats');
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في جلب إحصائيات الموافقة');
  }
};

// Get all users with filtering (Admin only)
export const getAllUsers = async (status?: string, search?: string) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await authApi.get(`/all-users?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في جلب قائمة المستخدمين');
  }
};

// Edit user (Admin only)
export const editUser = async (userId: string, userData: {
  username: string;
  companyName: string;
  phoneNumbers: string[];
  role: string;
}) => {
  try {
    const response = await authApi.put(`/edit-user/${userId}`, userData);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في تحديث بيانات المستخدم');
  }
};

// Delete user (Admin only)
export const deleteUser = async (userId: string) => {
  try {
    const response = await authApi.delete(`/delete-user/${userId}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في حذف المستخدم');
  }
};

// Reset user password (Admin only)
export const resetUserPassword = async (userId: string, newPassword: string) => {
  try {
    const response = await authApi.post(`/reset-password/${userId}`, { newPassword });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في إعادة تعيين كلمة المرور');
  }
};

// Change user status (Admin only)
export const changeUserStatus = async (userId: string, status: string) => {
  try {
    const response = await authApi.post(`/change-status/${userId}`, { status });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في تغيير حالة المستخدم');
  }
};

// Get user activity (Admin only)
export const getUserActivity = async (userId: string) => {
  try {
    const response = await authApi.get(`/user-activity/${userId}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في جلب سجل نشاط المستخدم');
  }
};

// Get all admin operations (Admin only)
export const getAdminOperations = async () => {
  try {
    const response = await authApi.get('/admin-operations');
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('فشل في جلب سجل العمليات الإدارية');
  }
};
