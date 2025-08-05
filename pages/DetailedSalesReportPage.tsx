import React, { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { Order, OrderStatus, SalesReportDataPoint, TableColumn } from '../types';
import { getOrders } from '../services/apiService';
import { printHtml, generateDetailedSalesReportHtmlForPrint, formatDate } from '../services/printService'; // Import formatDate
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Printer, Filter, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext'; 

const DetailedSalesReportPage: React.FC = () => {
  const { currentUser } = useAuth(); 
  const { data: allOrders, isLoading: isLoadingOrders, exec: fetchOrders } = useApi<Order[], [], Order[]>(getOrders, []);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredSales = useMemo(() => {
    if (!allOrders) return [];
    return allOrders
      .filter(order => order.status === OrderStatus.Delivered)
      .filter(order => {
        const orderDate = new Date(order.deliveryDate || order.orderDate);
        const start = new Date(startDate);
        start.setHours(0,0,0,0); 
        const end = new Date(endDate);
        end.setHours(23,59,59,999); 
        return orderDate >= start && orderDate <= end;
      })
      .sort((a,b) => new Date(b.deliveryDate || b.orderDate).getTime() - new Date(a.deliveryDate || a.orderDate).getTime());
  }, [allOrders, startDate, endDate]);

  const summaryStats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, order) => sum + order.totalAmount, 0);
    const numberOfOrders = filteredSales.length;
    return { totalSales, numberOfOrders };
  }, [filteredSales]);

  const salesChartData = useMemo(() => {
    const salesByDate: { [key: string]: number } = {};
    filteredSales.forEach(order => {
      // Use YYYY-MM-DD for consistent keying and sorting
      const dateKey = new Date(order.deliveryDate || order.orderDate).toISOString().split('T')[0];
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + order.totalAmount;
    });
    return Object.entries(salesByDate)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredSales]);

  const columns: TableColumn<Order>[] = [
    { key: 'orderNumber', header: 'رقم الطلب' },
    { 
      key: 'deliveryDate', 
      header: 'تاريخ البيع', 
      render: (item) => formatDate(item.deliveryDate || item.orderDate, 'short')
    },
    { key: 'customerName', header: 'اسم العميل' },
    { 
      key: 'items', 
      header: 'المنتجات', 
      render: (item) => (
        <ul className="list-disc list-inside text-xs">
          {item.items.slice(0, 2).map(pItem => <li key={pItem.productId} title={`${pItem.productName} (x${pItem.quantity})`}>{pItem.productName.substring(0,20)}{pItem.productName.length > 20 ? '...' : ''} (x${pItem.quantity})</li>)}
          {item.items.length > 2 && <li>...والمزيد</li>}
        </ul>
      ),
      className: 'max-w-xs truncate'
    },
    { key: 'totalAmount', header: 'المبلغ الإجمالي', render: (item) => `${item.totalAmount.toLocaleString()} ر.س` },
  ];

  const handlePrintReport = () => {
    if (!currentUser) {
        alert("خطأ: بيانات المستخدم غير متاحة للطباعة.");
        return;
    }
    if (filteredSales.length === 0) {
      alert("لا توجد بيانات لطباعتها في الفترة المحددة.");
      return;
    }
    const reportHtml = generateDetailedSalesReportHtmlForPrint(filteredSales, startDate, endDate, summaryStats, currentUser.companyName, currentUser.phoneNumbers); 
    printHtml(reportHtml, `تقرير المبيعات المفصل (${startDate} - ${endDate})`);
  };
  
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartTextColor = isDarkMode ? '#A0AEC0' : '#4A5568';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">تقرير المبيعات المفصل</h2>
        <Button onClick={handlePrintReport} leftIcon={<Printer size={20} />} variant="secondary" disabled={filteredSales.length === 0 || !currentUser}>
          طباعة التقرير
        </Button>
      </div>

      <Card title="تصفية التقرير" titleClassName="flex items-center gap-2">
        <Filter size={20} className="text-blue-600 dark:text-blue-400 inline"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label="من تاريخ"
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            leftIcon={<Calendar size={16} className="text-gray-400" />}
          />
          <Input
            label="إلى تاريخ"
            type="date"
            name="endDate"
            value={endDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            leftIcon={<Calendar size={16} className="text-gray-400" />}
          />
           <p className="text-xs text-gray-500 dark:text-gray-400 md:col-span-3">
            يتم تحديث التقرير تلقائيًا عند تغيير التواريخ.
          </p>
        </div>
      </Card>

      {isLoadingOrders && !allOrders?.length ? (
        <LoadingSpinner text="جاري تحميل بيانات المبيعات..." />
      ) : (
        <>
          <Card title="ملخص الفترة المحددة">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center md:text-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summaryStats.totalSales.toLocaleString()} ر.س</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">عدد الطلبات (المسلمة)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.numberOfOrders}</p>
              </div>
            </div>
          </Card>

          <Card title="مبيعات الفترة (رسم بياني)">
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#4A5568" : "#E2E8F0"} />
                  <XAxis dataKey="date" tickFormatter={(tick) => formatDate(tick, { day: 'numeric', month: 'short' })} tick={{ fill: chartTextColor }} />
                  <YAxis tick={{ fill: chartTextColor }} />
                  <Tooltip 
                      contentStyle={{ backgroundColor: isDarkMode ? '#2D3748' : '#FFFFFF', border: isDarkMode ? '1px solid #4A5568': '1px solid #E2E8F0', direction: 'rtl' }}
                      labelStyle={{ color: chartTextColor }}
                      formatter={(value: number) => [`${value.toLocaleString()} ر.س`, "المبيعات"]} 
                  />
                  <Legend wrapperStyle={{ direction: 'rtl', color: chartTextColor }} formatter={() => "إجمالي المبيعات اليومية"} />
                  <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 6, fill: isDarkMode ? '#60A5FA' : '#3B82F6' }} dot={{fill: isDarkMode ? '#60A5FA' : '#3B82F6' }}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">لا توجد بيانات مبيعات كافية لعرض الرسم البياني للفترة المحددة.</p>
            )}
          </Card>
          
          <Card title="تفاصيل المبيعات للفترة المحددة">
            <Table
              columns={columns}
              data={filteredSales}
              isLoading={isLoadingOrders && filteredSales.length === 0}
              emptyMessage="لا توجد مبيعات في الفترة المحددة."
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DetailedSalesReportPage;