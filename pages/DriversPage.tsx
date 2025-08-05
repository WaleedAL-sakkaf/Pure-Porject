/*
=== ملاحظات التخصيص - صفحة إدارة السائقين ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - للأزرار الرئيسية
- secondary: رمادي فاتح - لزر الطباعة
- danger: أحمر - لزر الحذف
- ghost: شفاف - لأزرار الإجراءات في الجدول
- muted-foreground: رمادي للأيقونات والنصوص الثانوية

الأزرار الرئيسية:
1. "سائق جديد" - Button variant="primary" مع أيقونة PlusCircle
2. "طباعة" - Button variant="secondary" مع أيقونة Printer
3. "حفظ التعديلات/إضافة سائق" - Button variant="primary" في النموذج
4. "إلغاء" - Button variant="secondary" في النموذج
5. أزرار الإجراءات: تعديل (Edit)، حذف (Trash2)

الأيقونات ومعانيها:
- PlusCircle: إضافة سائق جديد (أخضر عادة)
- User: أيقونة اسم السائق
- Phone: أيقونة رقم الهاتف
- Truck: أيقونة رقم لوحة المركبة
- Edit: أيقونة التعديل (أزرق عادة)
- Trash2: أيقونة الحذف (أحمر)
- Printer: أيقونة الطباعة

تخطيط الجدول:
- العمود الأول: اسم السائق (font-medium للخط العريض)
- العمود الثاني: رقم الهاتف
- العمود الثالث: رقم المركبة (مع نص "-" للفارغ)
- العمود الأخير: الإجراءات (text-center للتوسيط)

ألوان أزرار الإجراءات:
- زر التعديل: variant="ghost" size="icon"
- زر الحذف: variant="ghost" size="icon" مع ألوان حمراء:
  * text-red-600 hover:text-red-700 (وضع فاتح)
  * dark:text-red-400 dark:hover:text-red-500 (وضع داكن)
  * hover:bg-red-500/10 (خلفية حمراء شفافة عند التمرير)

التخطيط المتجاوب:
- flex-col sm:flex-row للتبديل بين عمودي وأفقي
- space-s-2 sm:space-s-3 للمسافات بين الأزرار
- w-full sm:w-auto للعرض الكامل على الشاشات الصغيرة

تخصيص الألوان:
- ألوان الأزرار: في components/ui/Button.tsx
- ألوان الأيقونات: className مثل text-muted-foreground
- ألوان الحذف: مجموعة من text-red-* و hover:text-red-*

المتغيرات المهمة:
- Driver: نوع بيانات السائق
- formData: بيانات نموذج السائق
- columns: تخصيص أعمدة جدول السائقين
*/

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Driver, TableColumn } from '../types';
import { getDrivers, addDriver, updateDriver, getDriverById, deleteDriver } from '../services/apiService';
import { printHtml, generateDriversListHtmlForPrint } from '../services/printService';
import useApi from '../hooks/useApi';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { PlusCircle, Edit, Trash2, Printer, User, Phone, Truck } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext'; 

type DriversPageProps = {
  mode?: 'list' | 'new' | 'edit';
};

const DriverForm: React.FC<{ driver?: Driver; onSave: (driver: Driver | Omit<Driver, 'id'>) => Promise<void>; onClose: () => void; isLoading: boolean; }> = 
  ({ driver, onSave, onClose, isLoading }) => {
  const [formData, setFormData] = useState<Partial<Driver>>(driver || {
    name: '',
    phone: '',
    vehicleNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (driver) {
        setFormData(driver);
    } else {
        setFormData({ name: '', phone: '', vehicleNumber: '' });
    }
  }, [driver]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({...prev, [name]: ''}));
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "اسم السائق مطلوب";
    if (!formData.phone?.trim()) newErrors.phone = "رقم هاتف السائق مطلوب";
    else if (!/^05\d{8}$/.test(formData.phone)) newErrors.phone = "رقم الهاتف غير صالح (مثال: 05xxxxxxxx)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!validate()) return;
    await onSave(formData as Driver | Omit<Driver, 'id'>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <Input label="اسم السائق" name="name" value={formData.name || ''} onChange={handleChange} error={errors.name} required leftIcon={<User size={16} className="text-muted-foreground"/>} />
      <Input label="رقم الهاتف" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} error={errors.phone} required leftIcon={<Phone size={16} className="text-muted-foreground"/>} />
      <Input label="رقم لوحة المركبة (اختياري)" name="vehicleNumber" value={formData.vehicleNumber || ''} onChange={handleChange} leftIcon={<Truck size={16} className="text-muted-foreground"/>} />
      <div className="flex justify-end space-s-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>إلغاء</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {driver ? 'حفظ التعديلات' : 'إضافة سائق'}
        </Button>
      </div>
    </form>
  );
};


