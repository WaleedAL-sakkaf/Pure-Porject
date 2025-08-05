import React, { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice, Order, PaymentMethod, TableColumn, SelectOption } from '../types';
import { getInvoices, getOrders } from '../services/apiService';
import { printHtml, generateDetailedPaymentsReportHtmlForPrint } from '../services/printService';
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Printer, Filter, Calendar, DollarSign, CheckSquare, CreditCard } from 'lucide-react';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext'; // Added

interface InvoiceWithPaymentData extends Invoice {
  paymentMethod?: PaymentMethod;
  paymentDate?: string; 
}

const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'الكل' },
  { value: 'paid', label: 'مدفوعة' },
  { value: 'unpaid', label: 'غير مدفوعة' },
];

const DetailedPaymentsReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Added
  const { data: allInvoices, isLoading: isLoadingInvoices, exec: fetchInvoices } = useApi<Invoice[], [], Invoice[]>(getInvoices, []);
  const { data: allOrders, isLoading: isLoadingOrders, exec: fetchOrders } = useApi<Order[], [], Order[]>(getOrders, []);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  
  useEffect(() => {
    fetchInvoices();
    fetchOrders();
  }, [fetchInvoices, fetchOrders]);

  const paymentMethodOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'جميع الطرق' },
      ...PAYMENT_METHOD_OPTIONS
    ];
  }, []);

  const filteredInvoicesWithPaymentData = useMemo((): InvoiceWithPaymentData[] => {
    if (!allInvoices || !allOrders) return [];

    return allInvoices
      .map(invoice => {
        const order = allOrders.find(o => o.id === invoice.orderId);
        const paymentDate = invoice.isPaid ? (order?.deliveryDate || invoice.issueDate) : undefined; 
        return {
          ...invoice,
          paymentMethod: order?.paymentMethod,
          paymentDate: paymentDate,
        };
      })
      .filter(invoice => {
        const invoiceIssueDate = new Date(invoice.issueDate);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const dateMatch = invoiceIssueDate >= start && invoiceIssueDate <= end;

        const statusMatch = selectedPaymentStatus === 'all' ||
          (selectedPaymentStatus === 'paid' && invoice.isPaid) ||
          (selectedPaymentStatus === 'unpaid' && !invoice.isPaid);
        
        const methodMatch = selectedPaymentMethod === 'all' || invoice.paymentMethod === selectedPaymentMethod;

        return dateMatch && statusMatch && methodMatch;
      })
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [allInvoices, allOrders, startDate, endDate, selectedPaymentStatus, selectedPaymentMethod]);

  const summaryStats = useMemo(() => {
    const totalInvoiceAmount = filteredInvoicesWithPaymentData.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidInvoices = filteredInvoicesWithPaymentData.filter(inv => inv.isPaid);
    const unpaidInvoices = filteredInvoicesWithPaymentData.filter(inv => !inv.isPaid);
    
    const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    return {
      totalInvoiceAmount,
      totalPaidAmount,
      totalUnpaidAmount,
      paidInvoicesCount: paidInvoices.length,
      unpaidInvoicesCount: unpaidInvoices.length,
    };
  }, [filteredInvoicesWithPaymentData]);

  const columns: TableColumn<InvoiceWithPaymentData>[] = [
    { key: 'invoiceNumber', header: 'رقم الفاتورة' },
    { key: 'customerName', header: 'اسم العميل', className: 'max-w-xs truncate' },
    { 
      key: 'issueDate', 
      header: 'تاريخ الإصدار', 
      render: (item) => new Date(item.issueDate).toLocaleDateString('en-CA') 
    },
    { 
      key: 'dueDate', 
      header: 'تاريخ الاستحقاق', 
      render: (item) => item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-CA') : 'N/A'
    },
    {
      key: 'paymentDate',
      header: 'تاريخ الدفع',
      render: (item) => item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('en-CA') : (item.isPaid ? 'مدفوعة (تاريخ غير محدد)' : 'N/A')
    },
    { 
      key: 'totalAmount', 
      header: 'المبلغ', 
      render: (item) => `${item.totalAmount.toLocaleString()} ر.س` 
    },
    { 
      key: 'paymentMethod', 
      header: 'طريقة الدفع', 
      render: (item) => item.paymentMethod || (item.isPaid ? 'غير محدد' : 'N/A')
    },
    { 
      key: 'isPaid', 
      header: 'حالة الدفع', 
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.isPaid ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-700 dark:bg-red-600 dark:text-red-100'}`}>
          {item.isPaid ? 'مدفوعة' : 'غير مدفوعة'}
        </span>
      )
    },
  ];

  const handlePrintReport = () => {
    if (!currentUser) {
        alert("خطأ: بيانات المستخدم غير متاحة للطباعة.");
        return;
    }
    if (filteredInvoicesWithPaymentData.length === 0) {
      alert("لا توجد بيانات لطباعتها بالمعايير المحددة.");
      return;
    }
    const filters = { startDate, endDate, paymentStatus: selectedPaymentStatus, paymentMethod: selectedPaymentMethod };
    const reportHtml = generateDetailedPaymentsReportHtmlForPrint(filteredInvoicesWithPaymentData, filters, summaryStats, currentUser.companyName, currentUser.phoneNumbers); // Updated call
    printHtml(reportHtml, `تقرير المدفوعات (${startDate} - ${endDate})`);
  };
  
  const anyLoading = (isLoadingInvoices && !allInvoices) || (isLoadingOrders && !allOrders);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">تقرير المدفوعات والفواتير</h2>
        <Button 
          onClick={handlePrintReport} 
          leftIcon={<Printer size={20} />} 
          variant="secondary" 
          disabled={filteredInvoicesWithPaymentData.length === 0 || anyLoading || !currentUser}
        >
          طباعة التقرير
        </Button>
      </div>

      <Card title="تصفية التقرير" titleClassName="flex items-center gap-2">
        <Filter size={20} className="text-blue-600 dark:text-blue-400 inline"/>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            label="من تاريخ الإصدار"
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            leftIcon={<Calendar size={16} className="text-gray-400" />}
          />
          <Input
            label="إلى تاريخ الإصدار"
            type="date"
            name="endDate"
            value={endDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            leftIcon={<Calendar size={16} className="text-gray-400" />}
          />
          <Select
            label="حالة الدفع"
            options={PAYMENT_STATUS_OPTIONS}
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            leftIcon={<CheckSquare size={16} className="text-gray-400"/>}
          />
           <Select
            label="طريقة الدفع"
            options={paymentMethodOptions}
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            leftIcon={<CreditCard size={16} className="text-gray-400"/>}
          />
           <p className="text-xs text-gray-500 dark:text-gray-400 md:col-span-full">
            يتم تحديث التقرير تلقائيًا عند تغيير الفلاتر.
          </p>
        </div>
      </Card>

      {anyLoading && !filteredInvoicesWithPaymentData.length ? (
        <LoadingSpinner text="جاري تحميل بيانات الفواتير والطلبات..." />
      ) : (
        <>
          <Card title="ملخص الفواتير والمدفوعات" titleClassName="flex items-center gap-2">
            <DollarSign size={20} className="text-green-600 dark:text-green-400 inline"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center md:text-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي قيمة الفواتير (المفلترة)</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.totalInvoiceAmount.toLocaleString()} ر.س</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المبالغ المدفوعة</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{summaryStats.totalPaidAmount.toLocaleString()} ر.س ({summaryStats.paidInvoicesCount} فاتورة)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المبالغ غير المدفوعة</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{summaryStats.totalUnpaidAmount.toLocaleString()} ر.س ({summaryStats.unpaidInvoicesCount} فاتورة)</p>
              </div>
            </div>
          </Card>
          
          <Card title="تفاصيل الفواتير والمدفوعات للفترة المحددة">
            <Table
              columns={columns}
              data={filteredInvoicesWithPaymentData}
              isLoading={anyLoading && filteredInvoicesWithPaymentData.length === 0}
              emptyMessage="لا توجد فواتير أو مدفوعات تطابق المعايير المحددة."
              onRowClick={(invoice) => navigate(`/billing?invoiceId=${invoice.id}`)} 
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DetailedPaymentsReportPage;