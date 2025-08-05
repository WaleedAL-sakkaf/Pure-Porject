import { Invoice, Order, Driver, OrderItem, OrderStatus, Customer, Product, PaymentMethod, CustomerType } from '../types';
import { APP_NAME, CUSTOMER_TYPE_OPTIONS } from '../constants';

// Retrieve theme colors from CSS variables (if needed for exact match, otherwise use general colors)
// This is a bit advanced for direct use in JS string templates without a more complex setup.
// For now, we'll use a generic "primary color" for print, or pass it if available.
const PRINT_PRIMARY_COLOR = 'var(--color-primary-default, #0ea5e9)'; // Default to sky-600

const getBasePrintStyles = (primaryColor: string = PRINT_PRIMARY_COLOR): string => `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Amiri:wght@400;700&display=swap');
  body {
    font-family: 'Cairo', 'Amiri', sans-serif; /* Prioritize Cairo for UI-like text */
    direction: rtl;
    margin: 0;
    padding: 0;
    line-height: 1.6;
    color: #333333;
    -webkit-print-color-adjust: exact !important; /* Chrome, Safari */
    print-color-adjust: exact !important; /* Firefox */
  }
  @page {
    size: A4;
    margin: 15mm;
  }
  .print-page-container {
    padding: 10mm; 
    border: 1px solid #e0e0e0;
    background-color: #ffffff; /* Ensure white background for printing */
    min-height: calc(297mm - 30mm); /* A4 height - margins */
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    font-size: 9pt;
  }
  th, td {
    border: 1px solid #dddddd;
    padding: 0.5rem;
    text-align: right;
    vertical-align: top;
  }
  th {
    background-color: #f9f9f9 !important; /* Ensure background prints */
    font-weight: 600;
    color: #222222 !important;
  }
  .print-header {
    text-align: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid ${primaryColor} !important;
  }
  .print-header h1 { /* Company Name */
    font-family: 'Amiri', 'Cairo', serif; /* Amiri for more formal title */
    font-size: 22pt;
    color: ${primaryColor} !important;
    margin: 0 0 0.25rem 0;
    font-weight: 700;
  }
  .print-header .phone-numbers {
    font-size: 9pt;
    color: #555555 !important;
    margin: 0 0 0.5rem 0;
  }
  .print-header .report-subtitle {
    font-size: 11pt;
    color: #444444 !important;
    margin: 0;
    font-weight: 500;
  }
  .document-title {
    font-family: 'Amiri', 'Cairo', serif;
    font-size: 16pt;
    font-weight: 600;
    text-align: center;
    margin-bottom: 1.5rem;
    color: #333333 !important;
  }
  .section-title {
    font-family: 'Amiri', 'Cairo', serif;
    font-size: 13pt;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #eeeeee;
    padding-bottom: 0.3rem;
    color: ${primaryColor} !important;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Default to 2 columns */
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 10pt;
  }
  .info-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
  .info-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
  .info-grid p {
    margin: 0.2rem 0;
  }
  .info-grid strong {
    font-weight: 600;
    color: #444444 !important;
  }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .font-bold { font-weight: bold; }
  .totals-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 2px solid #333333;
    font-size: 11pt;
  }
  .totals-section p {
    margin: 0.3rem 0;
    text-align: left;
  }
  .totals-section strong { font-weight: 600; }
  .footer-print {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #eeeeee;
    font-size: 8pt;
    color: #777777 !important;
  }
  .item-description { max-width: 180px; word-wrap: break-word; }
  .address-column { max-width: 130px; word-wrap: break-word; }
  .no-print { display: none !important; }
`;

export const printHtml = (htmlContent: string, documentTitle: string): void => {
  const printWindow = window.open('', '_blank', 'height=800,width=1000');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>${documentTitle}</title>
          <style>
            ${getBasePrintStyles()}
          </style>
        </head>
        <body>
          <div class="print-page-container">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  // Add a small delay before closing to ensure print dialog is processed
                  // Some browsers might need this, others might close too fast.
                   setTimeout(function() { window.close(); }, 300);
                };
              }, 600); // Increased delay slightly
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    // printWindow.focus(); // focus() might be blocked by pop-up blockers in some cases
  } else {
    alert('الرجاء السماح بال نوافذ المنبثقة لطباعة المستند.');
  }
};

export const formatDate = (
  dateInput: string | Date | undefined,
  optionsPreset: 'short' | 'long' | 'datetime' | Intl.DateTimeFormatOptions = 'long', // Default to 'long' for print consistency
  locale: string = 'ar-EG' // Default to ar-EG for Gregorian with Arabic numerals
): string => {
  if (!dateInput) return 'غير محدد';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  let options: Intl.DateTimeFormatOptions = { calendar: 'gregory' }; // Ensure Gregorian calendar

  if (typeof optionsPreset === 'string') {
    switch (optionsPreset) {
      case 'short': // DD/MM/YYYY style
        options = { ...options, day: '2-digit', month: '2-digit', year: 'numeric' };
        break;
      case 'datetime':
        options = { ...options, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
        break;
      case 'long': // Day Month Year (default for this function)
      default:
        options = { ...options, day: 'numeric', month: 'long', year: 'numeric' };
        break;
    }
  } else { // Custom options object
    options = { ...options, ...optionsPreset };
  }
  return date.toLocaleDateString(locale, options);
};


const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('ar-EG')} ر.س`; // Using ar-EG for currency
};

const getCustomerTypeLabel = (type: CustomerType): string => {
  const option = CUSTOMER_TYPE_OPTIONS.find(opt => opt.value === type);
  return option ? option.label : type;
};

const generatePrintHeader = (companyName: string, phoneNumbers: string[], reportSpecificSubtitle: string): string => {
  return `
    <div class="print-header">
      <h1>${companyName || APP_NAME}</h1>
      ${phoneNumbers && phoneNumbers.length > 0 ? `<p class="phone-numbers">الهواتف: ${phoneNumbers.join(' | ')}</p>` : ''}
      <p class="report-subtitle">${reportSpecificSubtitle}</p>
    </div>
  `;
};

export const generatePosReceiptHtmlForPrint = (order: Order, companyName: string, phoneNumbers: string[]): string => {
  const receiptStyles = `
    /* POS Receipt Specific Styles */
    .pos-receipt-container {
      width: 280px; /* Standard thermal receipt width */
      margin: 5mm auto; /* Center it for preview */
      font-family: 'Cairo', 'Amiri', sans-serif;
      font-size: 8pt; /* Smaller base font for receipts */
      color: #000000;
      direction: rtl;
      background-color: #ffffff;
      padding: 5mm;
      box-shadow: 0 0 5px rgba(0,0,0,0.1); /* For preview only */
    }
    .pos-receipt-container h2 { /* Company Name */
      text-align: center;
      margin: 0 0 3px 0;
      font-size: 10pt;
      font-weight: 600;
    }
     .pos-receipt-container .company-phones {
      text-align: center;
      font-size: 7pt;
      margin-bottom: 5px;
    }
    .pos-receipt-container p {
      margin: 2px 0;
    }
    .pos-receipt-container hr {
      border: none;
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .pos-receipt-container table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 6px;
    }
    .pos-receipt-container th, .pos-receipt-container td {
      padding: 1px 2px; /* Tighter padding */
      text-align: right;
      border: none;
    }
    .pos-receipt-container th {
      font-weight: 600;
      border-bottom: 1px solid #555555;
    }
    .pos-receipt-container .item-name { max-width: 110px; word-break: break-all; }
    .pos-receipt-container .item-qty { text-align: center; }
    .pos-receipt-container .item-price, .pos-receipt-container .item-total { text-align: left; }
    .pos-receipt-container .totals {
      margin-top: 8px;
      font-weight: 600;
    }
    .pos-receipt-container .totals p {
        font-size: 9pt;
        margin: 3px 0;
        text-align: left;
    }
    .pos-receipt-container .totals strong { font-weight: 600; }
    .pos-receipt-container .footer-message {
      text-align: center;
      font-size: 7pt;
      margin-top: 10px;
    }
    /* Override A4 page styles for POS receipt */
    @page {
        size: 80mm 297mm; /* Standard thermal roll width, height is variable */
        margin: 3mm;
    }
  `;

  return `
    <style>${receiptStyles} ${getBasePrintStyles()}</style> <!-- Include base styles for font, then override -->
    <div class="pos-receipt-container">
      <h2>${companyName || APP_NAME}</h2>
      ${phoneNumbers && phoneNumbers.length > 0 ? `<p class="company-phones">${phoneNumbers.join(' | ')}</p>` : ''}
      <hr>
      <p>رقم الطلب: ${order.orderNumber}</p>
      <p>التاريخ: ${formatDate(order.orderDate, 'datetime')}</p>
      <p>العميل: ${order.customerName || 'عميل تجزئة'}</p>
      <p>نوع البيع: ${order.saleType}</p>
      <hr>
      <table>
        <thead>
          <tr>
            <th style="text-align: right; font-weight: 600;">الصنف</th>
            <th style="text-align: center; font-weight: 600;">الكمية</th>
            <th style="text-align: left; font-weight: 600;">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: left;">${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <hr>
      <div class="totals">
        <p>الإجمالي: ${formatCurrency(order.totalAmount)}</p>
        <p>طريقة الدفع: ${order.paymentMethod}</p>
      </div>
      <hr>
      <footer>
        <p>شكراً لتعاملكم معنا!</p>
      </footer>
    </div>
  `;
};


export const generateInvoiceHtmlForPrint = (invoice: Invoice, companyName: string, phoneNumbers: string[]): string => {
  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, "فاتورة ضريبية")}
      <div class="document-title">فاتورة ضريبية رقم: ${invoice.invoiceNumber}</div>

      <div class="info-grid">
        <div>
          <p><strong>إلى السيد/السادة:</strong> ${invoice.customerName}</p>
          ${invoice.customerId ? `<p><strong>رقم العميل:</strong> ${invoice.customerId}</p>` : ''}
          <p><strong>رقم الطلب الأصلي:</strong> ${invoice.orderId}</p>
        </div>
        <div class="text-left">
          <p><strong>تاريخ الإصدار:</strong> ${formatDate(invoice.issueDate)}</p>
          ${invoice.dueDate ? `<p><strong>تاريخ الاستحقاق:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
        </div>
      </div>

      <div class="section-title">تفاصيل الفاتورة</div>
      <table>
        <thead>
          <tr>
            <th>البيان (المنتج/الخدمة)</th>
            <th class="text-center">الكمية</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي الفرعي</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td class="item-description">${item.productName}</td>
              <td class="text-center">${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <p><strong>المجموع الفرعي:</strong> ${formatCurrency(invoice.totalAmount)}</p>
        <p style="font-size: 1.1em;"><strong>الإجمالي المستحق:</strong> <span style="font-weight:bold; color:${PRINT_PRIMARY_COLOR};">${formatCurrency(invoice.totalAmount)}</span></p>
      </div>

      <div style="margin-top: 1.5rem;">
        <p><strong>حالة الدفع:</strong> <span class="font-bold" style="color: ${invoice.isPaid ? 'green' : 'red'};">${invoice.isPaid ? 'مدفوعة بالكامل' : 'مستحقة الدفع'}</span></p>
      </div>

      ${!invoice.isPaid && invoice.dueDate ? `
      <div style="margin-top: 1rem; padding: 0.75rem; border: 1px solid #ddd; background-color: #f9f9f9 !important;">
        <p style="font-size:9pt;">الرجاء سداد هذه الفاتورة قبل أو في تاريخ الاستحقاق الموضح أعلاه.</p>
      </div>
      ` : ''}

      <div class="footer-print">
        <p>شكراً لتعاملكم معنا!</p>
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  `;
};

export const generateOrderSummaryHtmlForPrint = (order: Order, drivers: Driver[], companyName: string, phoneNumbers: string[]): string => {
  const driverName = drivers.find(d => d.id === order.driverId)?.name || 'لم يحدد بعد';
  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, "ملخص الطلب")}
      <div class="document-title">ملخص الطلب رقم: ${order.orderNumber}</div>

      <div class="info-grid">
        <div>
          <p><strong>اسم العميل:</strong> ${order.customerName || 'غير محدد'}</p>
          <p><strong>نوع البيع:</strong> ${order.saleType}</p>
          ${order.customerId ? `<p><strong>معرف العميل:</strong> ${order.customerId}</p>`: ''}
          <p><strong>العنوان:</strong> ${order.deliveryAddress || 'غير محدد'}</p>
        </div>
        <div class="text-left">
          <p><strong>تاريخ الطلب:</strong> ${formatDate(order.orderDate)}</p>
          <p><strong>تاريخ التوصيل:</strong> ${formatDate(order.deliveryDate)}</p>
          <p><strong>السائق:</strong> ${driverName}</p>
        </div>
      </div>

      <div class="section-title">تفاصيل المنتجات</div>
      <table>
        <thead>
          <tr>
            <th>المنتج</th>
            <th class="text-center">الكمية</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي الفرعي</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td class="item-description">${item.productName}</td>
              <td class="text-center">${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
         <p><strong>المجموع الكلي:</strong> <span style="font-weight:bold; color:${PRINT_PRIMARY_COLOR};">${formatCurrency(order.totalAmount)}</span></p>
      </div>

      <div style="margin-top: 1.5rem;">
        <p><strong>حالة الطلب:</strong> <span class="font-bold">${order.status}</span></p>
        <p><strong>طريقة الدفع:</strong> <span class="font-bold">${order.paymentMethod}</span></p>
      </div>

      <div class="footer-print">
        <p>هذا ملخص للطلب. للاستفسارات، يرجى التواصل معنا.</p>
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  `;
};

