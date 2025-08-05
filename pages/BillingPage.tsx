/*
=== ملاحظات التخصيص - صفحة الفواتير والمدفوعات ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - لأرقام الفواتير والنصوص المميزة
- green: أخضر - للحالات المدفوعة وأزرار التسجيل كمدفوعة
- red: أحمر - للحالات غير المدفوعة والتحذيرات
- muted-foreground: رمادي للنصوص الثانوية

الأزرار والإجراءات:
1. "عرض الفاتورة" - Button variant="ghost" size="icon" مع أيقونة Eye
2. "طباعة" - Button variant="ghost" size="icon" مع أيقونة Printer
3. "تسجيل كمدفوعة" - Button مع ألوان خضراء مع أيقونة DollarSign
4. "إغلاق" - Button variant="secondary" في النافذة المنبثقة
5. "طباعة" - Button variant="primary" في النافذة المنبثقة

الأيقونات ومعانيها:
- FileText: أيقونة الفاتورة العامة
- Eye: أيقونة عرض التفاصيل
- Printer: أيقونة الطباعة
- DollarSign: أيقونة تسجيل الدفعة (أخضر)
- CheckCircle: أيقونة تأكيد الدفع (أخضر)

ألوان حالات الدفع:
- مدفوعة: 
  * bg-green-100 text-green-700 (وضع فاتح)
  * dark:bg-green-700/30 dark:text-green-300 (وضع داكن)
- غير مدفوعة:
  * bg-red-100 text-red-700 (وضع فاتح)
  * dark:bg-red-600/30 dark:text-red-300 (وضع داكن)

ألوان أزرار التسجيل كمدفوعة:
- text-green-600 hover:text-green-700 (وضع فاتح)
- dark:text-green-400 dark:hover:text-green-500 (وضع داكن)
- hover:bg-green-500/10 (خلفية خضراء شفافة عند التمرير)

تفاصيل النافذة المنبثقة:
- حدود رمادية: border-border
- خلفية بطاقة: bg-card
- جدول العناصر مع خلفية: bg-slate-50 dark:bg-slate-700/50
- فواصل: divide-y divide-border

تخصيص الألوان:
- حالات الدفع: في عمود isPaid في columns
- ألوان الأزرار: className للأزرار المختلفة
- ألوان النصوص: text-primary، text-foreground، text-muted-foreground

المتغيرات المهمة:
- Invoice: نوع بيانات الفاتورة
- columns: تخصيص أعمدة جدول الفواتير
- selectedInvoice: الفاتورة المحددة للعرض
*/

