
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Users, Package, Truck, FileText, BarChart2, ChevronDown, ChevronUp, Droplets, ShoppingBasket, LogOut, Archive, Settings, UserCircle, HelpCircle, UserCheck } from 'lucide-react';
import { APP_NAME } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import Button from '../ui/Button';


interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
  path: string;
  name: string;
  icon: React.ReactElement;
  subItems?: NavItem[];
  roles?: UserRole[];
}

const allNavItems: NavItem[] = [
  { path: '/dashboard', name: 'لوحة التحكم', icon: <Home size={20} />, roles: [UserRole.Admin] },
  { path: '/pos', name: 'نقطة البيع', icon: <ShoppingBasket size={20} />, roles: [UserRole.Admin, UserRole.PosAgent] },
  { path: '/orders', name: 'إدارة الطلبات', icon: <ShoppingCart size={20} />, roles: [UserRole.Admin] },
  { path: '/customers', name: 'إدارة العملاء', icon: <Users size={20} />, roles: [UserRole.Admin] },
  { path: '/products', name: 'إدارة المنتجات', icon: <Package size={20} />, roles: [UserRole.Admin] },
  { path: '/drivers', name: 'إدارة السائقين', icon: <Truck size={20} />, roles: [UserRole.Admin] },
  { path: '/billing', name: 'الفواتير', icon: <FileText size={20} />, roles: [UserRole.Admin] },
  { path: '/reports', name: 'التقارير', icon: <BarChart2 size={20} />, roles: [UserRole.Admin] },
  { path: '/backup-restore', name: 'النسخ الاحتياطي', icon: <Archive size={20} />, roles: [UserRole.Admin] },
  { path: '/user-management', name: 'إدارة الحسابات', icon: <UserCheck size={20} />, roles: [UserRole.Admin] },
];

const SidebarNavItem: React.FC<{ item: NavItem; closeSidebarOnMobile: () => void }> = ({ item, closeSidebarOnMobile }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = React.useState(false);

  const handleItemClick = (e: React.MouseEvent) => {
    if (item.subItems) {
      e.preventDefault(); // Prevent navigation for parent items with submenus
      setIsSubMenuOpen(!isSubMenuOpen);
    } else {
      closeSidebarOnMobile();
    }
  };
  
  return (
    <li>
      <NavLink
        to={item.path}
        onClick={handleItemClick}
        className={({ isActive }) =>
          `flex items-center p-3 my-1 rounded-md hover:bg-primary-hover hover:text-primary-text dark:hover:bg-primary-hover/80 transition-all duration-200 group ${
            isActive && !item.subItems ? 'bg-primary text-primary-text shadow-sm' : 'text-muted-foreground hover:text-foreground dark:hover:text-primary-text'
          }`
        }
      >
        <span className={`transition-colors duration-200 ${item.subItems && isSubMenuOpen ? 'text-primary' : ''}`}>{item.icon}</span>
        <span className="ms-3 flex-1">{item.name}</span>
        {item.subItems && (isSubMenuOpen ? <ChevronUp size={16} className="ms-auto transform transition-transform" /> : <ChevronDown size={16} className="ms-auto transform transition-transform" />)}
      </NavLink>
      {item.subItems && isSubMenuOpen && (
        <ul className="ms-5 mt-1 space-y-1 border-s-2 border-primary-light dark:border-primary-dark/50 ps-3 py-1">
          {item.subItems.map(subItem => (
            <SidebarNavItem key={subItem.path} item={subItem} closeSidebarOnMobile={closeSidebarOnMobile} />
          ))}
        </ul>
      )}
    </li>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    closeSidebarOnMobile();
    navigate('/login');
  };

  const visibleNavItems = React.useMemo(() => {
    if (!currentUser) return [];
    return allNavItems.filter(item => 
      item.roles?.includes(currentUser.role)
    );
  }, [currentUser]);

  if (!currentUser) {
    return null; 
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"></div>}
      
      <aside
        className={`fixed md:relative inset-y-0 start-0 z-40 flex flex-col w-64 bg-card text-foreground shadow-lg dark:shadow-xl-dark transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 border-e border-border`}
        aria-label="القائمة الجانبية الرئيسية"
      >
        <div className="flex items-center justify-center p-5 border-b border-border">
          <Droplets size={36} className="text-primary me-2" />
          <span className="text-2xl font-bold text-primary">{APP_NAME}</span>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.length > 0 && (
            <ul>
              {visibleNavItems.map((item) => (
                <SidebarNavItem key={item.path} item={item} closeSidebarOnMobile={closeSidebarOnMobile} />
              ))}
            </ul>
          )}
        </nav>

        {/* Bottom utility links - Example, can be expanded */}
        <div className="p-3 border-t border-border mt-auto space-y-1">
           <NavLink
              to="/profile"
              onClick={closeSidebarOnMobile}
              className={({ isActive }) =>
                `flex items-center p-3 my-1 rounded-md hover:bg-primary-hover hover:text-primary-text dark:hover:bg-primary-hover/80 transition-all duration-200 group ${
                isActive ? 'bg-primary text-primary-text shadow-sm' : 'text-muted-foreground hover:text-foreground dark:hover:text-primary-text'
              }`}
            >
              <UserCircle size={20} />
              <span className="ms-3 flex-1">الملف الشخصي</span>
            </NavLink>
        </div>
        
        <div className="p-3 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300"
            onClick={handleLogout}
            leftIcon={<LogOut size={18} />}
          >
            تسجيل الخروج
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            &copy; {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
