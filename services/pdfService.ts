import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Product, Customer, Driver } from '../types'; 
import { APP_NAME } from '../constants'; // Added APP_NAME import

const ARABIC_FONT_NAME = 'Amiri'; 
const FALLBACK_FONT = 'Helvetica';

const initializeDocAndGetFont = (options?: any): { doc: jsPDF, fontToUse: string } => {
  const doc = new jsPDF(options);
  let fontToUse = FALLBACK_FONT; 

  try {
    const fontList = doc.getFontList();
    if (fontList && fontList[ARABIC_FONT_NAME] !== undefined) {
       fontToUse = ARABIC_FONT_NAME;
    } else {
        console.warn("IMPORTANT: Arabic font '" + ARABIC_FONT_NAME + "' not found embedded in jsPDF for list/receipt generation. Using fallback font '" + FALLBACK_FONT + "'. Arabic text may be garbled. Please embed an Arabic TTF font.");
    }
  } catch (e) {
    console.warn("Error accessing jsPDF font list, using fallback font '" + FALLBACK_FONT + "'. Error: " + String(e) + ". Ensure an Arabic font is embedded.");
  }
  
  doc.setFont(fontToUse);
  return { doc, fontToUse };
};

const processArabicTextForJsPDF = (text: string): string => {
    return text;
};


