import React, { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { Order, Driver, OrderStatus, TableColumn, SelectOption } from '../types';
import { getOrders, getDrivers } from '../services/apiService';
import { printHtml, generateDetailedDeliveryReportHtmlForPrint, formatDate } from '../services/printService'; // Import formatDate
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Printer, Filter, Calendar, User, Truck as TruckIcon } from 'lucide-react';
import { ORDER_STATUS_OPTIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext'; 

const DetailedDeliveryReportPage: React.FC = () => {
  const { currentUser } = useAuth(); 
  const { data: allOrders, isLoading: isLoadingOrders, exec: fetchOrders } = useApi<Order[], [], Order[]>(getOrders, []);
  const { data: allDrivers, isLoading: isLoadingDrivers, exec: fetchDrivers } = useApi<Driver[], [], Driver[]>(getDrivers, []);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, [fetchOrders, fetchDrivers]);

  const driverOptions: SelectOption[] = useMemo(() => {
    if (!allDrivers) return [{ value: 'all', label: 'جميع السائقين' }];
    return [
      { value: 'all', label: 'جميع السائقين' },
      ...allDrivers.map(driver => ({ value: driver.id, label: driver.name }))
    ];
  }, [allDrivers]);

  const statusOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'جميع الحالات' },
      ...ORDER_STATUS_OPTIONS.filter(opt => [OrderStatus.OutForDelivery, OrderStatus.Delivered, OrderStatus.Pending].includes(opt.value as OrderStatus))
    ];
  }, []);


  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    return allOrders
      .filter(order => {
        const orderDate = new Date(order.orderDate); 
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        const dateMatch = orderDate >= start && orderDate <= end;
        
        const driverMatch = selectedDriverId === 'all' || order.driverId === selectedDriverId;
        const statusMatch = selectedStatus === 'all' || order.status === selectedStatus;

        return dateMatch && driverMatch && statusMatch;
      })
      .sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [allOrders, startDate, endDate, selectedDriverId, selectedStatus]);

  const summaryStats = useMemo(() => {
    const totalFilteredOrders = filteredOrders.length;
    const outForDeliveryCount = filteredOrders.filter(o => o.status === OrderStatus.OutForDelivery).length;
    const deliveredCount = filteredOrders.filter(o => o.status === OrderStatus.Delivered).length;
    return { totalFilteredOrders, outForDeliveryCount, deliveredCount };
  }, [filteredOrders]);

  const getDriverName = (driverId?: string): string => {
    if (!allDrivers || !driverId) return 'غير محدد';
    return allDrivers.find(d => d.id === driverId)?.name || 'غير معروف';
  };

  const columns: TableColumn<Order>[] = [
    { key: 'orderNumber', header: 'رقم الطلب' },
    { 
      key: 'orderDate', 
      header: 'تاريخ الطلب', 
      render: (item) => formatDate(item.orderDate, 'short')
    },
    { key: 'customerName', header: 'اسم العميل' },
    { key: 'deliveryAddress', header: 'عنوان التوصيل', className: 'max-w-xs truncate' },
    { key: 'driverId', header: 'السائق', render: (item) => getDriverName(item.driverId) },
    { 
      key: 'deliveryDate', 
      header: 'تاريخ التوصيل', 
      render: (item) => item.status === OrderStatus.Delivered && item.deliveryDate ? formatDate(item.deliveryDate, 'short') : 'لم يتم بعد'
    },
    { key: 'status', header: 'الحالة', render: (item) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            item.status === OrderStatus.Delivered ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
            item.status === OrderStatus.Pending ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-100' :
            item.status === OrderStatus.OutForDelivery ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-blue-100' :
            'bg-red-100 text-red-700 dark:bg-red-600 dark:text-red-100' 
        }`}>{item.status}</span>
    )},
    { key: 'totalAmount', header: 'المبلغ', render: (item) => `${item.totalAmount.toLocaleString()} ر.س` },
  ];

  const handlePrintReport = () => {
    if (!currentUser || !allDrivers) {
        alert("خطأ: بيانات المستخدم أو السائقين غير متاحة للطباعة.");
        return;
    }
    if (filteredOrders.length === 0) {
      alert("لا توجد بيانات لطباعتها بالمعايير المحددة.");
      return;
    }
    const filters = { startDate, endDate, driverId: selectedDriverId, status: selectedStatus };
    const reportHtml = generateDetailedDeliveryReportHtmlForPrint(filteredOrders, allDrivers, filters, summaryStats, currentUser.companyName, currentUser.phoneNumbers); 
    printHtml(reportHtml, `تقرير التوصيل (${startDate} - ${endDate})`);
  };

  const anyLoading = (isLoadingOrders && !allOrders?.length) || (isLoadingDrivers && !allDrivers?.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">تقرير التوصيل المفصل</h2>
        <Button onClick={handlePrintReport} leftIcon={<Printer size={20} />} variant="secondary" disabled={filteredOrders.length === 0 || !allDrivers || !currentUser}>
          طباعة التقرير
        </Button>
      </div>

      <Card title="تصفية التقرير" titleClassName="flex items-center gap-2">
        <Filter size={20} className="text-blue-600 dark:text-blue-400 inline"/>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            label="من تاريخ الطلب"
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            leftIcon={<Calendar size={16} className="text-gray-400" />}
          />
          <Input
            label="إلى تاريخ الطلب"
            type="date"
            name="endDate"
            value={endDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            leftIcon={<Calendar size={16} className="text-gray-400" />}
          />
          <Select
            label="السائق"
            options={driverOptions}
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            leftIcon={<User size={16} className="text-gray-400"/>}
            wrapperClassName="min-w-[150px]"
          />
           <Select
            label="حالة الطلب"
            options={statusOptions}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            leftIcon={<TruckIcon size={16} className="text-gray-400"/>}
            wrapperClassName="min-w-[150px]"
          />
           <p className="text-xs text-gray-500 dark:text-gray-400 md:col-span-full">
            يتم تحديث التقرير تلقائيًا عند تغيير الفلاتر.
          </p>
        </div>
      </Card>

      {anyLoading ? (
        <LoadingSpinner text="جاري تحميل البيانات..." />
      ) : (
        <>
          <Card title="ملخص الطلبات حسب الفلاتر">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summaryStats.totalFilteredOrders}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">طلبات قيد التوصيل</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summaryStats.outForDeliveryCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">طلبات تم توصيلها</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summaryStats.deliveredCount}</p>
              </div>
            </div>
          </Card>
          
          <Card title="تفاصيل الطلبات حسب الفلاتر">
            <Table
              columns={columns}
              data={filteredOrders}
              isLoading={isLoadingOrders && filteredOrders.length === 0}
              emptyMessage="لا توجد طلبات تطابق المعايير المحددة."
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DetailedDeliveryReportPage;