// Generic list generator
const generateGenericListHtmlForPrint = (
  title: string,
  headers: string[],
  rows: string[][],
  companyName: string,
  phoneNumbers: string[]
): string => {
  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, title)}
      <div class="document-title">${title}</div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
          ${rows.length === 0 ? `<tr><td colspan="${headers.length}" class="text-center">لا توجد بيانات لعرضها.</td></tr>` : ''}
        </tbody>
      </table>
      <div class="footer-print">
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  `;
};

export const generateProductsListHtmlForPrint = (products: Product[], companyName: string, phoneNumbers: string[]): string => {
  const headers = ['اسم المنتج', 'الفئة', 'سعر التجزئة', 'سعر الجملة', 'المخزون'];
  const rows = products.map(product => [
    product.name,
    product.category,
    formatCurrency(product.price),
    product.wholesalePrice ? formatCurrency(product.wholesalePrice) : '-',
    product.stock.toString()
  ]);
  return generateGenericListHtmlForPrint("قائمة المنتجات", headers, rows, companyName, phoneNumbers);
};

export const generateCustomersListHtmlForPrint = (customers: Customer[], companyName: string, phoneNumbers: string[]): string => {
  const headers = ['اسم العميل', 'الهاتف', 'نوع العميل', 'العنوان', 'انتهاء العقد', 'الرصيد', 'القوارير'];
  const rows = customers.map(customer => [
    customer.name,
    customer.phone,
    getCustomerTypeLabel(customer.customerType),
    customer.address || 'N/A',
    customer.customerType === CustomerType.Temporary && customer.temporaryExpiryDate ? formatDate(customer.temporaryExpiryDate) : '-',
    formatCurrency(customer.balance || 0),
    (customer.ownedBottles || 0).toString()
  ]);
  return generateGenericListHtmlForPrint("قائمة العملاء", headers, rows, companyName, phoneNumbers);
};

export const generateDriversListHtmlForPrint = (drivers: Driver[], companyName: string, phoneNumbers: string[]): string => {
  const headers = ['اسم السائق', 'الهاتف', 'رقم المركبة'];
  const rows = drivers.map(driver => [
    driver.name,
    driver.phone,
    driver.vehicleNumber || 'N/A'
  ]);
  return generateGenericListHtmlForPrint("قائمة السائقين", headers, rows, companyName, phoneNumbers);
};


export const generateDetailedSalesReportHtmlForPrint = (
  sales: Order[],
  startDate: string,
  endDate: string,
  summary: { totalSales: number; numberOfOrders: number },
  companyName: string,
  phoneNumbers: string[]
): string => {
  const headers = ['رقم الطلب', 'تاريخ البيع', 'اسم العميل', 'المنتجات (الكمية)', 'المبلغ الإجمالي'];
  const rows = sales.map(order => [
    order.orderNumber,
    formatDate(order.deliveryDate || order.orderDate, 'short'),
    order.customerName || 'N/A',
    order.items.map(item => `${item.productName} (x${item.quantity})`).join('<br>'),
    formatCurrency(order.totalAmount)
  ]);
  
  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, "تقرير المبيعات المفصل")}
      <div class="document-title">الفترة من ${formatDate(startDate, 'short')} إلى ${formatDate(endDate, 'short')}</div>

      <div class="info-grid cols-2">
        <div>
          <p><strong>إجمالي المبيعات للفترة:</strong> <span style="font-weight: bold; color: green;">${formatCurrency(summary.totalSales)}</span></p>
        </div>
        <div class="text-left">
           <p><strong>عدد الطلبات (المسلمة):</strong> <span style="font-weight: bold; color: ${PRINT_PRIMARY_COLOR};">${summary.numberOfOrders}</span></p>
        </div>
      </div>

      <div class="section-title">تفاصيل المبيعات</div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          ${rows.length === 0 ? `<tr><td colspan="${headers.length}" class="text-center">لا توجد مبيعات في الفترة المحددة.</td></tr>` : ''}
        </tbody>
      </table>
      <div class="footer-print">
        <p>هذا تقرير مبيعات تم إنشاؤه بواسطة نظام ${APP_NAME}.</p>
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  `;
};

