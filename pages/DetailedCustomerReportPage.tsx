import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, Order, OrderStatus, TableColumn, CustomerType } from '../types';
import { getCustomers, getOrders } from '../services/apiService';
import { printHtml, generateDetailedCustomerReportHtmlForPrint, formatDate } from '../services/printService'; // Import formatDate
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Printer, Users, TrendingUp, TrendingDown, ShoppingBag, FileEdit, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; 
import { CUSTOMER_TYPE_OPTIONS } from '../constants';


interface CustomerReportData extends Customer {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
}

const DetailedCustomerReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); 
  const { data: allCustomers, isLoading: isLoadingCustomers, exec: fetchCustomers } = useApi<Customer[], [], Customer[]>(getCustomers, []);
  const { data: allOrders, isLoading: isLoadingOrders, exec: fetchOrders } = useApi<Order[], [], Order[]>(getOrders, []);

  useEffect(() => {
    fetchCustomers();
    fetchOrders();
  }, [fetchCustomers, fetchOrders]);

  const customersWithData = useMemo((): CustomerReportData[] => {
    if (!allCustomers || !allOrders) return [];

    // Now this report includes all customer types by default.
    // Filtering by specific customer types can be added later if needed.
    return allCustomers
      .map(customer => {
        const customerOrders = allOrders.filter(order => order.customerId === customer.id && order.status === OrderStatus.Delivered);
        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const lastOrder = customerOrders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0];
        
        return {
          ...customer,
          totalOrders,
          totalSpent,
          lastOrderDate: lastOrder?.orderDate,
        };
      })
      .sort((a,b) => b.totalSpent - a.totalSpent); 
  }, [allCustomers, allOrders]);

  const summaryStats = useMemo(() => {
    if (!customersWithData) return { totalCustomers: 0, totalOwedBalance: 0, totalCreditBalance: 0, avgOrdersPerCustomer: 0 };
    
    const totalCustomers = customersWithData.length;
    let totalOwedBalance = 0;
    let totalCreditBalance = 0;
    let totalOrdersSum = 0;

    customersWithData.forEach(c => {
      if (c.balance && c.balance > 0) {
        totalOwedBalance += c.balance;
      } else if (c.balance && c.balance < 0) {
        totalCreditBalance += Math.abs(c.balance);
      }
      totalOrdersSum += c.totalOrders;
    });
    
    const avgOrdersPerCustomer = totalCustomers > 0 ? totalOrdersSum / totalCustomers : 0;

    return { totalCustomers, totalOwedBalance, totalCreditBalance, avgOrdersPerCustomer };
  }, [customersWithData]);

  const columns: TableColumn<CustomerReportData>[] = [
    { key: 'name', header: 'اسم العميل' },
    { key: 'phone', header: 'الهاتف' },
    { 
      key: 'customerType', 
      header: 'نوع العميل',
      render: (item) => CUSTOMER_TYPE_OPTIONS.find(opt => opt.value === item.customerType)?.label || item.customerType
    },
    { key: 'address', header: 'العنوان', render: (item) => item.address || 'N/A', className: 'max-w-xs truncate' },
    { 
      key: 'temporaryExpiryDate', 
      header: 'تاريخ الانتهاء (مؤقت)', 
      render: (item) => item.customerType === CustomerType.Temporary && item.temporaryExpiryDate ? formatDate(item.temporaryExpiryDate, 'short') : '-' 
    },
    { 
      key: 'totalOrders', 
      header: 'إجمالي الطلبات', 
      render: (item) => item.totalOrders,
      className: 'text-center'
    },
    { 
      key: 'totalSpent', 
      header: 'إجمالي المنفق', 
      render: (item) => `${item.totalSpent.toLocaleString()} ر.س` 
    },
    { 
      key: 'balance', 
      header: 'الرصيد الحالي', 
      render: (item) => {
        const balance = item.balance || 0;
        const color = balance > 0 ? 'text-red-500 dark:text-red-400' : balance < 0 ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400';
        return <span className={color}>{balance.toLocaleString()} ر.س</span>;
      }
    },
    { 
      key: 'lastOrderDate', 
      header: 'تاريخ آخر طلب', 
      render: (item) => item.lastOrderDate ? formatDate(item.lastOrderDate, 'short') : 'لا يوجد'
    },
     {
      key: 'actions',
      header: 'تعديل',
      render: (item) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); navigate(`/customers/edit/${item.id}`); }}
          title="تعديل العميل"
        >
          <FileEdit size={16} />
        </Button>
      ),
      className: 'text-center'
    }
  ];

  const handlePrintReport = () => {
    if (!currentUser) {
        alert("خطأ: بيانات المستخدم غير متاحة للطباعة.");
        return;
    }
    if (customersWithData.length === 0) {
      alert("لا يوجد عملاء لطباعة تقريرهم.");
      return;
    }
    const reportHtml = generateDetailedCustomerReportHtmlForPrint(customersWithData, summaryStats, currentUser.companyName, currentUser.phoneNumbers);
    printHtml(reportHtml, `تقرير العملاء المفصل`);
  };
  
  const anyLoading = (isLoadingCustomers && !allCustomers?.length) || (isLoadingOrders && !allOrders?.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">تقرير العملاء المفصل</h2>
        <Button onClick={handlePrintReport} leftIcon={<Printer size={20} />} variant="secondary" disabled={customersWithData.length === 0 || !currentUser}>
          طباعة التقرير
        </Button>
      </div>

      {anyLoading ? (
        <LoadingSpinner text="جاري تحميل بيانات العملاء والطلبات..." />
      ) : (
        <>
          <Card title="ملخص العملاء" titleClassName="flex items-center gap-2">
             <Users size={20} className="text-blue-600 dark:text-blue-400 inline"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center md:text-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center md:justify-start">
                  <Users size={22} className="me-2"/> {summaryStats.totalCustomers}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الأرصدة المستحقة (للشركة)</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center justify-center md:justify-start">
                  <TrendingDown size={22} className="me-2"/> {summaryStats.totalOwedBalance.toLocaleString()} ر.س
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الأرصدة الدائنة (للعملاء)</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center md:justify-start">
                   <TrendingUp size={22} className="me-2"/> {summaryStats.totalCreditBalance.toLocaleString()} ر.س
                </p>
              </div>
               <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">متوسط الطلبات لكل عميل</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center md:justify-start">
                   <ShoppingBag size={22} className="me-2"/> {summaryStats.avgOrdersPerCustomer.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card title="قائمة العملاء وتفاصيلهم">
            <Table
              columns={columns}
              data={customersWithData}
              isLoading={anyLoading && customersWithData.length === 0}
              emptyMessage="لا يوجد عملاء لعرضهم."
              onRowClick={(item) => navigate(`/customers/edit/${item.id}`)}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DetailedCustomerReportPage;