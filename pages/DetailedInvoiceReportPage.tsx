import React, { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice, TableColumn, SelectOption } from '../types';
import { getInvoices } from '../services/apiService';
import { printHtml, generateDetailedInvoiceReportHtmlForPrint, formatDate } from '../services/printService'; // Import formatDate
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Printer, Filter, Calendar, DollarSign, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PAYMENT_STATUS_OPTIONS_INVOICE: SelectOption[] = [
  { value: 'all', label: 'الكل' },
  { value: 'paid', label: 'مدفوعة' },
  { value: 'unpaid', label: 'غير مدفوعة' },
];

const DetailedInvoiceReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data: allInvoices, isLoading: isLoadingInvoices, exec: fetchInvoices } = useApi<Invoice[], [], Invoice[]>(getInvoices, []);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo((): Invoice[] => {
    if (!allInvoices) return [];

    return allInvoices
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
        
        return dateMatch && statusMatch;
      })
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [allInvoices, startDate, endDate, selectedPaymentStatus]);

  const summaryStats = useMemo(() => {
    const totalFilteredInvoices = filteredInvoices.length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaidAmount = filteredInvoices.filter(inv => inv.isPaid).reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalUnpaidAmount = totalAmount - totalPaidAmount;
    
    return {
      totalFilteredInvoices,
      totalAmount,
      totalPaidAmount,
      totalUnpaidAmount,
    };
  }, [filteredInvoices]);

  const columns: TableColumn<Invoice>[] = [
    { key: 'invoiceNumber', header: 'رقم الفاتورة', render: (item) => <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/billing?invoiceId=${item.id}`)}>{item.invoiceNumber}</span> },
    { key: 'customerName', header: 'اسم العميل', className: 'max-w-xs truncate' },
    { 
      key: 'issueDate', 
      header: 'تاريخ الإصدار', 
      render: (item) => formatDate(item.issueDate, 'short')
    },
    { 
      key: 'dueDate', 
      header: 'تاريخ الاستحقاق', 
      render: (item) => item.dueDate ? formatDate(item.dueDate, 'short') : 'N/A'
    },
    { 
      key: 'totalAmount', 
      header: 'المبلغ الإجمالي', 
      render: (item) => `${item.totalAmount.toLocaleString()} ر.س` 
    },
    { 
      key: 'isPaid', 
      header: 'حالة الدفع', 
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.isPaid ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-300'}`}>
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
    if (filteredInvoices.length === 0) {
      alert("لا توجد فواتير لطباعتها بالمعايير المحددة.");
      return;
    }
    const filters = { startDate, endDate, paymentStatus: selectedPaymentStatus };
    const reportHtml = generateDetailedInvoiceReportHtmlForPrint(filteredInvoices, filters, summaryStats, currentUser.companyName, currentUser.phoneNumbers);
    printHtml(reportHtml, `تقرير الفواتير (${startDate} - ${endDate})`);
  };
  
  const anyLoading = isLoadingInvoices && !allInvoices;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-foreground">تقرير الفواتير المفصل</h2>
        <Button 
          onClick={handlePrintReport} 
          leftIcon={<Printer size={20} />} 
          variant="secondary" 
          disabled={filteredInvoices.length === 0 || anyLoading || !currentUser}
        >
          طباعة التقرير
        </Button>
      </div>

      <Card title="تصفية التقرير" titleClassName="flex items-center gap-2">
        <Filter size={20} className="text-primary inline"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label="من تاريخ الإصدار"
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            leftIcon={<Calendar size={16} className="text-muted-foreground" />}
          />
          <Input
            label="إلى تاريخ الإصدار"
            type="date"
            name="endDate"
            value={endDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            leftIcon={<Calendar size={16} className="text-muted-foreground" />}
          />
          <Select
            label="حالة الدفع"
            options={PAYMENT_STATUS_OPTIONS_INVOICE}
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            leftIcon={<DollarSign size={16} className="text-muted-foreground"/>}
          />
           <p className="text-xs text-muted-foreground md:col-span-full">
            يتم تحديث التقرير تلقائيًا عند تغيير الفلاتر.
          </p>
        </div>
      </Card>

      {anyLoading && !filteredInvoices.length ? (
        <LoadingSpinner text="جاري تحميل بيانات الفواتير..." />
      ) : (
        <>
          <Card title="ملخص الفواتير" titleClassName="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-primary inline"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center md:text-start">
              <div>
                <p className="text-sm text-muted-foreground">عدد الفواتير (المفلترة)</p>
                <p className="text-2xl font-bold text-primary">{summaryStats.totalFilteredInvoices}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي قيمة الفواتير</p>
                <p className="text-2xl font-bold text-primary">{summaryStats.totalAmount.toLocaleString()} ر.س</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبالغ المدفوعة</p>
                <p className="text-2xl font-bold text-green-500 dark:text-green-400">{summaryStats.totalPaidAmount.toLocaleString()} ر.س</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبالغ المستحقة</p>
                <p className="text-2xl font-bold text-red-500 dark:text-red-400">{summaryStats.totalUnpaidAmount.toLocaleString()} ر.س</p>
              </div>
            </div>
          </Card>
          
          <Card title="تفاصيل الفواتير للفترة المحددة">
            <Table
              columns={columns}
              data={filteredInvoices}
              isLoading={isLoadingInvoices && filteredInvoices.length === 0}
              emptyMessage="لا توجد فواتير تطابق المعايير المحددة."
              onRowClick={(invoice) => navigate(`/billing?invoiceId=${invoice.id}`)} 
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DetailedInvoiceReportPage;