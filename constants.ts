import { OrderStatus, PaymentMethod, SaleType, UserRole, CustomerType } from './types';

export const APP_NAME = "  الوليد";
export const API_BASE_URL = "http://localhost:4000/api";

export const ORDER_STATUS_OPTIONS = [
  { value: OrderStatus.Pending, label: 'قيد الانتظار' },
  { value: OrderStatus.OutForDelivery, label: 'قيد التوصيل' },
  { value: OrderStatus.Delivered, label: 'تم التوصيل' },
  { value: OrderStatus.Cancelled, label: 'ملغي' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.Cash, label: 'نقداً' },
  { value: PaymentMethod.Card, label: 'بطاقة ائتمانية' },
  { value: PaymentMethod.Online, label: 'دفع إلكتروني' },
];

export const SALE_TYPE_OPTIONS = [
  { value: SaleType.Wholesale, label: 'جملة' },
  { value: SaleType.Retail, label: 'تجزئة' },
];

export const ROLE_OPTIONS = [
  { value: UserRole.Admin, label: 'مدير النظام' },
  { value: UserRole.PosAgent, label: 'عامل نقطة بيع' },
];

export const CUSTOMER_TYPE_OPTIONS = [
  { value: CustomerType.Official, label: 'رسمي' },
  { value: CustomerType.Commercial, label: 'تجاري' },
  { value: CustomerType.Household, label: 'منزلي' },
  { value: CustomerType.Governmental, label: 'حكومي' },
  { value: CustomerType.Temporary, label: 'مؤقت' },
];

export const PRODUCT_CATEGORIES = ['مياه', 'ثلج', 'آيس كريم', 'منتجات أخرى'];

// MOCK_..._DATA_KEY constants are removed as data will be fetched from a backend API,
// not from localStorage using these keys.
