import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const AccessDeniedPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  let homePath = '/dashboard'; // Default for Admin
  if (currentUser?.role === UserRole.PosAgent) {
    homePath = '/pos';
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-gray-50 dark:bg-gray-800">
      <ShieldAlert size={64} className="text-red-500 mb-6" />
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3">الوصول مرفوض</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        عذرًا، ليس لديك الصلاحية للوصول إلى هذه الصفحة أو المورد.
      </p>
      <div className="flex space-s-4">
        <Button onClick={() => navigate(-1)} variant="secondary">
          العودة للصفحة السابقة
        </Button>
        <Link to={homePath}>
          <Button variant="primary">
            الذهاب إلى صفحتي الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedPage;