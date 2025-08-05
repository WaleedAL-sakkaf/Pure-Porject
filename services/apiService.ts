import { Product, Customer, Order, Driver, OrderStatus, PaymentMethod, SaleType, DashboardStats, SalesReportDataPoint, Invoice, OrderItem, CustomerType } from '../types';

const API_BASE_URL = 'http://localhost:4000/api'; // The base URL of our backend server

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'An unknown error occurred');
  }
  // if response is ok but has no content
  if (response.status === 204) {
    return;
  }
  return response.json();
};

// Product APIs
export const getProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/products`);
  return handleResponse(response);
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  return handleResponse(response);
};

export const addProduct = async (productData: Omit<Product, 'id'> | FormData): Promise<Product> => {
    const isFormData = productData instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? productData : JSON.stringify(productData),
    });
    return handleResponse(response);
};

export const updateProduct = async (updatedProduct: Product | FormData): Promise<Product> => {
    const isFormData = updatedProduct instanceof FormData;
    const productId = isFormData ? updatedProduct.get('id') as string : updatedProduct.id;
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? updatedProduct : JSON.stringify(updatedProduct),
    });
    return handleResponse(response);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
  return handleResponse(response);
};

// Customer APIs
export const getCustomers = async (): Promise<Customer[]> => {
  const response = await fetch(`${API_BASE_URL}/customers`);
  return handleResponse(response);
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`);
    return handleResponse(response);
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer> => {
    const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
    });
    return handleResponse(response);
};

export const updateCustomer = async (updatedCustomerData: Customer): Promise<Customer> => {
    const response = await fetch(`${API_BASE_URL}/customers/${updatedCustomerData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomerData),
      });
      return handleResponse(response);
};

export const deleteCustomer = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
    return handleResponse(response);
};

// Order APIs
export const getOrders = async (): Promise<Order[]> => {
    const response = await fetch(`${API_BASE_URL}/orders`);
    const orders = await handleResponse(response);
    // The database might return decimal types as strings. Let's ensure they are numbers.
    return orders.map((order: any) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    }));
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`);
    const order = await handleResponse(response);
    if (order) {
      return {
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      };
    }
    return undefined;
};

export const addOrder = async (orderData: Omit<Order, 'id' | 'orderNumber'>): Promise<Order> => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
};

export const updateOrder = async (updatedOrder: Order): Promise<Order> => {
    // Note: The backend only supports updating status for now.
    // This function will need to be adjusted based on what order fields can be updated.
    // For now, let's assume we are updating the status.
    const response = await fetch(`${API_BASE_URL}/orders/${updatedOrder.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: updatedOrder.status }),
    });
    return handleResponse(response);
};

export const deleteOrder = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, { method: 'DELETE' });
    return handleResponse(response);
};

// Driver APIs
export const getDrivers = async (): Promise<Driver[]> => {
    const response = await fetch(`${API_BASE_URL}/drivers`);
    return handleResponse(response);
};

export const getDriverById = async (id: string): Promise<Driver | undefined> => {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`);
    return handleResponse(response);
};

export const addDriver = async (driverData: Omit<Driver, 'id'>): Promise<Driver> => {
    const response = await fetch(`${API_BASE_URL}/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData),
    });
    return handleResponse(response);
};

export const updateDriver = async (updatedDriver: Driver): Promise<Driver> => {
    const response = await fetch(`${API_BASE_URL}/drivers/${updatedDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDriver),
    });
    return handleResponse(response);
};

export const deleteDriver = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`, { method: 'DELETE' });
    return handleResponse(response);
};

// Dashboard Stats API
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
  return handleResponse(response);
};

// Sales Report API
export const getSalesReport = async (): Promise<SalesReportDataPoint[]> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/sales-report`);
  return handleResponse(response);
};

// Invoice APIs (Not yet implemented in backend)
export const getInvoices = async (): Promise<Invoice[]> => {
    const response = await fetch(`${API_BASE_URL}/invoices`);
    const invoices = await handleResponse(response);
    return invoices.map((invoice: any) => ({
      ...invoice,
      totalAmount: Number(invoice.totalAmount),
      isPaid: Boolean(invoice.isPaid),
      items: invoice.items.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    }));
};

export const markInvoiceAsPaid = async (invoiceId: string): Promise<Invoice | undefined> => {
    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/paid`, { method: 'PUT' });
    const invoice = await handleResponse(response);
    if (invoice) {
      return {
        ...invoice,
        totalAmount: Number(invoice.totalAmount),
        isPaid: Boolean(invoice.isPaid),
        items: invoice.items.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      };
    }
    return undefined;
};

export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'issueDate' | 'customerName'>): Promise<Invoice> => {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    return handleResponse(response);
};
