export enum OrderStatus {
  Pending = 'قيد الانتظار',
  OutForDelivery = 'قيد التوصيل',
  Delivered = 'تم التوصيل',
  Cancelled = 'ملغي'
}

export enum PaymentMethod {
  Cash = 'نقداً',
  Card = 'بطاقة ائتمانية',
  Online = 'دفع إلكتروني'
}

export enum SaleType {
  Wholesale = 'جملة',
  Retail = 'تجزئة'
}

export enum UserRole {
  Admin = 'admin',
  PosAgent = 'pos_agent'
}

export enum AccountStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

export enum CustomerType {
  Temporary = 'مؤقت',
  Official = 'رسمي', // Or Permanent
  Governmental = 'حكومي',
  Commercial = 'تجاري',
  Household = 'منزلي'
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // In a real app, this would be a proper hash
  role: UserRole;
  companyName: string;
  phoneNumbers: string[];
  accountStatus: AccountStatus;
  createdAt: string; // ISO date string
  approvedBy?: string;
  approvedAt?: string; // ISO date string
}

export interface Product {
  id: string;
  name: string;
  category: string; // e.g., 'ماء', 'ثلج', 'آيس كريم'
  price: number;
  wholesalePrice?: number;
  stock: number;
  description?: string;
  image?: string; // Path to product image
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  customerType: CustomerType;
  temporaryExpiryDate?: string; // ISO date string, relevant if customerType is Temporary
  balance?: number;
  ownedBottles?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleType: SaleType; // Made mandatory
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string; // For wholesale
  customerName?: string; // For quick reference or retail
  driverId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string; // ISO date string
  deliveryDate?: string; // ISO date string
  paymentMethod: PaymentMethod;
  saleType: SaleType;
  deliveryAddress?: string; // Can be different from customer's default
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string; // Made optional for manual invoices
  customerId?: string;
  customerName: string;
  issueDate: string;
  dueDate?: string;
  totalAmount: number;
  isPaid: boolean;
  items: OrderItem[];
  notes?: string; // Added notes field
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalSales: number;
  totalCustomers: number;
}

export interface SalesReportDataPoint {
  date: string;
  sales: number;
}

// Generic TableColumn interface
export interface TableColumn<T> {
  key: keyof T | string; // Allow string for custom render keys
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

// SelectOption interface (Added)
export interface SelectOption {
  value: string | number;
  label: string;
}
