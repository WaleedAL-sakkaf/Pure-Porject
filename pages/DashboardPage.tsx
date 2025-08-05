/*
=== ملاحظات التخصيص - لوحة التحكم الرئيسية ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - للبطاقات والروابط النشطة
- green: أخضر - لبطاقة إجمالي المبيعات والاتجاه الصاعد
- orange: برتقالي - لبطاقة العملاء النشطين
- yellow: أصفر - لبطاقة الطلبات المعلقة والتحذيرات
- muted-foreground: رمادي - للنصوص الثانوية

البطاقات الإحصائية (DashboardStatCard):
1. إجمالي المبيعات - أيقونة DollarSign باللون الأخضر
2. إجمالي الطلبات - أيقونة ShoppingCart باللون الأساسي
3. العملاء النشطون - أيقونة Users باللون البرتقالي
4. طلبات معلقة - أيقونة AlertTriangle باللون الأصفر

الأيقونات ومعانيها:
- DollarSign: رمز المبيعات والأموال (أخضر)
- ShoppingCart: رمز الطلبات والمبيعات (أزرق)
- Users: رمز العملاء (برتقالي)
- AlertTriangle: رمز التحذير والطلبات المعلقة (أصفر)
- ArrowUpRight: سهم صاعد للاتجاه الإيجابي (أخضر)
- ArrowDownRight: سهم هابط للاتجاه السلبي (أحمر)
- TrendingUp: رمز الاتجاه الصاعد

ألوان حالات الطلبات:
- Delivered: bg-green-100 text-green-800 (أخضر للمُسلّم)
- Pending: bg-yellow-100 text-yellow-800 (أصفر للمعلق)
- Default: bg-gray-100 text-gray-800 (رمادي للحالات الأخرى)

الرسم البياني (LineChart):
- خط المبيعات: اللون الأساسي (أزرق)
- النقاط النشطة: دائرة بيضاء مع حد أزرق
- الشبكة: خطوط رمادية منقطة
- التلميحات: خلفية البطاقة مع حدود رمادية

تخصيص الألوان:
- ألوان البطاقات: iconBgColor في كل DashboardStatCard
- ألوان الاتجاه: trendColor في البطاقات
- الرسم البياني: chartPrimaryColor، chartTextColor، chartGridColor
- حالات الطلبات: في دالة render الخاصة بعمود status

العناصر القابلة للنقر:
- جميع البطاقات الإحصائية تؤدي لصفحات مختلفة
- صفوف جدول الطلبات الحديثة تؤدي لصفحة تعديل الطلب
- زر "عرض جميع الطلبات" يؤدي لصفحة الطلبات

المتغيرات المهمة:
- DashboardStats: بيانات الإحصائيات
- SalesReportDataPoint: نقاط بيانات المبيعات
- recentOrdersColumns: أعمدة جدول الطلبات الحديثة
*/

