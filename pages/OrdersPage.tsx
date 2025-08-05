/*
=== ملاحظات التخصيص - صفحة إدارة الطلبات ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - للأزرار الرئيسية والروابط
- secondary: رمادي فاتح - للأزرار الثانوية
- danger: أحمر - لأزرار الحذف
- success: أخضر - للحالات الإيجابية
- warning: أصفر - للتحذيرات والحالات المعلقة

الأزرار الرئيسية:
1. "طلب جديد" - Button variant="primary" مع أيقونة PlusCircle
2. "طباعة القائمة" - Button variant="secondary" مع أيقونة Printer
3. أزرار الإجراءات: عرض، تعديل، طباعة، حذف
4. "حفظ/إنشاء طلب" - Button variant="primary" في النموذج
5. "إلغاء" - Button variant="secondary" في النموذج

الأيقونات في النموذج:
- ShoppingCartIcon: أيقونة الطلب الرئيسية
- Package: أيقونة المنتج في قائمة العناصر
- Users: أيقونة العميل
- Truck: أيقونة السائق
- Calendar: أيقونة التواريخ
- ListChecks: أيقونة حالة الطلب
- CreditCard: أيقونة طريقة الدفع
- DollarSign: أيقونة المبلغ الإجمالي
- Edit: أيقونة التعديل
- Eye: أيقونة العرض
- Trash2: أيقونة الحذف

ألوان حالات الطلبات (getStatusStyle):
- Pending: أصفر - للطلبات المعلقة
- InProgress: أزرق - للطلبات قيد التنفيذ
- Delivered: أخضر - للطلبات المُسلّمة
- Cancelled: أحمر - للطلبات المُلغية

أنواع البيع وألوانها:
- Retail: تجزئة - لون عادي
- Wholesale: جملة - قد يكون له لون مميز

طرق الدفع:
- Cash: نقدي
- Credit: آجل
- BankTransfer: تحويل بنكي

نموذج عناصر الطلب (OrderItemForm):
- شبكة من 12 عمود للتخطيط المتجاوب
- حقول: المنتج، الكمية، سعر الوحدة، الإجمالي، حذف
- ألوان مختلفة للأسعار والإجماليات

تخصيص الألوان:
- حالات الطلبات: دالة getStatusStyle()
- أزرار الحالة: StatusBadge component
- ألوان الأيقونات: classes مثل text-muted-foreground
- ألوان النصوص: text-primary، text-foreground

المتغيرات المهمة:
- ORDER_STATUS_OPTIONS: حالات الطلبات في constants.ts
- PAYMENT_METHOD_OPTIONS: طرق الدفع
- SALE_TYPE_OPTIONS: أنواع البيع
- OrderStatus: enum حالات الطلبات
*/

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Order, OrderItem, Product, Customer, Driver, OrderStatus, PaymentMethod, SaleType, TableColumn } from '../types';
import { getOrders, getOrderById, addOrder, updateOrder, deleteOrder, getProducts, getCustomers, getDrivers } from '../services/apiService';
import { printHtml, generateOrderSummaryHtmlForPrint, formatDate } from '../services/printService'; // Import formatDate
import useApi from '../hooks/useApi';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import { PlusCircle, Edit, Trash2, DollarSign, Eye, Printer, ShoppingCart as ShoppingCartIcon, Users, Truck, Calendar, ListChecks, CreditCard, UserCheck, Package } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ORDER_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, SALE_TYPE_OPTIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

type OrdersPageProps = {
  mode?: 'list' | 'new' | 'edit';
};