export const generateDetailedDeliveryReportHtmlForPrint = (
  orders: Order[],
  drivers: Driver[],
  filters: { startDate: string; endDate: string; driverId: string; status: string; },
  summary: { totalFilteredOrders: number; outForDeliveryCount: number; deliveredCount: number; },
  companyName: string,
  phoneNumbers: string[]
): string => {
  const getDriverName = (driverId?: string) => drivers.find(d => d.id === driverId)?.name || 'غير محدد';
  let filterDescriptions = `الفترة من: ${formatDate(filters.startDate, 'short')} إلى: ${formatDate(filters.endDate, 'short')}`;
  if (filters.driverId && filters.driverId !== 'all') filterDescriptions += ` | السائق: ${getDriverName(filters.driverId)}`;
  if (filters.status && filters.status !== 'all') filterDescriptions += ` | الحالة: ${filters.status}`;

  const headers = ['رقم الطلب', 'العميل', 'عنوان التوصيل', 'السائق', 'تاريخ الطلب', 'تاريخ التوصيل', 'الحالة', 'المبلغ'];
  const rows = orders.map(order => [
    order.orderNumber,
    order.customerName || 'N/A',
    order.deliveryAddress || 'N/A',
    getDriverName(order.driverId),
    formatDate(order.orderDate, 'short'),
    order.status === OrderStatus.Delivered && order.deliveryDate ? formatDate(order.deliveryDate, 'short') : 'لم يتم التسليم',
    order.status,
    formatCurrency(order.totalAmount)
  ]);

  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, "تقرير التوصيل المفصل")}
      <div class="info-grid cols-2" style="margin-bottom:0.5rem;">
        <div><p><strong>الفلاتر:</strong> ${filterDescriptions}</p></div>
        <div class="text-left"><p><strong>تاريخ التقرير:</strong> ${formatDate(new Date().toISOString(), 'short')}</p></div>
      </div>

      <div class="section-title">ملخص الطلبات</div>
       <div class="info-grid cols-3" style="background-color: #f9f9f9 !important; padding: 1rem; border-radius: 8px; text-align: center;">
        <div><p><strong>إجمالي الطلبات:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: ${PRINT_PRIMARY_COLOR};">${summary.totalFilteredOrders}</p></div>
        <div><p><strong>قيد التوصيل:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: orange;">${summary.outForDeliveryCount}</p></div>
        <div><p><strong>تم التوصيل:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: green;">${summary.deliveredCount}</p></div>
      </div>

      <div class="section-title">تفاصيل الطلبات</div>
       <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td class="${headers[row.indexOf(cell)] === 'عنوان التوصيل' ? 'address-column' : ''}">${cell}</td>`).join('')}</tr>`).join('')}
          ${rows.length === 0 ? `<tr><td colspan="${headers.length}" class="text-center">لا توجد طلبات تطابق الفلاتر.</td></tr>` : ''}
        </tbody>
      </table>
      <div class="footer-print">
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}.</p>
      </div>
    </div>
  `;
};

export const generateDetailedCustomerReportHtmlForPrint = (
  customersWithData: Array<Customer & { totalOrders: number; totalSpent: number; lastOrderDate?: string }>,
  summary: { totalCustomers: number; totalOwedBalance: number; totalCreditBalance: number; avgOrdersPerCustomer: number },
  companyName: string,
  phoneNumbers: string[]
): string => {
  const headers = ['اسم العميل', 'الهاتف', 'النوع', 'العنوان', 'انتهاء العقد', 'إجمالي الطلبات', 'إجمالي المنفق', 'الرصيد', 'آخر طلب'];
  const rows = customersWithData.map(customer => [
    customer.name,
    customer.phone,
    getCustomerTypeLabel(customer.customerType),
    customer.address || 'N/A',
    customer.customerType === CustomerType.Temporary && customer.temporaryExpiryDate ? formatDate(customer.temporaryExpiryDate, 'short') : '-',
    customer.totalOrders.toString(),
    formatCurrency(customer.totalSpent),
    `${formatCurrency(customer.balance || 0)} ${ (customer.balance || 0) > 0 ? '<span style="color: red;">(مدين)</span>' : (customer.balance || 0) < 0 ? '<span style="color: green;">(دائن)</span>' : ''}`,
    customer.lastOrderDate ? formatDate(customer.lastOrderDate, 'short') : 'لا يوجد'
  ]);
  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, "تقرير العملاء المفصل")}
      <div class="info-grid cols-2" style="margin-bottom:0.5rem;"><div class="text-left"><p><strong>تاريخ التقرير:</strong> ${formatDate(new Date().toISOString(), 'short')}</p></div></div>

      <div class="section-title">ملخص العملاء</div>
       <div class="info-grid cols-4" style="background-color: #f9f9f9 !important; padding: 1rem; border-radius: 8px; text-align:center;">
        <div><p><strong>إجمالي العملاء:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: ${PRINT_PRIMARY_COLOR};">${summary.totalCustomers}</p></div>
        <div><p><strong>إجمالي مديونية:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: red;">${formatCurrency(summary.totalOwedBalance)}</p></div>
        <div><p><strong>إجمالي دائنية:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: green;">${formatCurrency(summary.totalCreditBalance)}</p></div>
        <div><p><strong>متوسط الطلبات:</strong></p><p style="font-size: 1.2em; font-weight: bold;">${summary.avgOrdersPerCustomer.toFixed(1)}</p></div>
      </div>

      <div class="section-title">قائمة العملاء</div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td class="${headers[row.indexOf(cell)] === 'العنوان' ? 'address-column' : ''}">${cell}</td>`).join('')}</tr>`).join('')}
          ${rows.length === 0 ? `<tr><td colspan="${headers.length}" class="text-center">لا يوجد عملاء.</td></tr>` : ''}
        </tbody>
      </table>
      <div class="footer-print">
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}.</p>
      </div>
    </div>
  `;
};