const DriversPage: React.FC<DriversPageProps> = ({ mode: initialMode }) => {
  const navigate = useNavigate();
  const { driverId } = useParams<{ driverId: string }>();
  const { currentUser } = useAuth(); 

  const [currentMode, setCurrentMode] = useState<'list' | 'new' | 'edit'>(initialMode || (driverId ? 'edit' : 'list'));
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Driver | null>(null);

  const { data: drivers, isLoading, error, exec: fetchDrivers, setData: setDrivers } = useApi<Driver[], [], Driver[]>(getDrivers, []);
  const { isLoading: isFetchingDetails, exec: fetchDriverDetailsApi } = useApi<Driver | undefined, [string], Driver | undefined>(getDriverById);
  const { isLoading: isSaving, exec: saveDriverApi } = useApi<Driver, [Driver | Omit<Driver, 'id'>], Driver>(
    (data) => (data as Driver).id ? updateDriver(data as Driver) : addDriver(data as Omit<Driver, 'id'>)
  );
  const { isLoading: isDeleting, exec: deleteDriverApi } = useApi<void, [string], void>(deleteDriver);

  const refreshDrivers = useCallback(() => {
    fetchDrivers().then(data => {
      if(data) setDrivers(data);
    });
  }, [fetchDrivers, setDrivers]);

  useEffect(() => {
    refreshDrivers();
  }, [refreshDrivers]);

  useEffect(() => {
    const newMode = initialMode || (driverId ? 'edit' : 'list');
    setCurrentMode(newMode);

    if (newMode === 'edit' && driverId) {
        fetchDriverDetailsApi(driverId).then(drv => setSelectedDriver(drv));
    } else {
        setSelectedDriver(undefined);
        if(newMode !== 'new' && newMode !== 'list') navigate('/drivers'); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, driverId, navigate]);


  const handleAddNew = () => {
    setSelectedDriver(undefined);
    setCurrentMode('new');
    navigate('/drivers/new');
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver); 
    setCurrentMode('edit');
    navigate(`/drivers/edit/${driver.id}`);
  };
  
  const handleSaveDriver = async (driverData: Driver | Omit<Driver, 'id'>) => {
    await saveDriverApi(driverData);
    refreshDrivers();
    handleCloseModal();
  };

  const handleDeleteDriver = async () => {
    if (showDeleteConfirm) {
        await deleteDriverApi(showDeleteConfirm.id);
        refreshDrivers();
        setShowDeleteConfirm(null);
        handleCloseModal(); 
    }
  };

  const handleCloseModal = () => {
    setCurrentMode('list');
    setSelectedDriver(undefined);
    setShowDeleteConfirm(null);
    navigate('/drivers');
  };
  
  const handlePrintList = () => {
    if (!currentUser) {
      alert("خطأ: بيانات المستخدم غير متاحة للطباعة.");
      return;
    }
    if (drivers && drivers.length > 0) {
      const driversHtml = generateDriversListHtmlForPrint(drivers, currentUser.companyName, currentUser.phoneNumbers);
      printHtml(driversHtml, "قائمة السائقين");
    } else {
      alert("لا يوجد سائقون لطباعتهم.");
    }
  };
  
  const columns: TableColumn<Driver>[] = [
    { key: 'name', header: 'اسم السائق', className: "font-medium" },
    { key: 'phone', header: 'رقم الهاتف' },
    { key: 'vehicleNumber', header: 'رقم المركبة', render: (item) => item.vehicleNumber || <span className="text-muted-foreground">-</span> },
    {
      key: 'actions',
      header: 'إجراءات',
      className: "text-center",
      render: (item) => (
        <div className="flex justify-center space-s-1 sm:space-s-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="تعديل"><Edit size={16} /></Button>
          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 hover:bg-red-500/10" onClick={() => setShowDeleteConfirm(item)} title="حذف"><Trash2 size={16} /></Button>
        </div>
      ),
    },
  ];

  if (isLoading && currentMode === 'list' && !drivers?.length) {
    return <LoadingSpinner text="جاري تحميل بيانات السائقين..." />;
  }
  
  if (error) {
     return <Card title="خطأ في التحميل" className="border-red-500/50"><p className="text-red-500 dark:text-red-400 p-4 text-center"> {error.message}</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إدارة السائقين</h1>
        <div className="flex space-s-2 sm:space-s-3 w-full sm:w-auto">
          <Button onClick={handlePrintList} variant="secondary" leftIcon={<Printer size={18}/>} disabled={!currentUser || !drivers || drivers.length === 0} className="flex-1 sm:flex-initial">
            طباعة
          </Button>
          <Button onClick={handleAddNew} leftIcon={<PlusCircle size={18} />} className="flex-1 sm:flex-initial">
            سائق جديد
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table columns={columns} data={drivers || []} isLoading={isLoading} />
      </Card>

      {(currentMode === 'new' || (currentMode === 'edit' && selectedDriver)) && (
        <Modal isOpen={true} onClose={handleCloseModal} title={currentMode === 'new' ? 'إضافة سائق جديد' : 'تعديل بيانات السائق'} size="md">
          {isFetchingDetails && currentMode === 'edit' ? <div className="min-h-[250px] flex items-center justify-center"><LoadingSpinner text="جاري تحميل بيانات السائق..." /></div> :
            <DriverForm 
                driver={selectedDriver} 
                onSave={handleSaveDriver} 
                onClose={handleCloseModal}
                isLoading={isSaving}
            />
          }
        </Modal>
      )}
      
      {showDeleteConfirm && (
        <Modal 
            isOpen={true} 
            onClose={() => setShowDeleteConfirm(null)} 
            title="تأكيد الحذف"
            size="sm"
            footer={
                <div className="flex justify-end space-s-3">
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} disabled={isDeleting}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteDriver} isLoading={isDeleting} leftIcon={<Trash2 size={16}/>}>حذف</Button>
                </div>
            }
        >
            <p className="text-center">هل أنت متأكد أنك تريد حذف السائق <br/> "<strong>{showDeleteConfirm.name}</strong>"؟ <br/> لا يمكن التراجع عن هذا الإجراء.</p>
        </Modal>
      )}
    </div>
  );
};

export default DriversPage;