const OrderItemForm: React.FC<{
  item: Partial<OrderItem>; 
  products: Product[];
  onChange: (updatedItem: Partial<OrderItem>) => void;
  onRemove: () => void;
  index: number;
  currentSaleType: SaleType;
}> = ({ item, products, onChange, onRemove, index, currentSaleType }) => {
  const selectedProductDetails = products.find(p => p.id === item.productId);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProductId = e.target.value;
    const product = products.find(p => p.id === newProductId);
    if (product) {
      const unitPrice = Number(currentSaleType === SaleType.Wholesale && product.wholesalePrice !== undefined ? product.wholesalePrice : product.price);
      onChange({ 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        unitPrice: unitPrice,
        totalPrice: unitPrice * 1, 
        saleType: currentSaleType
      });
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value, 10) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    if (selectedProductDetails && quantity > selectedProductDetails.stock) {
        alert(`الكمية المطلوبة (${quantity}) للمنتج "${selectedProductDetails.name}" تتجاوز المخزون المتاح (${selectedProductDetails.stock}).`);
        onChange({ ...item, quantity: selectedProductDetails.stock, totalPrice: selectedProductDetails.stock * unitPrice });
    } else {
        onChange({ ...item, quantity, totalPrice: quantity * unitPrice });
    }
  };
  
  return (
    <div className="grid grid-cols-12 gap-2 items-end border-b border-border pb-3 mb-3">
      <div className="col-span-12 sm:col-span-5">
        {index === 0 && <label className="text-xs text-muted-foreground">المنتج</label>}
        <Select
          options={products.map(p => ({ value: p.id, label: `${p.name} (متوفر: ${p.stock})` }))}
          value={item.productId || ''}
          onChange={handleProductChange}
          placeholder="اختر منتجًا"
          wrapperClassName="mb-0 mt-1"
          leftIcon={<Package size={16} className="text-muted-foreground"/>}
        />
      </div>
      <div className="col-span-5 sm:col-span-2">
        {index === 0 && <label className="text-xs text-muted-foreground">الكمية</label>}
        <Input type="number" value={item.quantity?.toString() || '1'} onChange={handleQuantityChange} min="1" wrapperClassName="mb-0 mt-1" />
      </div>
      <div className="col-span-7 sm:col-span-2">
        {index === 0 && <label className="text-xs text-muted-foreground">سعر الوحدة</label>}
        <p className={`mt-1 py-2.5 text-sm text-foreground`}>{(item.unitPrice || 0).toFixed(2)} ر.س</p>
      </div>
       <div className="col-span-9 sm:col-span-2">
        {index === 0 && <label className="text-xs text-muted-foreground">الإجمالي</label>}
        <p className={`mt-1 py-2.5 text-sm font-semibold text-primary`}>{(item.totalPrice || 0).toFixed(2)} ر.س</p>
      </div>
      <div className="col-span-3 sm:col-span-1 flex justify-end">
        <Button type="button" variant="danger" size="icon" onClick={onRemove} className="p-2"><Trash2 size={16}/></Button>
      </div>
    </div>
  );
};


