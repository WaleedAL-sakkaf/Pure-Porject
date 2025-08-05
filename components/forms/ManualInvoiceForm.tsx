import React, { useState, useEffect } from 'react';
import { Customer, Product, OrderItem, SaleType } from '../../types';
import { getCustomers, getProducts, createInvoice } from '../../services/apiService';
import useApi from '../../hooks/useApi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from 'react-select';
import { X, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface ManualInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: () => void;
}

const ManualInvoiceForm: React.FC<ManualInvoiceFormProps> = ({ isOpen, onClose, onInvoiceCreated }) => {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<Partial<OrderItem>[]>([{ productId: '', quantity: 1, unitPrice: 0, saleType: SaleType.Retail }]);
  const [notes, setNotes] = useState('');

  const { data: customers, exec: fetchCustomers } = useApi<Customer[]>(getCustomers, []);
  const { data: products, exec: fetchProducts } = useApi<Product[]>(getProducts, []);
  const { isLoading: isCreating, exec: createInvoiceApi } = useApi(createInvoice);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchProducts();
    }
  }, [isOpen, fetchCustomers, fetchProducts]);

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index] };
    
    if (field === 'productId') {
        const product = products?.find(p => p.id === value);
        currentItem.productId = value;
        currentItem.unitPrice = product?.price || 0;
        currentItem.productName = product?.name || '';
    } else if (field === 'quantity' || field === 'unitPrice') {
        currentItem[field] = Number(value);
    }
    
    currentItem.totalPrice = (currentItem.quantity || 0) * (currentItem.unitPrice || 0);
    newItems[index] = currentItem;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0, saleType: SaleType.Retail }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0 || items.some(item => !item.productId || !item.quantity || !item.unitPrice)) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }

    const finalItems: OrderItem[] = items.map(item => ({
        productId: item.productId!,
        productName: item.productName!,
        quantity: item.quantity!,
        unitPrice: item.unitPrice!,
        totalPrice: item.totalPrice!,
        saleType: item.saleType || SaleType.Retail,
    }));

    const newInvoiceData = {
      customerId,
      items: finalItems,
      isPaid: false,
      notes,
      totalAmount: calculateTotal(),
    };
    
    const result = await createInvoiceApi(newInvoiceData);
    if(result) {
        toast.success("تم إنشاء الفاتورة بنجاح!");
        onInvoiceCreated();
        onClose();
        resetForm();
    } else {
        toast.error("حدث خطأ أثناء إنشاء الفاتورة.");
    }
  };
  
  const resetForm = () => {
      setCustomerId(null);
      setItems([{ productId: '', quantity: 1, unitPrice: 0, saleType: SaleType.Retail }]);
      setNotes('');
  }

  const customerOptions = customers?.map(c => ({ value: c.id, label: c.name }));
  const productOptions = products?.map(p => ({ value: p.id, label: `${p.name} - ${p.price} ر.س` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إنشاء فاتورة يدوية" size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6 p-1">
        <div>
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العميل</label>
          <Select
            id="customer"
            options={customerOptions}
            onChange={(option) => setCustomerId(option?.value || null)}
            placeholder="ابحث عن عميل..."
            isClearable
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            menuPortalTarget={document.body}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">المنتجات</h3>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 space-x-reverse">
                <div className="flex-1">
                    <Select
                        options={productOptions}
                        onChange={(option) => handleItemChange(index, 'productId', option?.value)}
                        placeholder="اختر منتج..."
                         styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                    />
                </div>
                <input
                  type="number"
                  placeholder="الكمية"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  min="1"
                />
                <input
                  type="number"
                  placeholder="سعر الوحدة"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                  className="w-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  step="0.01"
                />
                <p className="w-24 text-center">{(item.totalPrice || 0).toLocaleString()} ر.س</p>
                <Button variant="danger" size="icon" onClick={() => removeItem(index)}>
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" onClick={addItem} leftIcon={<Plus size={16} />} className="mt-4">
            إضافة منتج
          </Button>
        </div>

        <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
            <textarea
                id="notes"
                rows={3}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            ></textarea>
        </div>

        <div className="text-2xl font-bold text-left">
            الإجمالي: {calculateTotal().toLocaleString()} ر.س
        </div>

        <div className="flex justify-end pt-5 border-t border-gray-200 dark:border-gray-700 space-s-2">
            <Button type="button" variant="secondary" onClick={onClose}>إلغاء</Button>
            <Button type="submit" variant="primary" isLoading={isCreating} leftIcon={<Save size={16} />}>حفظ الفاتورة</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualInvoiceForm;