import React, { useEffect, useMemo } from 'react';
import { DollarSign, ShoppingCart, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp, UserCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import { getDashboardStats, getSalesReport, getOrders } from '../services/apiService';
import { getApprovalStats } from '../services/authService';
import { DashboardStats, SalesReportDataPoint, Order, OrderStatus, TableColumn } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Table from '../components/ui/Table';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { formatDate } from '../services/printService'; // Import the new formatDate function

const DashboardStatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  iconBgColor?: string;
  trend?: 'up' | 'down' | 'neutral'; 
  trendValue?: string; 
  trendColor?: string;
  onClick?: () => void;
}> = 
({ title, value, icon, iconBgColor = 'bg-primary-light dark:bg-primary-dark/30', trend, trendValue, trendColor, onClick }) => (
  <Card 
    className="shadow-md hover:shadow-lg dark:hover:shadow-lg-dark transition-all duration-300 ease-in-out"
    onClick={onClick}
    bodyClassName='p-5'
  >
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-lg ${iconBgColor}`}>
        {icon}
      </div>
      {trend && trendValue && (
        <div className={`flex items-center text-xs font-medium ${trendColor || (trend === 'up' ? 'text-green-500 dark:text-green-400' : trend === 'down' ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground')}`}>
          {trend === 'up' ? <ArrowUpRight size={14} className="me-0.5" /> : trend === 'down' ? <ArrowDownRight size={14} className="me-0.5" /> : null}
          {trendValue}
        </div>
      )}
    </div>
    <div className="mt-3">
        <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
    </div>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { data: stats, isLoading: isLoadingStats, exec: fetchStats } = useApi<DashboardStats, [], DashboardStats>(getDashboardStats);
  const { data: salesReport, isLoading: isLoadingSalesReport, exec: fetchSalesReport } = useApi<SalesReportDataPoint[], [], SalesReportDataPoint[]>(getSalesReport);
  const { data: recentOrders, isLoading: isLoadingRecentOrders, exec: fetchRecentOrders, setData: setRecentOrders } = useApi<Order[], [], Order[]>(getOrders);
  const { data: approvalStats, isLoading: isLoadingApprovalStats, exec: fetchApprovalStats } = useApi<{pending: number, approved: number, rejected: number, total: number}, [], {pending: number, approved: number, rejected: number, total: number}>(getApprovalStats);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchSalesReport();
    fetchRecentOrders().then(orders => {
      if(orders) {
        setRecentOrders(orders.slice(0,5)); 
      }
    });
    
    // Fetch approval stats only for admins
    if (currentUser?.role === UserRole.Admin) {
      fetchApprovalStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const recentOrdersColumns = useMemo<TableColumn<Order>[]>(() => [
    { key: 'orderNumber', header: 'رقم الطلب', render: (item: Order) => <span className="font-medium text-primary">{item.orderNumber}</span> },
    { key: 'customerName', header: 'اسم العميل' },
    {
      key: 'orderDate',
      header: 'تاريخ الطلب',
      render: (item: Order) => formatDate(item.orderDate, 'short'),
    },
    {
      key: 'totalAmount',
      header: 'المبلغ',
      render: (item: Order) => `${item.totalAmount ? item.totalAmount.toLocaleString() : '0'} ر.س`,
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (item: Order) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.status === OrderStatus.Delivered ? 'bg-green-100 text-green-800' :
            item.status === OrderStatus.Pending ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}
        >
          {item.status}
        </span>
      ),
    },
  ], []);

  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartTextColor = isDarkMode ? 'var(--color-muted-foreground)' : 'var(--color-muted-foreground)'; 
  const chartGridColor = isDarkMode ? 'var(--color-border)' : 'var(--color-border)';
  const chartPrimaryColor = isDarkMode ? 'var(--color-primary-light)' : 'var(--color-primary-default)';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">لوحة التحكم الرئيسية</h1>
      
      {/* Pending Users Notification */}
      {currentUser?.role === UserRole.Admin && !isLoadingApprovalStats && approvalStats && approvalStats.pending > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <UserCheck className="text-amber-600 me-3" size={24} />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  يوجد {approvalStats.pending} حساب في انتظار الموافقة
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  يرجى مراجعة الحسابات الجديدة والموافقة عليها
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/user-management')}
              className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:border-amber-400 dark:text-amber-200 dark:hover:bg-amber-800/30"
            >
              مراجعة الحسابات
            </Button>
          </div>
        </Card>
      )}

      {isLoadingStats ? <div className="min-h-[150px] flex items-center justify-center"><LoadingSpinner text="جاري تحميل الإحصائيات..." /></div> : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <DashboardStatCard title="إجمالي المبيعات" value={`${stats.totalSales.toLocaleString()} ر.س`} icon={<DollarSign size={24} className="text-green-500" />} iconBgColor="bg-green-100 dark:bg-green-500/20" trend="up" trendValue="+5%" trendColor="text-green-500" onClick={() => navigate('/reports/sales')} />
          <DashboardStatCard title="إجمالي الطلبات" value={stats.totalOrders} icon={<ShoppingCart size={24} className="text-primary" />} iconBgColor="bg-primary-light/20 dark:bg-primary-dark/20" trend="up" trendValue="+10" onClick={() => navigate('/orders')} />
          <DashboardStatCard title="العملاء النشطون" value={stats.totalCustomers} icon={<Users size={24} className="text-orange-500" />} iconBgColor="bg-orange-100 dark:bg-orange-500/20" onClick={() => navigate('/customers')} />
          <DashboardStatCard title="طلبات معلقة" value={stats.pendingOrders} icon={<AlertTriangle size={24} className="text-yellow-500" />} iconBgColor="bg-yellow-100 dark:bg-yellow-500/20" trendColor="text-yellow-600" trendValue={stats.pendingOrders > 0 ? "تحتاج متابعة" : "لا يوجد"} onClick={() => navigate('/orders')} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card title="نظرة عامة على المبيعات" className="lg:col-span-3 shadow-md" bodyClassName="p-2 sm:p-4">
          {isLoadingSalesReport ? <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner text="جاري تحميل تقرير المبيعات..." /></div> : salesReport && salesReport.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesReport} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="date" tickFormatter={(tick) => formatDate(tick, { day: 'numeric', month: 'short' })} tick={{ fill: chartTextColor, fontSize: 12 }} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} tickFormatter={(value) => `${value/1000} ألف`} />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: `1px solid ${chartGridColor}`, borderRadius: '0.5rem', direction: 'rtl' }}
                    labelStyle={{ color: chartTextColor, fontWeight: 'bold' }}
                    itemStyle={{ color: chartTextColor }}
                    formatter={(value: number) => [`${value.toLocaleString()} ر.س`, "المبيعات"]} 
                />
                <Legend wrapperStyle={{ direction: 'rtl', color: chartTextColor, fontSize: 12 }} formatter={() => "المبيعات"} />
                <Line type="monotone" dataKey="sales" stroke={chartPrimaryColor} strokeWidth={2.5} activeDot={{ r: 7, strokeWidth: 2, fill: 'var(--color-card)', stroke: chartPrimaryColor }} dot={{fill: chartPrimaryColor, r:4, strokeWidth:0 }}/>
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-10 min-h-[300px] flex items-center justify-center">لا توجد بيانات مبيعات كافية لعرض الرسم البياني.</p>}
        </Card>
        
        <Card title="أحدث الطلبات" className="lg:col-span-2 shadow-md flex flex-col" bodyClassName="p-0 flex-grow">
          {isLoadingRecentOrders ? <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner text="جاري تحميل الطلبات..." /></div> : (
            <>
            <div className="overflow-auto flex-grow max-h-[300px]">
              <Table 
                columns={recentOrdersColumns} 
                data={recentOrders || []}
                onRowClick={(order) => navigate(`/orders/edit/${order.id}`)}
                emptyMessage="لا توجد طلبات حديثة."
                tableClassName="shadow-none border-0 rounded-none"
              />
            </div>
            {recentOrders && recentOrders.length > 0 && (
                 <div className="p-3 border-t border-border">
                    <Button variant="link" onClick={() => navigate('/orders')} className="w-full text-sm">
                        عرض جميع الطلبات
                    </Button>
                </div>
            )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;