const OrderForm: React.FC<{ 
  order?: Order; 
  onSave: (order: Order | Omit<Order, 'id' | 'orderNumber'>) => Promise<void>; 
  onClose: () => void; 
  isLoading: boolean;
  products: Product[];
  customers: Customer[];
  drivers: Driver[];
}> = ({ order, onSave, onClose, isLoading, products, customers, drivers }) => {
  
  const getInitialFormData = useCallback(() => {
    const initialSaleType = order?.saleType || SaleType.Retail;
    const baseOrder: Partial<Order> = {
      saleType: initialSaleType,
      items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, saleType: initialSaleType }],
      totalAmount: 0,
      status: OrderStatus.Pending,
      paymentMethod: PaymentMethod.Cash,
      orderDate: new Date().toISOString(),
    };

    if (order) {
      return {
        ...order,
        orderDate: order.orderDate ? new Date(order.orderDate).toISOString() : new Date().toISOString(),
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString() : undefined,
      };
    }
    return baseOrder;
  }, [order]);

  const [formData, setFormData] = useState<Partial<Order>>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [order, getInitialFormData]);

  const calculateTotalAmount = useCallback((items: Partial<OrderItem>[]) => {
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, totalAmount: calculateTotalAmount(prev.items || []) }));
  }, [formData.items, calculateTotalAmount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setErrors(prev => ({...prev, [name]: ''}));

    if (name === 'saleType') {
        const newSaleType = value as SaleType; 
        const isSwitchingToRetail = newSaleType === SaleType.Retail;

        // Reset customer details when switching sale type
        const customerId = isSwitchingToRetail ? undefined : formData.customerId;
        const customerName = isSwitchingToRetail 
            ? '' // Clear retail name when switching to wholesale
            : customers.find(c => c.id === formData.customerId)?.name;

        const updatedItems = (formData.items || []).map(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const unitPrice = Number(newSaleType === SaleType.Wholesale && product.wholesalePrice !== undefined ? product.wholesalePrice : product.price);
                return { ...item, unitPrice, totalPrice: (item.quantity || 0) * unitPrice, saleType: newSaleType };
            }
            return {...item, saleType: newSaleType}; 
        });

        setFormData(prev => ({ 
            ...prev, 
            saleType: newSaleType, 
            items: updatedItems,
            customerId: customerId,
            customerName: customerName,
        }));

    } else if (name === 'customerId') {
        const customer = customers.find(c => c.id === value);
        setFormData(prev => ({
            ...prev, 
            customerId: value, 
            customerName: customer?.name, 
            deliveryAddress: customer?.address || prev.deliveryAddress 
        }));
    } else if (name === 'status') {
        setFormData(prev => ({ ...prev, status: value as OrderStatus })); 
    } else if (name === 'paymentMethod') {
        setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod })); 
    }
    else {
       setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleItemChange = (index: number, updatedItemPart: Partial<OrderItem>) => {
    const currentItems = formData.items ? [...formData.items] : [];
    if (currentItems[index]) {
        currentItems[index] = { 
            ...currentItems[index], 
            ...updatedItemPart, 
            saleType: formData.saleType || SaleType.Retail 
        } as OrderItem; 
    }
    setFormData(prev => ({ ...prev, items: currentItems }));
  };

  const addItem = () => {
    const currentSaleType = formData.saleType || SaleType.Retail;
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { productId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, saleType: currentSaleType }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.saleType === SaleType.Wholesale && !formData.customerId) newErrors.customerId = "يجب اختيار عميل الجملة";
    if (formData.saleType === SaleType.Retail && !formData.customerName?.trim()) newErrors.customerName = "اسم عميل التجزئة مطلوب";
    if (!formData.items || formData.items.length === 0) newErrors.itemsGlobal = "يجب إضافة منتج واحد على الأقل";
    else {
        formData.items.forEach((item, idx) => {
            if(!item.productId) newErrors[`item_${idx}_product`] = `المنتج ${idx+1} مطلوب`;
            const product = products.find(p => p.id === item.productId);
            if(product && item.quantity && item.quantity > product.stock) {
                 newErrors[`item_${idx}_quantity`] = `كمية المنتج "${product.name}" (${item.quantity}) تتجاوز المخزون (${product.stock})`;
            }
            if(!item.quantity || item.quantity <=0) newErrors[`item_${idx}_quantity`] = `كمية المنتج ${idx+1} يجب ان تكون اكبر من صفر`;
        });
    }
    if (!formData.deliveryAddress?.trim()) newErrors.deliveryAddress = "عنوان التوصيل مطلوب";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const dataToSave = {
        ...(order || {}),
        ...formData,
        totalAmount: formData.totalAmount || 0,
        items: formData.items?.map(item => ({...item, saleType: formData.saleType || SaleType.Retail})) as OrderItem[], 
        orderDate: formData.orderDate ? new Date(formData.orderDate).toISOString() : new Date().toISOString(),
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : undefined,
    } as Omit<Order, 'id' | 'orderNumber'> & Partial<Pick<Order, 'id' | 'orderNumber'>>;
    
    // Remove id and orderNumber for new orders, they are generated by the backend
    if (!order) {
        delete dataToSave.id;
        delete dataToSave.orderNumber;
    }

    await onSave(dataToSave as Order | Omit<Order, 'id' | 'orderNumber'>);
  };

  const toInputDateTimeLocal = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
        const date = new Date(isoDate);
        if (isNaN(date.getTime())) {
            return '';
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="نوع البيع" name="saleType" value={formData.saleType} onChange={handleChange} options={SALE_TYPE_OPTIONS} required leftIcon={<ShoppingCartIcon size={16} className="text-muted-foreground"/>}/>
        {formData.saleType === SaleType.Wholesale ? (
          <Select 
            label="عميل الجملة" 
            name="customerId" 
            value={formData.customerId || ''} 
            onChange={handleChange} 
            options={customers.map(c => ({ value: c.id, label: c.name }))}
            placeholder="اختر عميل"
            error={errors.customerId}
            leftIcon={<Users size={16} className="text-muted-foreground"/>}
          />
        ) : (
          <Input label="اسم عميل التجزئة" name="customerName" value={formData.customerName || ''} onChange={handleChange} error={errors.customerName} leftIcon={<UserCheck size={16} className="text-muted-foreground"/>}/>
        )}
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2 text-foreground">المنتجات المطلوبة</h4>
        {(formData.items || []).map((item, index) => (
          <OrderItemForm 
            key={index} 
            index={index}
            item={item}
            products={products} 
            onChange={(updatedItem) => handleItemChange(index, updatedItem)} 
            onRemove={() => removeItem(index)}
            currentSaleType={formData.saleType || SaleType.Retail}
          />
        ))}
        {errors.itemsGlobal && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.itemsGlobal}</p>}
         {(formData.items || []).map((_, index) => {
            const productError = errors[`item_${index}_product`];
            const quantityError = errors[`item_${index}_quantity`];
            return (
                (productError && <p key={`err_prod_${index}`} className="text-xs text-red-600 dark:text-red-400 mt-1">{productError}</p>) ||
                (quantityError && <p key={`err_qty_${index}`} className="text-xs text-red-600 dark:text-red-400 mt-1">{quantityError}</p>) || null
            );
        })}

        <Button type="button" variant="ghost" onClick={addItem} leftIcon={<PlusCircle size={16}/>} className="mt-2 text-primary dark:text-primary-light">
          إضافة منتج آخر
        </Button>
      </div>

      <div className="text-xl font-bold text-end text-primary">
        المجموع الكلي: {formData.totalAmount?.toLocaleString()} ر.س
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="تاريخ الطلب" type="datetime-local" name="orderDate" value={toInputDateTimeLocal(formData.orderDate)} onChange={handleChange} required leftIcon={<Calendar size={16} className="text-muted-foreground"/>}/>
        <Input label="تاريخ التوصيل (اختياري)" type="datetime-local" name="deliveryDate" value={toInputDateTimeLocal(formData.deliveryDate)} onChange={handleChange} leftIcon={<Calendar size={16} className="text-muted-foreground"/>}/>
      </div>
      <Input label="عنوان التوصيل" name="deliveryAddress" value={formData.deliveryAddress || ''} onChange={handleChange} required error={errors.deliveryAddress} leftIcon={<Truck size={16} className="text-muted-foreground"/>}/>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="حالة الطلب" name="status" value={formData.status} onChange={handleChange} options={ORDER_STATUS_OPTIONS} required leftIcon={<ListChecks size={16} className="text-muted-foreground"/>}/>
        <Select label="طريقة الدفع" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} options={PAYMENT_METHOD_OPTIONS} required leftIcon={<CreditCard size={16} className="text-muted-foreground"/>}/>
      </div>
      <Select 
        label="السائق" 
        name="driverId" 
        value={formData.driverId || ''} 
        onChange={handleChange} 
        options={drivers.map(d => ({ value: d.id, label: d.name }))}
        placeholder="اختر سائقًا"
        leftIcon={<Truck size={16} className="text-muted-foreground"/>}
      />

      <div className="flex justify-end space-s-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>إلغاء</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {order ? 'حفظ التعديلات' : 'إنشاء طلب'}
        </Button>
      </div>
    </form>
  );
};