interface ProductReportTableItem extends Product {
  quantitySoldInPeriod: number;
  revenueInPeriod: number;
  stockStatusText: string;
}

export const generateDetailedProductReportHtmlForPrint = (
  productsForTable: ProductReportTableItem[],
  filters: { startDate: string; endDate: string; category: string; stockStatus: string },
  summary: { totalUniqueProducts: number; lowStockCount: number; outOfStockCount: number; totalInventoryValue: number },
  bestSellingChartDataSummary: Array<{ name: string; quantity: number }>,
  salesByCategoryChartDataSummary: Array<{ name: string; revenue: number }>,
  companyName: string,
  phoneNumbers: string[]
): string => {
  let filterDescriptions = `الفترة: ${formatDate(filters.startDate, 'short')} - ${formatDate(filters.endDate, 'short')}`;
  if (filters.category && filters.category !== 'all') filterDescriptions += ` | الفئة: ${filters.category}`;
  if (filters.stockStatus && filters.stockStatus !== 'all') {
    const statusLabels: Record<string, string> = { available: 'متوفر', low: 'قليل', out_of_stock: 'نفذ' };
    filterDescriptions += ` | حالة المخزون: ${statusLabels[filters.stockStatus] || filters.stockStatus}`;
  }

  const headers = ['اسم المنتج', 'الفئة', 'المخزون الحالي', 'الكمية المباعة (فترة)', 'الإيرادات (فترة)', 'حالة المخزون'];
  const rows = productsForTable.map(p => [
    p.name, p.category, p.stock.toString(), p.quantitySoldInPeriod.toString(), formatCurrency(p.revenueInPeriod), p.stockStatusText
  ]);

  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, "تقرير المنتجات المفصل")}
      <div class="info-grid cols-2" style="margin-bottom:0.5rem;">
        <div><p><strong>الفلاتر:</strong> ${filterDescriptions}</p></div>
        <div class="text-left"><p><strong>تاريخ التقرير:</strong> ${formatDate(new Date().toISOString(), 'short')}</p></div>
      </div>

      <div class="section-title">ملخص المنتجات العام</div>
      <div class="info-grid cols-4" style="background-color: #f9f9f9 !important; padding: 1rem; border-radius: 8px; text-align:center;">
        <div><p><strong>إجمالي المنتجات:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: ${PRINT_PRIMARY_COLOR};">${summary.totalUniqueProducts}</p></div>
        <div><p><strong>مخزون منخفض:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: orange;">${summary.lowStockCount}</p></div>
        <div><p><strong>نفذ المخزون:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: red;">${summary.outOfStockCount}</p></div>
        <div><p><strong>قيمة المخزون:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: green;">${formatCurrency(summary.totalInventoryValue)}</p></div>
      </div>
      
      <div class="info-grid cols-2" style="margin-top:1rem;">
        <div>
          <h4 style="font-size: 11pt; font-weight: bold; margin-bottom: 5px;">أعلى 5 منتجات مبيعًا (كمية):</h4>
          ${bestSellingChartDataSummary.length > 0 ? `<ul style="font-size: 9pt;">${bestSellingChartDataSummary.map(p => `<li>${p.name}: ${p.quantity} وحدة</li>`).join('')}</ul>` : '<p style="font-size: 9pt;">لا توجد بيانات.</p>'}
        </div>
        <div>
          <h4 style="font-size: 11pt; font-weight: bold; margin-bottom: 5px;">إيرادات المبيعات حسب الفئة:</h4>
          ${salesByCategoryChartDataSummary.length > 0 ? `<ul style="font-size: 9pt;">${salesByCategoryChartDataSummary.map(c => `<li>${c.name}: ${formatCurrency(c.revenue)}</li>`).join('')}</ul>` : '<p style="font-size: 9pt;">لا توجد بيانات.</p>'}
        </div>
      </div>

      <div class="section-title">تفاصيل المنتجات</div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td class="${headers[row.indexOf(cell)] === 'اسم المنتج' ? 'item-description' : ''}">${cell}</td>`).join('')}</tr>`).join('')}
          ${rows.length === 0 ? `<tr><td colspan="${headers.length}" class="text-center">لا توجد منتجات.</td></tr>` : ''}
        </tbody>
      </table>
      <div class="footer-print">
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}.</p>
      </div>
    </div>
  `;
};

export const generateDetailedPaymentsReportHtmlForPrint = (
  invoicesWithPaymentData: Array<Invoice & { paymentMethod?: PaymentMethod; paymentDate?: string }>,
  filters: { startDate: string; endDate: string; paymentStatus: string; paymentMethod: string },
  summary: { totalInvoiceAmount: number; totalPaidAmount: number; totalUnpaidAmount: number; paidInvoicesCount: number; unpaidInvoicesCount: number; },
  companyName: string,
  phoneNumbers: string[]
): string => {
  let filterDescriptions = `الفترة: ${formatDate(filters.startDate, 'short')} - ${formatDate(filters.endDate, 'short')}`;
  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    const statusLabels: Record<string, string> = { paid: 'مدفوعة', unpaid: 'غير مدفوعة' };
    filterDescriptions += ` | حالة الدفع: ${statusLabels[filters.paymentStatus] || filters.paymentStatus}`;
  }
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    filterDescriptions += ` | طريقة الدفع: ${filters.paymentMethod}`;
  }

  const headers = ['رقم الفاتورة', 'العميل', 'تاريخ الإصدار', 'الاستحقاق', 'تاريخ الدفع', 'المبلغ', 'طريقة الدفع', 'الحالة'];
  const rows = invoicesWithPaymentData.map(invoice => [
    invoice.invoiceNumber,
    invoice.customerName,
    formatDate(invoice.issueDate, 'short'),
    invoice.dueDate ? formatDate(invoice.dueDate, 'short') : 'N/A',
    invoice.paymentDate ? formatDate(invoice.paymentDate, 'short') : (invoice.isPaid ? 'مدفوعة' : 'N/A'),
    formatCurrency(invoice.totalAmount),
    invoice.paymentMethod || (invoice.isPaid ? '-' : 'N/A'),
    invoice.isPaid ? 'مدفوعة' : 'غير مدفوعة'
  ]);
  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, "تقرير المدفوعات والفواتير")}
      <div class="info-grid cols-2" style="margin-bottom:0.5rem;">
        <div><p><strong>الفلاتر:</strong> ${filterDescriptions}</p></div>
        <div class="text-left"><p><strong>تاريخ التقرير:</strong> ${formatDate(new Date().toISOString(), 'short')}</p></div>
      </div>

      <div class="section-title">ملخص الفواتير والمدفوعات</div>
       <div class="info-grid cols-3" style="background-color: #f9f9f9 !important; padding: 1rem; border-radius: 8px; text-align:center;">
        <div><p><strong>إجمالي الفواتير:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: ${PRINT_PRIMARY_COLOR};">${formatCurrency(summary.totalInvoiceAmount)}</p></div>
        <div><p><strong>إجمالي المدفوع (${summary.paidInvoicesCount}):</strong></p><p style="font-size: 1.2em; font-weight: bold; color: green;">${formatCurrency(summary.totalPaidAmount)}</p></div>
        <div><p><strong>إجمالي غير المدفوع (${summary.unpaidInvoicesCount}):</strong></p><p style="font-size: 1.2em; font-weight: bold; color: red;">${formatCurrency(summary.totalUnpaidAmount)}</p></div>
      </div>

      <div class="section-title">تفاصيل الفواتير والمدفوعات</div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td class="${headers[row.indexOf(cell)] === 'العميل' ? 'item-description' : ''}">${cell}</td>`).join('')}</tr>`).join('')}
          ${rows.length === 0 ? `<tr><td colspan="${headers.length}" class="text-center">لا توجد بيانات.</td></tr>` : ''}
        </tbody>
      </table>
      <div class="footer-print">
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}.</p>
      </div>
    </div>
  `;
};

