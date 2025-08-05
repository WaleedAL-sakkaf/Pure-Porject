import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, UserCircle, Sun, Moon, LogOut, LogIn, UserPlus, Settings, ChevronDown, ListChecks, ShoppingCart as ShoppingCartIcon, AlertTriangle as AlertTriangleIcon, FileText as FileTextIcon, X, Package } from 'lucide-react';
import { APP_NAME } from '../../constants';
import { Theme } from './Layout'; 
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean; 
  currentTheme: Theme;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isSidebarOpen, currentTheme, toggleTheme }) => {
  const { currentUser, logoutUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileIconRef = useRef<HTMLButtonElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsIconRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileDropdownOpen && profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node) && profileIconRef.current && !profileIconRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (isNotificationsDropdownOpen && notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node) && notificationsIconRef.current && !notificationsIconRef.current.contains(event.target as Node)) {
        setIsNotificationsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, isNotificationsDropdownOpen]);

  const handleLogout = async () => {
    await logoutUser();
    setIsProfileDropdownOpen(false);
    navigate('/login');
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    if (!isProfileDropdownOpen) setIsNotificationsDropdownOpen(false); // Close other dropdown
  };

  const toggleNotificationsDropdown = () => {
    setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen);
    if (!isNotificationsDropdownOpen) setIsProfileDropdownOpen(false); // Close other dropdown
  };
  
  const mockNotifications = [
    { id: 1, text: 'طلب جديد #ORD004 تم استلامه.', time: 'منذ 5 دقائق', icon: <ShoppingCartIcon size={18} className="text-primary" />, link: '/orders/edit/o4' },
    { id: 2, text: 'المنتج "مياه نقية (قارورة كبيرة)" على وشك النفاد.', time: 'منذ ساعة', icon: <AlertTriangleIcon size={18} className="text-yellow-500" />, link: '/products/edit/p1' },
    { id: 3, text: 'تم تحديث الفاتورة #INV002.', time: 'منذ 3 ساعات', icon: <FileTextIcon size={18} className="text-green-500" />, link: '/billing?invoiceId=inv-o2-...' },
    { id: 4, text: 'مرحباً بك في النظام!', time: 'أمس', icon: <UserCircle size={18} className="text-muted-foreground" />, link: '#' },
  ];

  interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    children: React.ReactNode;
  }
  
  const NavButton = React.forwardRef<HTMLButtonElement, NavButtonProps>(
    ({ children, label, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      className={`p-2 rounded-full text-muted-foreground hover:bg-secondary-hover hover:text-secondary-text transition-colors duration-150 ${props.className || ''}`}
      aria-label={label}
    >
      {children}
    </button>
  ));
  NavButton.displayName = 'NavButton';


  const loggedInUserContent = (
    <>
      <NavButton onClick={toggleTheme} label={currentTheme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}>
        {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </NavButton>
      
      <div className="relative">
        <NavButton 
          ref={notificationsIconRef}
          onClick={toggleNotificationsDropdown} 
          label="الإشعارات"
          aria-haspopup="true"
          aria-expanded={isNotificationsDropdownOpen}
          className="relative"
        >
          <Bell size={22} />
          {mockNotifications.length > 0 && (
            <span className="absolute top-1 end-1 block h-2.5 w-2.5 rounded-full ring-2 ring-card bg-red-500" aria-hidden="true"></span>
          )}
        </NavButton>
        {isNotificationsDropdownOpen && (
          <div 
            ref={notificationsDropdownRef}
            className="absolute end-0 mt-2 w-72 md:w-80 bg-card rounded-lg shadow-xl dark:shadow-xl-dark ring-1 ring-border z-50 overflow-hidden animate-fadeIn"
            role="menu" aria-orientation="vertical" aria-labelledby="notifications-button"
          >
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">الإشعارات</h3>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {mockNotifications.length > 0 ? mockNotifications.map(notif => (
                <Link 
                  key={notif.id}
                  to={notif.link || '#'} 
                  className="flex items-start px-4 py-3 text-sm text-muted-foreground hover:bg-secondary-light dark:hover:bg-secondary-dark/50 hover:text-foreground transition-colors"
                  role="menuitem"
                  onClick={() => setIsNotificationsDropdownOpen(false)}
                >
                  <span className="me-3 flex-shrink-0 mt-0.5">{notif.icon}</span>
                  <div className="flex-grow">
                    <p className="truncate text-foreground">{notif.text}</p>
                    <p className="text-xs">{notif.time}</p>
                  </div>
                </Link>
              )) : (
                 <p className="px-4 py-3 text-sm text-muted-foreground text-center">لا توجد إشعارات جديدة.</p>
              )}
            </div>
            {mockNotifications.length > 0 && (
              <div className="border-t border-border">
                  <Link 
                      to="/notifications"
                      className="block w-full px-4 py-3 text-sm font-medium text-center text-primary hover:bg-secondary-light dark:hover:bg-secondary-dark/50 transition-colors"
                      role="menuitem"
                      onClick={() => setIsNotificationsDropdownOpen(false)}
                  >
                      <ListChecks size={16} className="inline me-1" /> عرض جميع الإشعارات
                  </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <button 
          ref={profileIconRef}
          onClick={toggleProfileDropdown} 
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors duration-150 p-1 rounded-full hover:bg-secondary-hover" 
          aria-label="ملف المستخدم والقائمة"
          aria-haspopup="true"
          aria-expanded={isProfileDropdownOpen}
        >
          <UserCircle size={28} />
          <span className="hidden md:inline ms-1 text-sm font-medium">{currentUser!.companyName || currentUser!.username}</span>
          <ChevronDown size={16} className="ms-1 hidden md:inline transition-transform" style={{ transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
        {isProfileDropdownOpen && (
          <div 
            ref={profileDropdownRef}
            className="absolute end-0 mt-2 w-56 bg-card rounded-lg shadow-xl dark:shadow-xl-dark ring-1 ring-border py-1 z-50 animate-fadeIn"
            role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground truncate">مرحباً، {currentUser!.companyName || currentUser!.username}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser!.username} ({currentUser!.role})</p>
            </div>
            <Link 
              to="/profile"
              className="flex items-center w-full text-start px-4 py-2 text-sm text-muted-foreground hover:bg-secondary-light dark:hover:bg-secondary-dark/50 hover:text-foreground transition-colors"
              role="menuitem"
              onClick={() => setIsProfileDropdownOpen(false)}
            >
              <Settings size={16} className="me-2 text-primary"/>
              إعدادات الملف الشخصي
            </Link>
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="sm" 
              leftIcon={<LogOut size={16} />} 
              className="w-full justify-start px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-700/20 hover:text-red-700 dark:hover:text-red-300 rounded-none"
              role="menuitem"
            >
              تسجيل الخروج
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="relative hidden lg:block">
          <Input 
            type="text" 
            placeholder="بحث..." 
            aria-label="بحث في التطبيق"
            className="text-sm pe-10 bg-background border-border focus:ring-primary focus:border-primary" // Use theme colors
            leftIcon={<Search size={18} className="text-muted-foreground" />}
            wrapperClassName="mb-0"
          />
        </div>
      )}
    </>
  );

  const loggedOutUserContent = (
    <>
      <NavButton onClick={toggleTheme} label={currentTheme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}>
        {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </NavButton>
      <Button onClick={() => navigate('/login')} variant="ghost" className="text-primary hover:bg-primary-hover/10" leftIcon={<LogIn size={18} />}>تسجيل الدخول</Button>
      <Button onClick={() => navigate('/signup')} variant="primary" leftIcon={<UserPlus size={18} />}>إنشاء حساب</Button>
    </>
  );

  return (
    <header className="bg-card shadow-md dark:shadow-lg-dark p-3 sm:p-4 flex justify-between items-center sticky top-0 z-40 border-b border-border transition-colors duration-300">
      <div className="flex items-center">
        {currentUser && (
          <NavButton 
            onClick={toggleSidebar} 
            className="text-muted-foreground hover:text-foreground me-2 sm:me-4"
            aria-label={isSidebarOpen && window.innerWidth < 768 ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"}
            label={isSidebarOpen && window.innerWidth < 768 ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"} // Added label prop
          >
            {isSidebarOpen && window.innerWidth < 768 ? <X size={24} /> : <Menu size={24} />} 
          </NavButton>
        )}
        {/* App name can be removed if sidebar header is prominent enough */}
        {/* <h1 className="text-xl font-semibold text-foreground">{APP_NAME}</h1> */}
      </div>
      <div className="flex items-center space-s-2 sm:space-s-3 md:space-s-4">
        {currentUser ? loggedInUserContent : loggedOutUserContent}
      </div>
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
};

export default Navbar;
// Added a simple fade-in animation for dropdowns
// Used NavButton for theme and notification icon for consistency
// Improved profile dropdown trigger text and icon
// Improved search bar styling for admins