// Define status colors for light and dark modes
const getStatusStyle = (status: OrderStatus) => {
  switch(status) {
    case OrderStatus.Delivered:
      return {
        light: 'bg-green-100 text-green-700 border-green-200',
        dark: 'dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
      };
    case OrderStatus.Pending:
      return {
        light: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        dark: 'dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
      };
    case OrderStatus.OutForDelivery:
      return {
        light: 'bg-blue-100 text-blue-700 border-blue-200',
        dark: 'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
      };
    case OrderStatus.Cancelled:
      return {
        light: 'bg-red-100 text-red-700 border-red-200',
        dark: 'dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      };
    default:
      return {
        light: 'bg-gray-100 text-gray-700 border-gray-200',
        dark: 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
      };
  }
};

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const statusInfo = ORDER_STATUS_OPTIONS.find(s => s.value === status) || { label: 'غير معروف' };
  const style = getStatusStyle(status);
  
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${style.light} ${style.dark}`}>
      {statusInfo.label}
    </span>
  );
};

const OrdersPage: React.FC<OrdersPageProps> = ({ mode: initialMode }) => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { currentUser } = useAuth(); 

  const [currentMode, setCurrentMode] = useState<'list' | 'new' | 'edit' | 'view'>(initialMode || (orderId ? 'edit' : 'list'));
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(undefined);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  
  const { 
    data: orders, 
    isLoading: isLoadingOrders, 
    error: ordersError, 
    exec: fetchOrders, 
    setData: setOrders
  } = useApi<Order[], [], Order[]>(getOrders, []);
  const { data: products, isLoading: isLoadingProducts, exec: fetchProducts } = useApi<Product[], [], Product[]>(getProducts, []);
  const { data: customers, isLoading: isLoadingCustomers, exec: fetchCustomers } = useApi<Customer[], [], Customer[]>(getCustomers, []);
  const { data: drivers, isLoading: isLoadingDrivers, exec: fetchDrivers } = useApi<Driver[], [], Driver[]>(getDrivers, []);

  const { isLoading: isFetchingDetails, exec: fetchOrderDetails } = useApi<Order | undefined, [string], Order | undefined>(getOrderById);
  const { isLoading: isSaving, exec: saveOrderApi } = useApi<Order, [Order | Omit<Order, 'id' | 'orderNumber'>], Order>(
    (data) => (data as Order).id ? updateOrder(data as Order) : addOrder(data as Omit<Order, 'id' | 'orderNumber'>)
  );
  
  const { isLoading: isStatusUpdating, exec: updateOrderStatusApi } = useApi<Order, [Order], Order>(updateOrder);
  const { isLoading: isDeleting, exec: deleteOrderApi } = useApi<void, [string], void>(deleteOrder);
  
  // Function to get deleted order IDs from localStorage
  const getDeletedOrderIds = (): string[] => {
    const deletedIds = localStorage.getItem('deletedOrderIds');
    return deletedIds ? JSON.parse(deletedIds) : [];
  };

  // Function to add an order ID to the deleted orders list
  const addToDeletedOrders = (orderId: string) => {
    const deletedIds = getDeletedOrderIds();
    if (!deletedIds.includes(orderId)) {
      deletedIds.push(orderId);
      localStorage.setItem('deletedOrderIds', JSON.stringify(deletedIds));
    }
  };

  const refreshOrders = useCallback(() => {
    fetchOrders().then(ordData => {
      if(ordData) {
        // Filter out any orders that are in the deletedOrderIds list
        const deletedIds = getDeletedOrderIds();
        const filteredOrders = ordData.filter(order => !deletedIds.includes(order.id));
        setOrders(filteredOrders);
      }
    });
  }, [fetchOrders, setOrders]);

  useEffect(() => {
    refreshOrders();
    fetchProducts();
    fetchCustomers();
    fetchDrivers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (initialMode) setCurrentMode(initialMode);
    else if (orderId) setCurrentMode('edit');
    else setCurrentMode('list');

    if ((initialMode === 'edit' || orderId) && orderId) {
        fetchOrderDetails(orderId).then(ord => setSelectedOrder(ord));
    } else {
        setSelectedOrder(undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, orderId]);

  const handleAddNew = () => {
    setSelectedOrder(undefined);
    setCurrentMode('new');
    navigate('/orders/new');
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setCurrentMode('edit');
    navigate(`/orders/edit/${order.id}`);
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setCurrentMode('view');
  };
  
  const handlePrintOrder = (orderToPrint: Order) => {
    if (!currentUser || !drivers) {
      alert("خطأ: بيانات المستخدم أو السائقين غير متاحة للطباعة.");
      return;
    }
    const orderHtml = generateOrderSummaryHtmlForPrint(orderToPrint, drivers, currentUser.companyName, currentUser.phoneNumbers);
    printHtml(orderHtml, `ملخص طلب رقم ${orderToPrint.orderNumber}`);
  };

  const handleSaveOrder = async (orderData: Order | Omit<Order, 'id'|'orderNumber'>) => {
    try {
        await saveOrderApi(orderData);
        refreshOrders();
        handleCloseModal();
    } catch (error: any) {
        // If saveOrderApi throws an error (e.g., stock issue from mockApiService)
        // it will be caught by useApi hook and can be displayed, or handled here.
        alert(`فشل حفظ الطلب: ${error.message}`); // Basic alert, could be a toast notification
    }
  };

  const handleCloseModal = () => {
    setCurrentMode('list');
    setSelectedOrder(undefined);
    navigate('/orders');
  };

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    const updatedOrder = { ...order, status: newStatus };
    const result = await updateOrderStatusApi(updatedOrder);
    if(result) {
        refreshOrders(); // Refresh the list to show the updated status and potentially new invoice
        alert(`تم تحديث حالة الطلب #${order.orderNumber} إلى "${newStatus}" بنجاح.`);
    } else {
        alert(`حدث خطأ أثناء تحديث حالة الطلب.`);
    }
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      try {
        await deleteOrderApi(orderToDelete.id);
        
        // Add the order ID to localStorage
        addToDeletedOrders(orderToDelete.id);
        
        // Manually remove the deleted order from the local state
        if (orders) {
          const updatedOrders = orders.filter(order => order.id !== orderToDelete.id);
          setOrders(updatedOrders);
        }
        
        setIsConfirmDeleteOpen(false);
        setOrderToDelete(null);
        alert(`تم حذف الطلب #${orderToDelete.orderNumber} بنجاح.`);
      } catch (error) {
        alert(`فشل حذف الطلب: ${error instanceof Error ? error.message : 'حدث خطأ'}`);
      }
    }
  };

  const cancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setOrderToDelete(null);
  };

  const columns: TableColumn<Order>[] = [
    { key: 'orderNumber', header: 'رقم الطلب', render: (item:Order) => <span className="font-medium text-primary">{item.orderNumber}</span> },
    { key: 'customerName', header: 'اسم العميل', render: (item) => item.customerName || <span className="text-muted-foreground">-</span> },
    { key: 'orderDate', header: 'تاريخ الطلب', render: (item) => formatDate(item.orderDate, 'short') },
    { key: 'totalAmount', header: 'المبلغ الإجمالي', render: (item) => `${item.totalAmount.toLocaleString()} ر.س` },
    {
      key: 'status',
      header: 'الحالة',
      render: (item) => {
        const style = getStatusStyle(item.status);
        return (
          <select 
            value={item.status}
            onChange={(e) => handleStatusChange(item, e.target.value as OrderStatus)}
            onClick={(e) => e.stopPropagation()} // Prevent row click when changing status
            disabled={isStatusUpdating}
            className={`p-1.5 text-xs font-semibold rounded-md border ${style.light} ${style.dark} focus:ring-2 focus:ring-primary focus:border-primary transition-colors ease-in-out cursor-pointer appearance-none pr-8 pl-3`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            {ORDER_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }
    },
    { key: 'paymentMethod', header: 'طريقة الدفع' },
    {
      key: 'actions',
      header: 'إجراءات',
      className: 'text-center',
      render: (item) => (
        <div className="flex justify-center space-s-1 sm:space-s-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleView(item); }} title="عرض التفاصيل"><Eye size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item); }} title="تعديل"><Edit size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handlePrintOrder(item); }} title="طباعة الطلب"><Printer size={16} /></Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); handleDeleteOrder(item); }} 
            title="حذف الطلب"
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const anyDataLoading = isLoadingProducts || isLoadingCustomers || isLoadingDrivers;
  const mainLoading = isLoadingOrders && currentMode === 'list' && !orders?.length;

  if (mainLoading ) {
    return <LoadingSpinner text="جاري تحميل الطلبات..." />;
  }
  
  if (ordersError) {
    return <Card title="خطأ في التحميل" className="border-red-500/50"><p className="text-red-500 dark:text-red-400 p-4 text-center"> {ordersError.message}</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إدارة الطلبات</h1>
        <Button onClick={handleAddNew} leftIcon={<PlusCircle size={18} />}>
          إنشاء طلب جديد
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table columns={columns} data={orders || []} isLoading={isLoadingOrders} onRowClick={handleView} />
      </Card>

      {(currentMode === 'new' || (currentMode === 'edit' && selectedOrder)) && (
        <Modal isOpen={true} onClose={handleCloseModal} title={currentMode === 'new' ? 'إنشاء طلب جديد' : `تعديل الطلب: ${selectedOrder?.orderNumber || ''}`} size="2xl">
          {(isFetchingDetails && currentMode === 'edit') || (anyDataLoading && currentMode ==='new') ? 
            <div className="min-h-[400px] flex items-center justify-center"><LoadingSpinner text="جاري تحميل البيانات..." /></div> :
            <OrderForm 
                order={selectedOrder} 
                onSave={handleSaveOrder} 
                onClose={handleCloseModal}
                isLoading={isSaving}
                products={products || []}
                customers={customers || []}
                drivers={drivers || []}
            />
          }
        </Modal>
      )}

      {currentMode === 'view' && selectedOrder && (
        <Modal isOpen={true} onClose={handleCloseModal} title={`تفاصيل الطلب: ${selectedOrder.orderNumber}`} size="lg">
            <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    <p><strong>رقم الطلب:</strong> <span className="font-semibold text-primary">{selectedOrder.orderNumber}</span></p>
                    <p><strong>العميل:</strong> {selectedOrder.customerName} ({selectedOrder.saleType})</p>
                    {selectedOrder.saleType === SaleType.Wholesale && selectedOrder.customerId && <p><strong>معرف العميل:</strong> {selectedOrder.customerId}</p>}
                    <p><strong>تاريخ الطلب:</strong> {formatDate(selectedOrder.orderDate, 'long')}</p>
                    {selectedOrder.deliveryDate && <p><strong>تاريخ التوصيل:</strong> {formatDate(selectedOrder.deliveryDate, 'long')}</p>}
                    <p className="sm:col-span-2"><strong>العنوان:</strong> {selectedOrder.deliveryAddress}</p>
                    <p><strong>السائق:</strong> {drivers?.find(d=>d.id === selectedOrder.driverId)?.name || <span className="text-muted-foreground">لم يحدد</span>}</p>
                    <p><strong>الحالة:</strong> <span className="font-semibold">{selectedOrder.status}</span></p>
                    <p><strong>طريقة الدفع:</strong> {selectedOrder.paymentMethod}</p>
                </div>
                
                <h4 className="font-semibold pt-2 text-md text-foreground border-t border-border mt-3">المنتجات:</h4>
                <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pe-2">
                    {selectedOrder.items.map(item => (
                        <li key={item.productId} className="flex justify-between p-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                            <span>{item.productName} (x{item.quantity})</span>
                            <span className="font-medium">{item.totalPrice.toLocaleString()} ر.س</span>
                        </li>
                    ))}
                </ul>
                <p className="font-bold text-lg text-primary text-end pt-2 border-t border-border mt-3">المجموع الكلي: {selectedOrder.totalAmount.toLocaleString()} ر.س</p>
            </div>
             <div className="flex justify-end space-s-3 pt-6 mt-4 border-t border-border">
                <Button variant="secondary" onClick={handleCloseModal}>إغلاق</Button>
                <Button variant="primary" onClick={() => handlePrintOrder(selectedOrder)} leftIcon={<Printer size={16}/>}>طباعة</Button>
                <Button variant="primary" onClick={() => handleEdit(selectedOrder)} leftIcon={<Edit size={16}/>}>تعديل</Button>
            </div>
        </Modal>
      )}

      <Modal isOpen={isConfirmDeleteOpen} onClose={cancelDelete} title="تأكيد الحذف" size="sm">
        <div className="space-y-4">
          <p className="text-center">
            هل أنت متأكد من رغبتك في حذف الطلب #{orderToDelete?.orderNumber}؟
          </p>
          <p className="text-sm text-center text-red-500">
            هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className="flex justify-center space-s-3 pt-4">
            <Button type="button" variant="secondary" onClick={cancelDelete}>إلغاء</Button>
            <Button 
              type="button" 
              variant="danger" 
              onClick={confirmDelete} 
              isLoading={isDeleting}
            >
              تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrdersPage;
