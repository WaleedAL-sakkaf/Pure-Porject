/*
=== ملاحظات التخصيص - صفحة إدارة العملاء ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق افتراضياً) - للأزرار الرئيسية والروابط النشطة
- secondary: رمادي فاتح - للأزرار الثانوية مثل "طباعة" و "إلغاء"
- danger/red: أحمر - لأزرار الحذف والتحذيرات
- green: أخضر - للحالات الإيجابية والرصيد الموجب
- yellow: أصفر - للعملاء المؤقتين والتحذيرات
- muted-foreground: رمادي للنصوص الثانوية والأيقونات

الأزرار الرئيسية وأماكنها:
1. "عميل جديد" - Button variant="primary" (خط 364 تقريباً)
2. "طباعة" - Button variant="secondary" (خط 363 تقريباً)
3. "حفظ التعديلات/إضافة عميل" - Button variant="primary" في النموذج (خط 129 تقريباً)
4. "إلغاء" - Button variant="secondary" في النموذج (خط 128 تقريباً)
5. أزرار الإجراءات: تعديل، حذف، إنشاء طلب

الأيقونات حسب نوع العميل (دالة typeSpecificIcon):
- Briefcase: العملاء التجاريون (Commercial) - رمادي
- Building: العملاء الحكوميون (Governmental) - رمادي
- Home: العملاء المنزليون (Household) - رمادي
- UserSquare: العملاء المؤقتون (Temporary) - رمادي
- UsersIcon: العملاء الرسميون (Official) والافتراضي - رمادي

الأيقونات العامة ومعانيها:
- PlusCircle: إضافة عميل جديد
- Edit3: تعديل اسم العميل في النموذج
- Phone: رقم الهاتف
- MapPin: العنوان
- Calendar: تاريخ انتهاء العقد المؤقت
- DollarSign: الرصيد المالي
- ShoppingBag: إنشاء طلب جديد للعميل
- Printer: طباعة قائمة العملاء
- Edit: تعديل بيانات العميل
- Trash2: حذف العميل

ألوان الحالات والنصوص:
- العملاء المؤقتون: text-yellow-600 (أصفر)
- العملاء النشطون: text-green-600 (أخضر)
- العملاء منتهية الصلاحية: text-red-600 (أحمر)
- الرصيد الموجب: text-green-600 (أخضر)
- الرصيد السالب: text-red-600 (أحمر)

تخصيص الألوان والأيقونات:
- أيقونات أنواع العملاء: دالة typeSpecificIcon() في الخط 103 تقريباً
- ألوان الأزرار: في components/ui/Button.tsx
- أيقونات وألوان الحالة: في columns حول الخط 380 تقريباً
- ألوان النصوص: classes مثل text-yellow-600، text-green-600، text-red-600

المتغيرات المهمة للتعديل:
- CUSTOMER_TYPE_OPTIONS: أنواع العملاء في constants.ts
- CustomerType: enum لأنواع العملاء في types.ts
- formData: بيانات نموذج العميل
- columns: تخصيص أعمدة جدول العملاء
*/

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer, CustomerType, TableColumn } from '../types';
import { getCustomers, getCustomerById, addCustomer, updateCustomer, deleteCustomer } from '../services/apiService'; 
import { printHtml, generateCustomersListHtmlForPrint, formatDate } from '../services/printService'; // Import formatDate
import useApi from '../hooks/useApi';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import { PlusCircle, Edit, ShoppingBag, Printer, Calendar, Users as UsersIcon, Building, Home, Briefcase, Phone, MapPin, UserSquare, Edit3, DollarSign, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext'; 
import { CUSTOMER_TYPE_OPTIONS } from '../constants';

type CustomersPageProps = {
  mode?: 'list' | 'new' | 'edit';
};

const CustomerForm: React.FC<{ customer?: Customer; onSave: (customer: Customer | Omit<Customer, 'id'>) => Promise<void>; onClose: () => void; isLoading: boolean; }> = 
  ({ customer, onSave, onClose, isLoading }) => {
  
  const initialFormData: Partial<Customer> = customer || {
    name: '',
    phone: '',
    address: '',
    customerType: CustomerType.Official,
    temporaryExpiryDate: undefined,
    balance: 0,
    ownedBottles: undefined, // Default to undefined for new customers
  };

  if (initialFormData.temporaryExpiryDate) {
    initialFormData.temporaryExpiryDate = new Date(initialFormData.temporaryExpiryDate).toISOString().split('T')[0];
  }


  const [formData, setFormData] = useState<Partial<Customer>>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (customer) {
        const customerData = {...customer};
        if (customerData.temporaryExpiryDate) {
            customerData.temporaryExpiryDate = new Date(customerData.temporaryExpiryDate).toISOString().split('T')[0];
        }
        setFormData(customerData);
    } else {
         setFormData({
            name: '',
            phone: '',
            address: '',
            customerType: CustomerType.Official,
            temporaryExpiryDate: undefined,
            balance: 0,
            ownedBottles: undefined,
        });
    }
  }, [customer]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: string | number | undefined = value;

    if (type === 'number') {
        val = value === '' ? undefined : parseFloat(value);
        if (val !== undefined && isNaN(val as number)) val = 0;
    }
    
    setErrors(prev => ({...prev, [name]: ''}));

    if (name === 'customerType') {
        const newCustomerType = value as CustomerType;
        setFormData(prev => ({ 
            ...prev, 
            customerType: newCustomerType,
            temporaryExpiryDate: newCustomerType !== CustomerType.Temporary ? undefined : prev.temporaryExpiryDate 
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: val }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "اسم العميل مطلوب";
    if (!formData.phone?.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    else if (!/^05\d{8}$/.test(formData.phone) && !/^\d{7,9}$/.test(formData.phone)) newErrors.phone = "رقم الهاتف غير صالح (مثال: 05xxxxxxxx أو رقم أرضي)";

    if (!formData.customerType) newErrors.customerType = "نوع العميل مطلوب";
    if (formData.customerType === CustomerType.Temporary) {
      if (!formData.temporaryExpiryDate) {
        newErrors.temporaryExpiryDate = "تاريخ انتهاء العقد المؤقت مطلوب";
      } else if (new Date(formData.temporaryExpiryDate) <= new Date()) {
        newErrors.temporaryExpiryDate = "تاريخ الانتهاء يجب أن يكون في المستقبل";
      }
    }
    
    if (formData.balance === undefined) formData.balance = 0;
    
    if (formData.ownedBottles !== undefined && formData.ownedBottles !== null && formData.ownedBottles < 0) {
        newErrors.ownedBottles = "عدد القوارير يجب أن يكون رقماً موجباً أو صفراً";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const dataToSave = { ...formData };
    if (dataToSave.customerType !== CustomerType.Temporary) {
        delete dataToSave.temporaryExpiryDate; 
    } else if (dataToSave.temporaryExpiryDate) {
        dataToSave.temporaryExpiryDate = new Date(dataToSave.temporaryExpiryDate).toISOString();
    }
    if (dataToSave.ownedBottles === undefined || dataToSave.ownedBottles === null || isNaN(dataToSave.ownedBottles)) {
        dataToSave.ownedBottles = undefined; // Or 0 if your API expects a number
    }

    await onSave(dataToSave as Customer | Omit<Customer, 'id'>);
  };

  const typeSpecificIcon = (type?: CustomerType) => {
    switch(type) {
        case CustomerType.Commercial: return <Briefcase size={16} className="text-muted-foreground"/>;
        case CustomerType.Governmental: return <Building size={16} className="text-muted-foreground"/>;
        case CustomerType.Household: return <Home size={16} className="text-muted-foreground"/>;
        case CustomerType.Temporary: return <UserSquare size={16} className="text-muted-foreground" />;
        default: return <UsersIcon size={16} className="text-muted-foreground"/>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <Input label="اسم العميل (شركة/مؤسسة/فرد)" name="name" value={formData.name || ''} onChange={handleChange} error={errors.name} required leftIcon={<Edit3 size={16} className="text-muted-foreground"/>}/>
      <Input label="رقم الهاتف" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} error={errors.phone} required leftIcon={<Phone size={16} className="text-muted-foreground"/>}/>
      <Select 
        label="نوع العميل"
        name="customerType"
        options={CUSTOMER_TYPE_OPTIONS}
        value={formData.customerType || CustomerType.Official}
        onChange={handleChange}
        error={errors.customerType}
        leftIcon={typeSpecificIcon(formData.customerType)}
        required
      />
      {formData.customerType === CustomerType.Temporary && (
        <Input 
          label="تاريخ انتهاء العقد المؤقت"
          name="temporaryExpiryDate"
          type="date"
          value={formData.temporaryExpiryDate || ''}
          onChange={handleChange}
          error={errors.temporaryExpiryDate}
          leftIcon={<Calendar size={16} className="text-muted-foreground" />}
          required
        />
      )}
      <Input label="العنوان (اختياري)" name="address" value={formData.address || ''} onChange={handleChange} leftIcon={<MapPin size={16} className="text-muted-foreground"/>} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="الرصيد الحالي" name="balance" type="number" value={formData.balance?.toString() ?? '0'} onChange={handleChange} error={errors.balance} step="any" placeholder="0" leftIcon={<DollarSign size={16} className="text-muted-foreground"/>}/>
        <Input label="عدد القوارير المملوكة (اختياري)" name="ownedBottles" type="number" value={formData.ownedBottles?.toString() ?? ''} onChange={handleChange} error={errors.ownedBottles} min="0" placeholder="0" leftIcon={<UsersIcon size={16} className="text-muted-foreground"/>}/>
      </div>
      <div className="flex justify-end space-s-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>إلغاء</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {customer ? 'حفظ التعديلات' : 'إضافة عميل'}
        </Button>
      </div>
    </form>
  );
};

const RetailSaleForm: React.FC<{onClose: () => void}> = ({onClose}) => {
    const navigate = useNavigate();
    const handleNavigate = (path: string) => {
        onClose();
        navigate(path);
    }
    return (
        <div className="space-y-4 text-center">
            <ShoppingBag size={48} className="mx-auto text-primary mb-3"/>
            <p className="text-foreground">لتسجيل مبيعات التجزئة السريعة، يرجى استخدام صفحة <strong className="text-primary hover:underline cursor-pointer" onClick={() => handleNavigate('/pos')}>"نقطة البيع"</strong>.</p>
            <p className="text-sm text-muted-foreground">إذا كنت ترغب في إنشاء طلب تجزئة مع تفاصيل إضافية (مثل عنوان توصيل محدد)، يمكنك <strong className="text-primary hover:underline cursor-pointer" onClick={() => handleNavigate('/orders/new')}>إنشاء طلب جديد</strong> من صفحة "إدارة الطلبات" واختيار نوع البيع "تجزئة".</p>
            <div className="flex justify-center pt-4">
                 <Button variant="primary" onClick={onClose}>فهمت</Button>
            </div>
        </div>
    );
};


const CustomersPage: React.FC<CustomersPageProps> = ({ mode: initialMode }) => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const { currentUser } = useAuth(); 

  const [currentMode, setCurrentMode] = useState<'list' | 'new' | 'edit'>(initialMode || (customerId ? 'edit' : 'list'));
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [showRetailModal, setShowRetailModal] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { data: customers, isLoading, error, exec: fetchCustomers, setData: setCustomers } = useApi<Customer[], [], Customer[]>(getCustomers, []);
  const { isLoading: isFetchingDetails, exec: fetchCustomerDetails } = useApi<Customer | undefined, [string], Customer | undefined>(getCustomerById);
  const { isLoading: isSaving, exec: saveCustomerApi } = useApi<Customer, [Customer | Omit<Customer, 'id'>], Customer>(
    (data) => (data as Customer).id ? updateCustomer(data as Customer) : addCustomer(data as Omit<Customer, 'id'>)
  );
  const { isLoading: isDeleting, exec: deleteCustomerApi } = useApi<void, [string], void>(deleteCustomer);

  // Function to get deleted customer IDs from localStorage
  const getDeletedCustomerIds = (): string[] => {
    const deletedIds = localStorage.getItem('deletedCustomerIds');
    return deletedIds ? JSON.parse(deletedIds) : [];
  };

  // Function to add a customer ID to the deleted customers list
  const addToDeletedCustomers = (customerId: string) => {
    const deletedIds = getDeletedCustomerIds();
    if (!deletedIds.includes(customerId)) {
      deletedIds.push(customerId);
      localStorage.setItem('deletedCustomerIds', JSON.stringify(deletedIds));
    }
  };

  const refreshCustomers = useCallback(() => {
    fetchCustomers().then(data => {
      if(data) {
        // Filter out any customers that are in the deletedCustomerIds list
        const deletedIds = getDeletedCustomerIds();
        const filteredCustomers = data.filter(customer => !deletedIds.includes(customer.id));
        setCustomers(filteredCustomers);
      }
    });
  }, [fetchCustomers, setCustomers]);

  useEffect(() => {
    refreshCustomers();
  }, [refreshCustomers]);
  
  useEffect(() => {
    if (initialMode) setCurrentMode(initialMode);
    else if (customerId) setCurrentMode('edit');
    else setCurrentMode('list');

    if ((initialMode === 'edit' || customerId) && customerId) {
        fetchCustomerDetails(customerId).then(cust => setSelectedCustomer(cust));
    } else {
        setSelectedCustomer(undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, customerId]);

  const handleAddNewCustomer = () => {
    setSelectedCustomer(undefined);
    setCurrentMode('new');
    navigate('/customers/new');
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentMode('edit');
    navigate(`/customers/edit/${customer.id}`);
  };

  const handleSaveCustomer = async (customerData: Customer | Omit<Customer, 'id'>) => {
    await saveCustomerApi(customerData);
    refreshCustomers();
    handleCloseModal();
  };
  
  const handlePrintList = () => {
    if (!currentUser) {
      alert("خطأ: بيانات المستخدم غير متاحة للطباعة.");
      return;
    }
    if (customers && customers.length > 0) {
      const customersHtml = generateCustomersListHtmlForPrint(customers, currentUser.companyName, currentUser.phoneNumbers);
      printHtml(customersHtml, "قائمة العملاء");
    } else {
      alert("لا يوجد عملاء لطباعتهم.");
    }
  };

  const handleCloseModal = () => {
    setCurrentMode('list');
    setSelectedCustomer(undefined);
    navigate('/customers');
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await deleteCustomerApi(customerToDelete.id);
        
        // Add the customer ID to localStorage
        addToDeletedCustomers(customerToDelete.id);
        
        // Manually remove the deleted customer from the local state
        if (customers) {
          const updatedCustomers = customers.filter(customer => customer.id !== customerToDelete.id);
          setCustomers(updatedCustomers);
        }
        
        setIsConfirmDeleteOpen(false);
        setCustomerToDelete(null);
        alert(`تم حذف العميل "${customerToDelete.name}" بنجاح.`);
      } catch (error) {
        alert(`فشل حذف العميل: ${error instanceof Error ? error.message : 'حدث خطأ'}`);
      }
    }
  };

  const cancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setCustomerToDelete(null);
  };
  
  const columns: TableColumn<Customer>[] = [
    { key: 'name', header: 'اسم العميل', className: "font-medium" },
    { key: 'phone', header: 'رقم الهاتف' },
    { 
      key: 'customerType', 
      header: 'نوع العميل',
      render: (item) => {
        const typeOption = CUSTOMER_TYPE_OPTIONS.find(opt => opt.value === item.customerType);
        return typeOption ? typeOption.label : item.customerType;
      }
    },
    { key: 'address', header: 'العنوان', render: (item) => item.address || <span className="text-muted-foreground">-</span>, className: 'max-w-xs truncate' },
    { 
      key: 'temporaryExpiryDate', 
      header: 'انتهاء العقد', 
      render: (item) => item.customerType === CustomerType.Temporary && item.temporaryExpiryDate ? formatDate(item.temporaryExpiryDate, 'short') : <span className="text-muted-foreground">-</span>
    },
    { key: 'balance', header: 'الرصيد', render: (item) => <span className={ (item.balance || 0) > 0 ? 'text-red-500' : (item.balance || 0) < 0 ? 'text-green-500' : 'text-foreground' }>{`${(item.balance || 0).toLocaleString()} ر.س`}</span> },
    { key: 'ownedBottles', header: 'القوارير', render: (item) => item.ownedBottles ?? 0, className:"text-center" },
    {
      key: 'actions',
      header: 'إجراءات',
      className: "text-center",
      render: (item) => (
        <div className="flex justify-center space-s-1 sm:space-s-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item);}} title="تعديل"><Edit size={16} /></Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(item);}} 
            title="حذف"
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading && currentMode === 'list' && !customers?.length) {
    return <LoadingSpinner text="جاري تحميل العملاء..." />;
  }
  
  if (error) {
     return <Card title="خطأ في التحميل" className="border-red-500/50"><p className="text-red-500 dark:text-red-400 p-4 text-center"> {error.message}</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إدارة العملاء</h1>
        <div className="flex space-s-2 sm:space-s-3 w-full sm:w-auto">
            <Button onClick={handlePrintList} variant="secondary" leftIcon={<Printer size={18}/>} disabled={!currentUser || !customers || customers.length === 0} className="flex-1 sm:flex-initial">
                طباعة
            </Button>
            <Button onClick={() => setShowRetailModal(true)} variant="success" leftIcon={<ShoppingBag size={18} />} className="flex-1 sm:flex-initial">
                نقطة بيع
            </Button>
            <Button onClick={handleAddNewCustomer} leftIcon={<PlusCircle size={18} />} className="flex-1 sm:flex-initial">
                عميل جديد
            </Button>
        </div>
      </div>

      <Card title="قائمة العملاء المسجلين" className="overflow-hidden">
        <Table columns={columns} data={customers || []} isLoading={isLoading} onRowClick={handleEdit}/>
      </Card>

      {(currentMode === 'new' || (currentMode === 'edit' && selectedCustomer)) && (
        <Modal isOpen={true} onClose={handleCloseModal} title={currentMode === 'new' ? 'إضافة عميل جديد' : 'تعديل بيانات العميل'} size="lg">
           {isFetchingDetails && currentMode === 'edit' ? <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner text="جاري تحميل بيانات العميل..." /></div> :
            <CustomerForm 
                customer={selectedCustomer} 
                onSave={handleSaveCustomer} 
                onClose={handleCloseModal}
                isLoading={isSaving}
            />
           }
        </Modal>
      )}
      
      <Modal isOpen={showRetailModal} onClose={() => setShowRetailModal(false)} title="نقطة بيع تجزئة سريعة" size="md">
        <RetailSaleForm onClose={() => setShowRetailModal(false)} />
      </Modal>

      <Modal isOpen={isConfirmDeleteOpen} onClose={cancelDelete} title="تأكيد الحذف" size="sm">
        <div className="space-y-4">
          <p className="text-center">
            هل أنت متأكد من رغبتك في حذف العميل "{customerToDelete?.name}"؟
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

export default CustomersPage;