export const generateDetailedInvoiceReportHtmlForPrint = (
  invoices: Invoice[],
  filters: { startDate: string; endDate: string; paymentStatus: string; },
  summary: { totalFilteredInvoices: number; totalAmount: number; totalPaidAmount: number; totalUnpaidAmount: number; },
  companyName: string,
  phoneNumbers: string[]
): string => {
  let filterDescriptions = `فترة الإصدار: ${formatDate(filters.startDate, 'short')} - ${formatDate(filters.endDate, 'short')}`;
  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    const statusLabels: Record<string, string> = { paid: 'مدفوعة', unpaid: 'غير مدفوعة', all: 'الكل' };
    filterDescriptions += ` | حالة الدفع: ${statusLabels[filters.paymentStatus] || filters.paymentStatus}`;
  }

  const headers = ['رقم الفاتورة', 'العميل', 'تاريخ الإصدار', 'تاريخ الاستحقاق', 'المبلغ الإجمالي', 'حالة الدفع'];
  const rows = invoices.map(invoice => [
    invoice.invoiceNumber,
    invoice.customerName,
    formatDate(invoice.issueDate, 'short'),
    invoice.dueDate ? formatDate(invoice.dueDate, 'short') : 'N/A',
    formatCurrency(invoice.totalAmount),
    invoice.isPaid ? 'مدفوعة' : 'غير مدفوعة'
  ]);

  return `
    <div class="print-page-container">
      ${generatePrintHeader(companyName, phoneNumbers, "تقرير الفواتير المفصل")}
      <div class="info-grid cols-2" style="margin-bottom:0.5rem;">
        <div><p><strong>الفلاتر:</strong> ${filterDescriptions}</p></div>
        <div class="text-left"><p><strong>تاريخ التقرير:</strong> ${formatDate(new Date().toISOString(), 'short')}</p></div>
      </div>

      <div class="section-title">ملخص الفواتير</div>
      <div class="info-grid cols-4" style="background-color: #f9f9f9 !important; padding: 1rem; border-radius: 8px; text-align:center;">
        <div><p><strong>عدد الفواتير:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: ${PRINT_PRIMARY_COLOR};">${summary.totalFilteredInvoices}</p></div>
        <div><p><strong>إجمالي قيمة الفواتير:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: ${PRINT_PRIMARY_COLOR};">${formatCurrency(summary.totalAmount)}</p></div>
        <div><p><strong>إجمالي المدفوع:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: green;">${formatCurrency(summary.totalPaidAmount)}</p></div>
        <div><p><strong>إجمالي المستحق:</strong></p><p style="font-size: 1.2em; font-weight: bold; color: red;">${formatCurrency(summary.totalUnpaidAmount)}</p></div>
      </div>

      <div class="section-title">تفاصيل الفواتير</div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          ${rows.length === 0 ? `<tr><td colspan="${headers.length}" class="text-center">لا توجد فواتير تطابق الفلاتر المحددة.</td></tr>` : ''}
        </tbody>
      </table>
      <div class="footer-print">
        <p>&copy; ${new Date().getFullYear()} ${companyName || APP_NAME}.</p>
      </div>
    </div>
  `;
};