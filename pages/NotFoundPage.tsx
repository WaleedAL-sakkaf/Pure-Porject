
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10">
      <AlertTriangle size={64} className="text-yellow-500 mb-6" />
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3">الصفحة غير موجودة</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        عذرًا، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم حذفها أو أن الرابط غير صحيح.
      </p>
      <Link
        to="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
      >
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
};

export default NotFoundPage;