const generateListPdf = <T extends {id: string | number, name?: string }>(
    companyName: string, // Added
    phoneNumbers: string[], // Added
    listTitle: string, // Renamed from title
    data: T[],
    nameKey: keyof T | ((item: T) => string),
    additionalColumns: Array<{header: string, dataKey: keyof T | ((item: T) => string | number)}> = []
) => {
  const { doc, fontToUse } = initializeDocAndGetFont();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Company Name
  doc.setFontSize(16);
  doc.setFont(fontToUse, 'bold');
  doc.text(processArabicTextForJsPDF(companyName || APP_NAME), pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  // Phone Numbers
  if (phoneNumbers && phoneNumbers.length > 0) {
    doc.setFontSize(9);
    doc.setFont(fontToUse, 'normal');
    doc.text(processArabicTextForJsPDF(`الهواتف: ${phoneNumbers.join(' | ')}`), pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
  }
  
  // List Title (Subtitle)
  doc.setFontSize(14);
  doc.setFont(fontToUse, 'bold');
  doc.text(processArabicTextForJsPDF(listTitle), pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;


  const headRow = [
      processArabicTextForJsPDF("الاسم"),
      ...additionalColumns.map(col => processArabicTextForJsPDF(col.header)),
      processArabicTextForJsPDF("المعرف")
  ];

  const bodyRows = data.map(item => {
      const nameValue = typeof nameKey === 'function' ? nameKey(item) : (item[nameKey] as string || 'N/A');
      const additionalDataCells = additionalColumns.map(col => {
          const val = typeof col.dataKey === 'function' ? col.dataKey(item) : (item[col.dataKey] as string | number | undefined);
          return processArabicTextForJsPDF(String(val !== undefined ? val : 'N/A'));
      });
      return [
          processArabicTextForJsPDF(nameValue),
          ...additionalDataCells,
          item.id.toString() 
      ];
  });

  const columnStylesConfig: { [key: number]: any } = {
      0: { halign: 'right' }, 
  };
  additionalColumns.forEach((_, index) => {
      columnStylesConfig[index + 1] = { halign: 'right' }; 
  });
  columnStylesConfig[additionalColumns.length + 1] = { halign: 'center' }; 

  autoTable(doc, {
    startY: currentY,
    head: [headRow],
    body: bodyRows,
    theme: 'striped',
    headStyles: { font: fontToUse, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { font: fontToUse, fontStyle: 'normal' },
    columnStyles: columnStylesConfig,
    didDrawPage: (dataAfterDraw) => { currentY = dataAfterDraw.cursor?.y || currentY; }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(fontToUse, 'normal');
    doc.text(
      processArabicTextForJsPDF(`صفحة ${i} من ${pageCount} | ${APP_NAME} © ${new Date().getFullYear()}`),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${listTitle.replace(/\s+/g, '_')}.pdf`);
};

export const generateProductsListPdf = (products: Product[], companyName: string, phoneNumbers: string[]): void => {
  generateListPdf(
      companyName,
      phoneNumbers,
      "قائمة المنتجات",
      products,
      'name',
      [
          { header: "الفئة", dataKey: "category" },
          { header: "سعر التجزئة", dataKey: (item: Product) => `${item.price.toLocaleString()} ر.س` },
          { header: "سعر الجملة", dataKey: (item: Product) => item.wholesalePrice ? `${item.wholesalePrice.toLocaleString()} ر.س` : '-' },
          { header: "المخزون", dataKey: "stock" }
      ]
  );
};

export const generateCustomersListPdf = (customers: Customer[], companyName: string, phoneNumbers: string[]): void => {
  generateListPdf(
      companyName,
      phoneNumbers,
      "قائمة عملاء الجملة",
      customers,
      'name',
      [
          { header: "الهاتف", dataKey: "phone" },
          { header: "الرصيد", dataKey: (item: Customer) => `${(item.balance || 0).toLocaleString()} ر.س` },
          { header: "القوارير", dataKey: (item: Customer) => item.ownedBottles || 0 }
      ]
  );
};

export const generateDriversListPdf = (drivers: Driver[], companyName: string, phoneNumbers: string[]): void => {
  generateListPdf(
      companyName,
      phoneNumbers,
      "قائمة السائقين",
      drivers,
      'name',
      [
          { header: "الهاتف", dataKey: "phone" },
          { header: "رقم المركبة", dataKey: (item: Driver) => item.vehicleNumber || "N/A" }
      ]
  );
};

// Note: generatePosReceiptPdf is superseded by HTML print method for POS.
// If it needs to be reactivated, it should also accept companyName and phoneNumbers.
export const generatePosReceiptPdf = (order: Order): void => {
  const { doc, fontToUse } = initializeDocAndGetFont({format: [72, 297]}); 
  const pageWidth = doc.internal.pageSize.getWidth();
  let y: number = 10; 
  const lineSpacing = 5;
  const smallLineSpacing = 3;
  const sectionSpacing = 6;
  const rightMargin = pageWidth - 5; 
  const leftMargin = 5;

  doc.setFontSize(10); 
  doc.setFont(fontToUse, 'bold');
  doc.text(processArabicTextForJsPDF(APP_NAME), pageWidth / 2, y, { align: 'center' }); // Placeholder for Company Name if needed here
  y += lineSpacing;
  doc.setFontSize(8); 
  doc.setFont(fontToUse, 'normal');
  doc.text(processArabicTextForJsPDF("إيصال بيع"), pageWidth / 2, y, { align: 'center' });
  y += sectionSpacing;

  doc.text(processArabicTextForJsPDF(`رقم: ${order.orderNumber}`), rightMargin, y, { align: 'right' });
  y += lineSpacing;
  doc.text(processArabicTextForJsPDF(`التاريخ: ${new Date(order.orderDate).toLocaleDateString('en-CA')}`), rightMargin, y, { align: 'right' });
  y += lineSpacing;
  if (order.customerName && order.customerName.trim() !== '' && order.customerName !== 'عميل نقطة بيع') {
    doc.text(processArabicTextForJsPDF(`عميل: ${order.customerName}`), rightMargin, y, { align: 'right' });
    y += lineSpacing;
  }
  y += smallLineSpacing; 

  const head = [[
    processArabicTextForJsPDF('إجمالي'),
    processArabicTextForJsPDF('سعر'),
    processArabicTextForJsPDF('كمية'),
    processArabicTextForJsPDF('صنف')
  ]];
  const body = order.items.map(item => [
    processArabicTextForJsPDF(item.totalPrice.toLocaleString()),
    processArabicTextForJsPDF(item.unitPrice.toLocaleString()),
    processArabicTextForJsPDF(item.quantity.toString()),
    processArabicTextForJsPDF(item.productName) 
  ]);

  autoTable(doc, {
    startY: y,
    head: head,
    body: body,
    theme: 'plain', 
    styles: { cellPadding: 0.5, fontSize: 7, font: fontToUse }, 
    headStyles: { fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'right', cellWidth: pageWidth * 0.2 }, 
      1: { halign: 'right', cellWidth: pageWidth * 0.2 }, 
      2: { halign: 'center', cellWidth: pageWidth * 0.15 },
      3: { halign: 'right', cellWidth: pageWidth * 0.45 }, 
    },
    tableWidth: 'auto', 
    margin: { left: leftMargin, right: leftMargin }, 
    didDrawPage: (data: any) => { y = data.cursor?.y || 20; } 
  });

  y = (doc as any).lastAutoTable.finalY + sectionSpacing;

  doc.setFontSize(9); 
  doc.setFont(fontToUse, 'bold');
  doc.text(processArabicTextForJsPDF(`الإجمالي: ${order.totalAmount.toLocaleString()} ر.س`), rightMargin, y, { align: 'right' });
  y += lineSpacing;

  doc.setFontSize(8);
  doc.setFont(fontToUse, 'normal');
  doc.text(processArabicTextForJsPDF(`الدفع: ${order.paymentMethod}`), rightMargin, y, { align: 'right' });
  y += sectionSpacing;

  doc.setFontSize(7); 
  doc.text(processArabicTextForJsPDF("شكراً لزيارتكم!"), pageWidth / 2, y, { align: 'center' });

  doc.save(`إيصال-${order.orderNumber}.pdf`);
};