
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { AlertTriangle, Check, FileText, ListChecks, ShoppingCart as ShoppingCartIcon, UserCircle } from 'lucide-react';

// Copied mockNotifications from Navbar.tsx - In a real app, this would come from a service/context.
const currentNotifications = [
    { id: 1, text: 'طلب جديد #ORD004 تم استلامه.', time: 'منذ 5 دقائق', icon: <ShoppingCartIcon size={20} className="text-blue-500 dark:text-blue-400" />, link: '/orders/edit/o4' },
    { id: 2, text: 'المنتج "مياه نقية (قارورة كبيرة)" على وشك النفاد.', time: 'منذ ساعة', icon: <AlertTriangle size={20} className="text-yellow-500 dark:text-yellow-400" />, link: '/products/edit/p1' },
    { id: 3, text: 'تم تحديث الفاتورة #INV002.', time: 'منذ 3 ساعات', icon: <FileText size={20} className="text-green-500 dark:text-green-400" />, link: '/billing?invoiceId=inv-o2-...' },
    { id: 4, text: 'مرحباً بك في النظام!', time: 'أمس', icon: <UserCircle size={20} className="text-gray-500 dark:text-gray-400" />, link: '#' },
  ];

const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">جميع الإشعارات</h2>
      <Card>
        {currentNotifications.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            لا توجد إشعارات لعرضها.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentNotifications.map((notif) => (
              <li key={notif.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start space-s-3"> {/* Adjusted for RTL: space-s-* */}
                  <div className="flex-shrink-0 mt-0.5">
                    {notif.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notif.link && notif.link !== '#' ? (
                        <Link to={notif.link} className="hover:underline">
                          {notif.text}
                        </Link>
                      ) : (
                        notif.text
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {notif.time}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => alert(`الإشعار ${notif.id} تم تمييزه كمقروء (وظيفة صورية).`)}>
                      <Check size={16} className="me-1" /> تمييز كمقروء
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {currentNotifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <Button variant="secondary" onClick={() => alert('جميع الإشعارات تم تمييزها كمقروءة (وظيفة صورية).')}>
              <ListChecks size={16} className="me-1" /> تمييز الكل كمقروء
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
