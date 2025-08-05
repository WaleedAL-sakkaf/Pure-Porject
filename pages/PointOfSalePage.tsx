/*
=== ملاحظات التخصيص - صفحة نقطة البيع (POS) ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - للأزرار الرئيسية والعناصر المميزة
- secondary: رمادي فاتح - للعناصر الغير متوفرة
- green: أخضر - لأزرار التأكيد والنجاح
- red: أحمر - لأزرار الحذف والإلغاء
- yellow: أصفر - للتحذيرات

تخطيط الصفحة:
- قسم المنتجات (اليسار): lg:w-3/5 xl:w-2/3
- قسم السلة (اليمين): lg:w-2/5 xl:w-1/3
- شبكة المنتجات: grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5

الأزرار الرئيسية:
1. بطاقات المنتجات - أزرار قابلة للنقر لإضافة للسلة
2. "+" و "-" - أزرار تعديل الكمية في السلة
3. "إزالة" - زر أحمر لحذف المنتج من السلة
4. "مسح السلة" - زر ثانوي لتفريغ السلة
5. "معالجة البيع" - زر أساسي لتنفيذ البيع
6. "تأكيد الدفع" - زر أخضر في نافذة الدفع

الأيقونات ومعانيها:
- Search: أيقونة البحث عن المنتجات
- Package: أيقونة المنتج العامة
- PlusCircle: زيادة الكمية في السلة
- MinusCircle: تقليل الكمية في السلة
- XCircle: إزالة المنتج من السلة
- ShoppingCart: أيقونة السلة الرئيسية
- CreditCard: أيقونة طريقة الدفع
- Printer: أيقونة طباعة الإيصال
- AlertTriangle: تحذيرات المخزون
- CheckCircle: تأكيد العملية

ألوان حالات المنتجات:
- منتج متوفر:
  * bg-card hover:border-primary hover:shadow-md
  * group-hover:scale-105 للصور
- منتج غير متوفر:
  * bg-secondary-light dark:bg-secondary-dark
  * cursor-not-allowed opacity-60

ألوان السلة:
- العناصر العادية: bg-card مع حدود
- المجموع الإجمالي: text-2xl font-bold text-primary
- أزرار الكمية: أخضر للزيادة، أحمر للنقصان

نافذة الدفع:
- خلفية: bg-card
- خيارات الدفع: أزرار متبدلة مع ألوان مختلفة
- زر التأكيد: أخضر مع أيقونة CheckCircle

رسائل الحالة:
- النجاح: خلفية خضراء مع أيقونة CheckCircle
- الخطأ: خلفية حمراء مع أيقونة AlertTriangle

تخصيص الألوان:
- بطاقات المنتجات: hover:border-primary و focus:ring-primary
- أزرار الكمية: bg-green-500 و bg-red-500
- حالات التوفر: opacity-60 للغير متوفر

المتغيرات المهمة:
- cart: عناصر السلة
- filteredProducts: المنتجات المفلترة للعرض
- PaymentMethod: طرق الدفع المختلفة
*/

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, OrderItem, Order, SaleType, PaymentMethod, OrderStatus } from '../types';
import { getProducts, addOrder } from '../services/apiService';
import { printHtml, generatePosReceiptHtmlForPrint } from '../services/printService';
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Search, XCircle, PlusCircle, MinusCircle, ShoppingCart, CreditCard, Printer, AlertTriangle, CheckCircle, Package, Receipt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PointOfSalePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [customerName, setCustomerName] = useState('عميل نقطة بيع');

  const { currentUser } = useAuth();
  const { data: products, isLoading: isLoadingProducts, exec: fetchProducts } = useApi<Product[], [], Product[]>(getProducts, []);
  const { isLoading: isProcessingSale, exec: processSaleApi } = useApi<Order, [Omit<Order, 'id' | 'orderNumber'>], Order>(addOrder);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm.trim()) return products.slice(0, 24); // Show more items initially
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 24);
  }, [products, searchTerm]);

  const calculateTotal = useCallback(() => {
    return Number(cart.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2));
  }, [cart]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return; // Prevent adding out-of-stock items

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) { // Check stock before increasing quantity
            return prevCart.map(item =>
            item.productId === product.id
                ? { ...item, quantity: item.quantity + 1, totalPrice: Number(((item.quantity + 1) * item.unitPrice).toFixed(2)) }
                : item
            );
        }
        return prevCart; // Quantity cannot exceed stock
      } else {
        return [...prevCart, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: Number(Number(product.price).toFixed(2)), // POS always uses retail price, format to 2 decimals
          totalPrice: Number(Number(product.price).toFixed(2)),
          saleType: SaleType.Retail,
        }];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const productInCatalog = products?.find(p => p.id === productId);
    if (!productInCatalog) return;

    // Ensure newQuantity does not exceed stock and is not less than 0
    const validatedQuantity = Math.max(0, Math.min(newQuantity, productInCatalog.stock));
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? { ...item, quantity: validatedQuantity, totalPrice: Number((validatedQuantity * item.unitPrice).toFixed(2)) }
          : item
      ).filter(item => item.quantity > 0) // Remove if quantity becomes 0
    );
  };


  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSearchTerm('');
    setCustomerName('عميل نقطة بيع');
  };

  const handleProcessSale = () => {
    if (cart.length === 0) {
      alert("السلة فارغة. الرجاء إضافة منتجات أولاً.");
      return;
    }
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (cart.length === 0 || !currentUser) return;

    // Final stock check before processing
    for (const item of cart) {
        const product = products?.find(p => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
            alert(`المنتج "${item.productName}" لم يعد متوفراً بالكمية المطلوبة (المتوفر: ${product?.stock || 0}). يرجى تحديث السلة.`);
            setShowPaymentModal(false); // Close modal to allow cart update
            return;
        }
    }

    const orderToCreate: Omit<Order, 'id' | 'orderNumber'> = {
      customerName: customerName.trim() || 'عميل نقطة بيع',
      items: cart,
      totalAmount: calculateTotal(),
      status: OrderStatus.Delivered,
      orderDate: new Date().toISOString(),
      paymentMethod: paymentMethod,
      saleType: SaleType.Retail,
      deliveryAddress: 'نقطة بيع مباشرة',
    };

    try {
      const createdOrder = await processSaleApi(orderToCreate);
      if (createdOrder) {
        setSuccessMessage(`تمت عملية البيع بنجاح! رقم الطلب: ${createdOrder.orderNumber}`);
        const receiptHtml = generatePosReceiptHtmlForPrint(createdOrder, currentUser.companyName, currentUser.phoneNumbers);
        printHtml(receiptHtml, `إيصال طلب رقم ${createdOrder.orderNumber}`);
        clearCart();
        fetchProducts(); // Refresh product stock
      }
    } catch (error: any) {
        setErrorMessage(`فشل في معالجة البيع: ${error.message || 'خطأ غير معروف'}`);
    } finally {
        setShowPaymentModal(false);
    }
  };

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-[calc(100vh-var(--navbar-height,80px)-2rem)]" style={{'--navbar-height': '64px'} as React.CSSProperties}>
      {/* Products Section */}
      <div className="lg:w-3/5 xl:w-2/3 flex flex-col">
        <Card 
            title="اختيار المنتجات" 
            className="flex-grow flex flex-col shadow-lg" 
            bodyClassName="flex-grow flex flex-col overflow-hidden p-3 sm:p-4"
            actions={
                <Input
                    type="text"
                    placeholder="ابحث بالاسم أو الكود..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={18} className="text-muted-foreground" />}
                    wrapperClassName="mb-0 w-full sm:w-72"
                    className="text-sm"
                />
            }
        >
          {isLoadingProducts && !products?.length ? (
            <div className="flex-grow flex items-center justify-center"><LoadingSpinner text="جاري تحميل المنتجات..." /></div>
          ) : (
            <div className="flex-grow overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 p-1 custom-scrollbar">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`p-2 border border-border rounded-lg text-center transition-all duration-200 ease-in-out flex flex-col items-center justify-between group h-32 sm:h-36 relative overflow-hidden
                              ${product.stock <= 0 ? 'bg-secondary-light dark:bg-secondary-dark cursor-not-allowed opacity-60' 
                                                  : 'bg-card hover:border-primary hover:shadow-md dark:hover:shadow-md-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50'}`}
                >
                  {/* Product Image */}
                  <div className="w-full h-16 sm:h-20 mb-1 flex items-center justify-center overflow-hidden rounded-md bg-gray-50 dark:bg-gray-800">
                    {product.image ? (
                      <img 
                        src={`http://localhost:4000${product.image}`} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Package 
                      size={24} 
                      className={`text-muted-foreground group-hover:text-primary transition-colors ${product.image ? 'hidden' : ''}`}
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 w-full flex flex-col justify-between">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate w-full leading-tight" title={product.name}>
                      {product.name}
                    </p>
                    <p className="text-sm sm:text-base text-primary font-semibold mt-0.5">
                      {product.price.toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ر.س
                    </p>
                    {product.stock <= 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">نفذ المخزون</p>
                    )}
                    {product.stock > 0 && product.stock < 10 && (
                      <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">متبقي: {product.stock}</p>
                    )}
                  </div>
                  
                  {/* Stock status overlay */}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                        نفذ المخزون
                      </span>
                    </div>
                  )}
                </button>
              ))}
              {filteredProducts.length === 0 && !isLoadingProducts && <p className="col-span-full text-center text-muted-foreground py-10">لم يتم العثور على منتجات.</p>}
            </div>
          )}
        </Card>
      </div>

      {/* Cart Section */}
      <div className="lg:w-2/5 xl:w-1/3 flex flex-col">
        <Card title="سلة المشتريات" className="flex-grow flex flex-col shadow-lg" bodyClassName="flex-grow flex flex-col overflow-hidden p-3 sm:p-4">
          <div className="mb-3">
             <Input
                label="اسم العميل (اختياري)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="عميل نقطة بيع"
                wrapperClassName="mb-0"
                className="text-sm"
              />
          </div>
          <div className="flex-grow overflow-y-auto mb-3 border-t border-b border-border divide-y divide-border custom-scrollbar -mx-3 sm:-mx-4 px-3 sm:px-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">السلة فارغة.</p>
            ) : (
              cart.map(item => {
                const product = products?.find(p => p.id === item.productId);
                return (
                  <div key={item.productId} className="flex items-center justify-between py-3">
                    {/* Product Image in Cart */}
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center me-3 flex-shrink-0">
                      {product?.image ? (
                        <img 
                          src={`http://localhost:4000${product.image}`} 
                          alt={item.productName} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Package 
                        size={16} 
                        className={`text-muted-foreground ${product?.image ? 'hidden' : ''}`}
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-foreground truncate" title={item.productName}>{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.unitPrice.toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ر.س للوحدة</p>
                    </div>
                  <div className="flex items-center space-s-1 mx-2">
                    <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1 text-muted-foreground hover:text-red-500"><MinusCircle size={18} /></Button>
                    <Input type="number" value={item.quantity.toString()} onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)} className="w-12 text-center text-sm py-1 px-0 border-0 focus:ring-0 bg-transparent" wrapperClassName="mb-0" />
                    <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1 text-muted-foreground hover:text-green-500"><PlusCircle size={18} /></Button>
                  </div>
                  <p className="text-sm font-semibold text-foreground w-20 text-end">{item.totalPrice.toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ر.س</p>
                  <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.productId)} className="text-muted-foreground hover:text-red-500 p-1 ms-1"><XCircle size={18} /></Button>
                </div>
                );
              })
            )}
          </div>
          <div className="pt-3">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-foreground">الإجمالي:</span>
              <span className="text-xl font-bold text-primary">{calculateTotal().toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ر.س</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={clearCart} disabled={cart.length === 0 || isProcessingSale} className="border-border">
                إفراغ السلة
              </Button>
              <Button variant="primary" onClick={handleProcessSale} disabled={cart.length === 0 || isProcessingSale} isLoading={isProcessingSale} leftIcon={<Receipt size={18}/>}>
                إتمام البيع
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal isOpen={true} onClose={() => setShowPaymentModal(false)} title="إتمام عملية البيع" size="md"
          footer={
            <div className="flex justify-end space-s-3">
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)} disabled={isProcessingSale}>إلغاء</Button>
              <Button variant="primary" onClick={confirmPayment} isLoading={isProcessingSale} leftIcon={<CheckCircle size={18}/>}>تأكيد الدفع والطباعة</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xl text-center font-semibold text-foreground">المبلغ الإجمالي للدفع: <br/><strong className="text-3xl text-primary">{calculateTotal().toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ر.س</strong></p>
            <Input
              label="اسم العميل"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="عميل نقطة بيع"
            />
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">طريقة الدفع:</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentMethod === PaymentMethod.Cash ? 'primary' : 'secondary'}
                  onClick={() => setPaymentMethod(PaymentMethod.Cash)}
                  leftIcon={<ShoppingCart size={18}/>}
                  className="w-full justify-center text-sm py-2.5"
                >
                  نقداً
                </Button>
                <Button
                  variant={paymentMethod === PaymentMethod.Card ? 'primary' : 'secondary'}
                  onClick={() => setPaymentMethod(PaymentMethod.Card)}
                  leftIcon={<CreditCard size={18}/>}
                  className="w-full justify-center text-sm py-2.5"
                >
                  بطاقة
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-500/20 border border-yellow-300 dark:border-yellow-500/30 rounded-md text-sm text-yellow-700 dark:text-yellow-200 flex items-start">
                <AlertTriangle size={20} className="me-2 flex-shrink-0 mt-0.5"/>
                <span>سيتم خصم الكميات المباعة من المخزون بعد تأكيد الدفع.</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed bottom-5 end-5 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fadeIn z-50 flex items-center">
          <CheckCircle size={20} className="me-2"/> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed bottom-5 end-5 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fadeIn z-50 flex items-center">
          <AlertTriangle size={20} className="me-2"/> {errorMessage}
        </div>
      )}
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PointOfSalePage;