import React, { useEffect, useState, useCallback } from 'react';
import { Invoice, Order, TableColumn } from '../types';
import { getInvoices, markInvoiceAsPaid } from '../services/apiService';
import { printHtml, generateInvoiceHtmlForPrint, formatDate } from '../services/printService'; // Import formatDate
import useApi from '../hooks/useApi';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import { FileText, Printer, DollarSign, Eye, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const BillingPage: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { currentUser } = useAuth(); 
  
  const { 
    data: invoices, 
    isLoading, 
    error, 
    exec: fetchInvoices, 
    setData: setInvoices 
  } = useApi<Invoice[], [], Invoice[]>(getInvoices, []);

  const { isLoading: isMarkingPaid, exec: markPaidApi } = useApi<Invoice | undefined, [string], Invoice| undefined>(markInvoiceAsPaid);

  const refreshInvoices = useCallback(() => {
    fetchInvoices().then(invData => {
        if(invData) setInvoices(invData);
    });
  }, [fetchInvoices, setInvoices]);

  useEffect(() => {
    refreshInvoices();
  }, [refreshInvoices]);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    if (!currentUser) {
      alert("خطأ: بيانات المستخدم غير متاحة للطباعة.");
      return;
    }
    const invoiceHtml = generateInvoiceHtmlForPrint(invoice, currentUser.companyName, currentUser.phoneNumbers); 
    printHtml(invoiceHtml, `فاتورة رقم ${invoice.invoiceNumber}`);
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    const updatedInvoice = await markPaidApi(invoiceId);
    if (updatedInvoice) {
        alert(`الفاتورة ${updatedInvoice.invoiceNumber} تم تحديث حالة الدفع بنجاح!`);
        refreshInvoices(); 
        if(selectedInvoice && selectedInvoice.id === invoiceId) {
            setSelectedInvoice(updatedInvoice); 
        }
    } else {
        alert("حدث خطأ أثناء تحديث حالة الدفع.");
    }
  };

  const handleCloseModal = () => {
    setSelectedInvoice(null);
  };

  const columns: TableColumn<Invoice>[] = [
    { key: 'invoiceNumber', header: 'رقم الفاتورة', render: (item:Invoice) => <span className="font-medium text-primary">{item.invoiceNumber}</span>},
    { key: 'customerName', header: 'اسم العميل', render: (item) => item.customerName || <span className="text-muted-foreground">-</span> },
    { key: 'issueDate', header: 'تاريخ الإصدار', render: (item) => formatDate(item.issueDate, 'short') },
    { key: 'dueDate', header: 'تاريخ الاستحقاق', render: (item) => item.dueDate ? formatDate(item.dueDate, 'short') : 'N/A' },
    { key: 'totalAmount', header: 'المبلغ الإجمالي', render: (item) => `${item.totalAmount.toLocaleString()} ر.س` },
    { 
      key: 'isPaid', 
      header: 'حالة الدفع', 
      render: (item) => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${item.isPaid ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-300'}`}>
          {item.isPaid ? 'مدفوعة' : 'غير مدفوعة'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'إجراءات',
      className: "text-center",
      render: (item) => (
        <div className="flex justify-center space-s-1 sm:space-s-2">
          <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(item)} title="عرض الفاتورة"><Eye size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={() => handlePrintInvoice(item)} title="طباعة"><Printer size={16} /></Button>
          {!item.isPaid && <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-500 hover:bg-green-500/10" onClick={() => handleMarkAsPaid(item.id)} title="تسجيل دفعة" isLoading={isMarkingPaid && selectedInvoice?.id === item.id}><DollarSign size={16} /></Button>}
        </div>
      ),
    },
  ];
  
  if (isLoading && !invoices?.length) {
    return <LoadingSpinner text="جاري تحميل الفواتير..." />;
  }
  
  if (error) {
     return <Card title="خطأ في التحميل" className="border-red-500/50"><p className="text-red-500 dark:text-red-400 p-4 text-center"> {error.message}</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">الفواتير والمدفوعات</h1>
      </div>

      <Card className="overflow-hidden">
        <Table columns={columns} data={invoices || []} isLoading={isLoading} onRowClick={handleViewInvoice}/>
      </Card>

      {selectedInvoice && (
        <Modal isOpen={true} onClose={handleCloseModal} title={`تفاصيل الفاتورة: ${selectedInvoice.invoiceNumber}`} size="xl">
          <div className="space-y-4 p-1 sm:p-2 text-sm">
            <div className="p-4 border border-border rounded-lg bg-card text-foreground">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                    <div>
                        <h3 className="text-xl font-semibold text-primary">{selectedInvoice.customerName}</h3>
                        <p className="text-xs text-muted-foreground">رقم الطلب: {selectedInvoice.orderId}</p>
                    </div>
                    <div className="text-start sm:text-end mt-2 sm:mt-0">
                        <p className="text-lg font-bold text-foreground">فاتورة ضريبية</p>
                        <p className="text-xs text-muted-foreground">رقم الفاتورة: {selectedInvoice.invoiceNumber}</p>
                    </div>
                </div>
                <hr className="my-3 border-border"/>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                        <p><strong>تاريخ الإصدار:</strong> {formatDate(selectedInvoice.issueDate, 'long')}</p>
                        <p><strong>تاريخ الاستحقاق:</strong> {selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate, 'long') : <span className="text-muted-foreground">N/A</span>}</p>
                    </div>
                    <div className="text-start sm:text-end">
                        <p className={`font-semibold text-base ${selectedInvoice.isPaid ? 'text-green-500' : 'text-red-500'}`}>
                            {selectedInvoice.isPaid ? 'مدفوعة بالكامل' : 'مستحقة الدفع'}
                        </p>
                    </div>
                </div>
            </div>
            
            <h4 className="font-semibold pt-3 text-md text-foreground border-t border-border mt-4">تفاصيل المنتجات:</h4>
            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="min-w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="p-2 text-start font-medium text-muted-foreground">المنتج</th>
                            <th className="p-2 text-center font-medium text-muted-foreground">الكمية</th>
                            <th className="p-2 text-end font-medium text-muted-foreground">سعر الوحدة</th>
                            <th className="p-2 text-end font-medium text-muted-foreground">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {selectedInvoice.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="p-2">{item.productName}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-end">{item.unitPrice.toLocaleString()} ر.س</td>
                                <td className="p-2 text-end font-medium">{item.totalPrice.toLocaleString()} ر.س</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="text-end mt-4 pt-3 border-t border-border">
                <p className="text-lg font-bold text-primary">الإجمالي المطلوب: {selectedInvoice.totalAmount.toLocaleString()} ر.س</p>
            </div>
          </div>
           <div className="flex justify-end space-s-3 pt-6 mt-4 border-t border-border">
                <Button variant="secondary" onClick={handleCloseModal}>إغلاق</Button>
                <Button variant="primary" onClick={() => handlePrintInvoice(selectedInvoice)} leftIcon={<Printer size={16}/>}>طباعة</Button>
                {!selectedInvoice.isPaid && 
                  <Button 
                    variant="success" 
                    onClick={() => handleMarkAsPaid(selectedInvoice.id)} 
                    leftIcon={<CheckCircle size={16}/>}
                    isLoading={isMarkingPaid}
                  >
                    تسجيل كمدفوعة
                  </Button>
                }
            </div>
        </Modal>
      )}
    </div>
  );
};

export default BillingPage;