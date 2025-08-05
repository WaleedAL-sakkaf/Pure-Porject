
/*
=== ملاحظات التخصيص - صفحة النسخ الاحتياطي والاستعادة ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - للأزرار الرئيسية
- green: أخضر - لرسائل النجاح والأزرار الآمنة
- red: أحمر - لرسائل الخطأ والتحذيرات الخطيرة
- yellow: أصفر - للتحذيرات العامة
- muted-foreground: رمادي للنصوص التوضيحية

أقسام الصفحة:
1. قسم معلومات قاعدة البيانات - Card مع أيقونة Database
2. قسم النسخ الاحتياطي لقاعدة البيانات - Card مع أيقونة Download
3. قسم استعادة قاعدة البيانات - Card مع أيقونة Upload
4. قسم النسخ الاحتياطي للإعدادات - Card مع أيقونة HardDrive

الأيقونات ومعانيها:
- Database: أيقونة قاعدة البيانات وإحصائياتها
- Download: أيقونة تحميل النسخ الاحتياطية
- Upload: أيقونة رفع ملفات الاستعادة
- HardDrive: أيقونة الإعدادات المحلية
- AlertTriangleIcon: تحذيرات مهمة
- Info: معلومات توضيحية

ألوان العمليات:
- النسخ الاحتياطي:
  * أزرار خضراء: bg-green-500 hover:bg-green-600
  * أيقونات خضراء: text-green-600
- الاستعادة:
  * أزرار حمراء: bg-red-500 hover:bg-red-600
  * أيقونات حمراء: text-red-600
- التحذيرات:
  * خلفية صفراء: bg-yellow-50 dark:bg-yellow-500/10
  * نص أصفر: text-yellow-800 dark:text-yellow-200

رسائل الحالة:
- النجاح:
  * النص: text-green-600 dark:text-green-400
  * الخلفية: bg-green-100 dark:bg-green-500/20
- الخطأ:
  * النص: text-red-600 dark:text-red-400
  * الخلفية: bg-red-100 dark:bg-red-500/20

معلومات قاعدة البيانات:
- الجداول: عرض في شبكة متجاوبة
- الإحصائيات: نصوص مميزة بألوان مختلفة
- الأحجام: تنسيق بوحدات مناسبة (KB, MB, GB)

نوافذ التأكيد:
- نافذة تأكيد خطيرة للاستعادة
- أزرار متباينة: إلغاء (secondary) و تأكيد (danger)
- رسائل تحذيرية واضحة

حالات التحميل:
- أزرار مع حالة تحميل: isLoading
- رسائل تقدم العملية
- تعطيل العناصر أثناء المعالجة

أمان العمليات:
- تحديد أنواع الملفات: .sql للقاعدة، .json للإعدادات
- حد أقصى لحجم الملف: 100MB
- رسائل تأكيد متعددة للعمليات الخطيرة

المتغيرات المهمة:
- DatabaseInfo: معلومات تفصيلية عن قاعدة البيانات
- CLIENT_SIDE_STORAGE_KEYS: المفاتيح المخزنة محلياً
- backupFile & dbBackupFile: ملفات الاستعادة المرفوعة
*/

import React, { useState, ChangeEvent, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Download, Upload, AlertTriangle as AlertTriangleIcon, Info, Database, HardDrive } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Define keys for data that IS legitimately stored and managed client-side in localStorage.
const CLIENT_SIDE_STORAGE_KEYS = [
  'currentUser', // Stores the currently logged-in user session
  'theme'        // Stores the user's selected theme (light/dark)
];

// معلومات قاعدة البيانات
interface DatabaseInfo {
  database: string;
  host: string;
  tablesCount: number;
  totalRows: number;
  totalSize: number;
  tables: {
    name: string;
    rows: number;
    size: number;
  }[];
}

const BackupRestorePage: React.FC = () => {
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [dbBackupFile, setDbBackupFile] = useState<File | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [showDbRestoreConfirmModal, setShowDbRestoreConfirmModal] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbSuccess, setDbSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDbProcessing, setIsDbProcessing] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);


  // تحميل معلومات قاعدة البيانات
  useEffect(() => {
    const fetchDatabaseInfo = async () => {
      try {
        const response = await fetch('/api/backup/info');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDatabaseInfo(data.info);
          }
        }
      } catch (error) {
        console.error('خطأ في تحميل معلومات قاعدة البيانات:', error);
      }
    };

    fetchDatabaseInfo();
  }, []);

  // نسخ احتياطي لقاعدة البيانات
  const handleDatabaseBackup = async () => {
    setDbError(null);
    setDbSuccess(null);
    setIsDbProcessing(true);

    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // التحقق من نوع المحتوى
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/octet-stream')) {
          // تحميل الملف
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `database_backup_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.sql`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          setDbSuccess('تم إنشاء النسخة الاحتياطية لقاعدة البيانات وتحميلها بنجاح!');
        } else {
          // محاولة قراءة JSON في حالة الخطأ
          const text = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(text);
          } catch {
            throw new Error('استجابة غير متوقعة من الخادم');
          }
          throw new Error(errorData.message || 'فشل في إنشاء النسخة الاحتياطية');
        }
      } else {
        // محاولة قراءة رسالة الخطأ
        const text = await response.text();
        let errorMessage = 'فشل في إنشاء النسخة الاحتياطية';
        
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // إذا لم يكن JSON، استخدم النص مباشرة
          if (text.trim()) {
            errorMessage = text;
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('خطأ في النسخ الاحتياطي:', error);
      setDbError(`فشل في إنشاء النسخة الاحتياطية: ${error.message}`);
    } finally {
      setIsDbProcessing(false);
    }
  };

  // استعادة قاعدة البيانات
  const handleDatabaseRestore = async () => {
    if (!dbBackupFile) return;

    setDbError(null);
    setDbSuccess(null);
    setIsDbProcessing(true);
    setShowDbRestoreConfirmModal(false);

    try {
      const formData = new FormData();
      formData.append('backupFile', dbBackupFile);

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setDbSuccess('تم استعادة قاعدة البيانات بنجاح! سيتم إعادة تحميل الصفحة...');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(data.message || 'فشل في استعادة قاعدة البيانات');
      }
    } catch (error: any) {
      console.error('خطأ في الاستعادة:', error);
      setDbError(`فشل في استعادة قاعدة البيانات: ${error.message}`);
    } finally {
      setIsDbProcessing(false);
      setDbBackupFile(null);
      const fileInput = document.getElementById('dbBackupFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleBackupData = () => {
    setGeneralError(null);
    setGeneralSuccess(null);
    setIsProcessing(true);
    try {
      const backupData: Record<string, any> = {};
      CLIENT_SIDE_STORAGE_KEYS.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            backupData[key] = JSON.parse(item);
          } catch (e) {
            console.warn(`Could not parse localStorage item ${key} for backup, storing as raw string.`, e);
            backupData[key] = item; 
          }
        }
      });

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      link.download = `pure_water_control_settings_backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setGeneralSuccess("تم إنشاء ملف النسخة الاحتياطية لإعدادات العميل بنجاح!");
    } catch (error: any) {
      console.error("Backup failed:", error);
      setGeneralError(`فشل إنشاء النسخة الاحتياطية: ${error.message}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setGeneralError(null);
    setGeneralSuccess(null);
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === "application/json") {
        setBackupFile(file);
      } else {
        setGeneralError("الرجاء اختيار ملف بصيغة JSON.");
        setBackupFile(null);
        event.target.value = ''; 
      }
    } else {
      setBackupFile(null);
    }
  };

  const handleDbFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDbError(null);
    setDbSuccess(null);
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.name.endsWith('.sql')) {
        setDbBackupFile(file);
      } else {
        setDbError("الرجاء اختيار ملف بصيغة .sql");
        setDbBackupFile(null);
        event.target.value = '';
      }
    } else {
      setDbBackupFile(null);
    }
  };

  const handleRestoreFromFileClick = () => {
    setGeneralError(null);
    setGeneralSuccess(null);
    if (!backupFile) {
      setGeneralError("الرجاء اختيار ملف النسخة الاحتياطية أولاً.");
      return;
    }
    setShowRestoreConfirmModal(true);
  };
  
  const confirmRestore = () => {
    setShowRestoreConfirmModal(false);
    if (!backupFile) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("فشل في قراءة محتوى الملف.");
        }
        const dataToRestore = JSON.parse(text);
        
        const hasKnownKeys = Object.keys(dataToRestore).some(key => CLIENT_SIDE_STORAGE_KEYS.includes(key));
        if (!hasKnownKeys) {
            throw new Error("ملف النسخ الاحتياطي غير صالح أو لا يحتوي على البيانات المتوقعة لإعدادات العميل.");
        }

        Object.keys(dataToRestore).forEach(key => {
          // Only restore keys that are part of our defined client-side storage keys
          if (CLIENT_SIDE_STORAGE_KEYS.includes(key)) { 
             localStorage.setItem(key, JSON.stringify(dataToRestore[key]));
          }
        });
        
        setGeneralSuccess("تم استعادة إعدادات العميل بنجاح! سيتم إعادة تحميل الصفحة لتطبيق التغييرات.");
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } catch (err: any) {
        console.error("Restore failed:", err);
        setGeneralError(`فشل استعادة البيانات: ${err.message}. تأكد من أن الملف صحيح.`);
      } finally {
        setIsProcessing(false);
        setBackupFile(null); 
        const fileInput = document.getElementById('backupFileInput') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(backupFile);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إدارة النسخ الاحتياطي والاستعادة</h1>
      
      {/* معلومات قاعدة البيانات */}
      {databaseInfo && (
        <Card title="معلومات قاعدة البيانات" titleClassName="flex items-center gap-2 text-lg">
          <Database size={20} className="text-primary" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{databaseInfo.tablesCount}</div>
              <div className="text-sm text-muted-foreground">عدد الجداول</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{databaseInfo.totalRows.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{databaseInfo.totalSize} MB</div>
              <div className="text-sm text-muted-foreground">حجم قاعدة البيانات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{databaseInfo.database}</div>
              <div className="text-sm text-muted-foreground">اسم قاعدة البيانات</div>
            </div>
          </div>
        </Card>
      )}

      {/* رسائل النجاح والأخطاء لقاعدة البيانات */}
      {dbError && <Card className="border-red-500/50 bg-red-50 dark:bg-red-900/20"><p className="text-sm text-red-600 dark:text-red-400 p-2 text-center">{dbError}</p></Card>}
      {dbSuccess && <Card className="border-green-500/50 bg-green-50 dark:bg-green-900/20"><p className="text-sm text-green-600 dark:text-green-400 p-2 text-center">{dbSuccess}</p></Card>}

      {/* نسخ احتياطي لقاعدة البيانات */}
      <Card title="نسخ احتياطي لقاعدة البيانات" titleClassName="flex items-center gap-2 text-lg">
        <HardDrive size={20} className="text-primary" />
        <div className="p-1 space-y-3">
          <div className="flex items-start p-3 bg-blue-50 dark:bg-sky-900/30 border border-blue-300 dark:border-sky-700 rounded-lg text-blue-700 dark:text-sky-200 text-sm">
            <Info size={28} className="me-3 flex-shrink-0 text-blue-500 dark:text-sky-400" />
            <div>
              <strong className="font-semibold">معلومة:</strong>
              <p>
                نسخ احتياطي كامل لجميع بيانات النظام (العملاء، المنتجات، الطلبات، المستخدمين) من قاعدة البيانات.
                يتم حفظ الملف بصيغة SQL ويمكن استخدامه لاستعادة النظام بالكامل.
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleDatabaseBackup} 
            variant="success" 
            leftIcon={<Download size={18}/>}
            isLoading={isDbProcessing} 
            disabled={isDbProcessing}
            className="w-full sm:w-auto"
          >
            تحميل نسخة احتياطية لقاعدة البيانات
          </Button>
        </div>
      </Card>

      {/* استعادة قاعدة البيانات */}
      <Card title="استعادة قاعدة البيانات" titleClassName="flex items-center gap-2 text-lg">
        <Upload size={20} className="text-primary" />
        <div className="p-1 space-y-3">
          <div className="flex items-start p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300">
            <AlertTriangleIcon size={28} className="me-3 flex-shrink-0 text-red-500 dark:text-red-400" />
            <div>
              <strong className="font-semibold">تحذير شديد الأهمية:</strong>
              <p className="text-sm">
                استعادة قاعدة البيانات ستحذف جميع البيانات الحالية (العملاء، المنتجات، الطلبات) وتستبدلها بالبيانات من الملف.
                هذا الإجراء غير قابل للتراجع! تأكد من عمل نسخة احتياطية قبل الاستعادة.
              </p>
            </div>
          </div>
          
          <Input 
            type="file" 
            id="dbBackupFileInput"
            name="dbBackupFile"
            accept=".sql" 
            onChange={handleDbFileChange} 
            className="mb-4"
            label="اختر ملف النسخة الاحتياطية (.sql)"
            wrapperClassName="max-w-md"
          />
          <Button 
            onClick={() => setShowDbRestoreConfirmModal(true)} 
            variant="danger" 
            leftIcon={<Upload size={18}/>} 
            disabled={!dbBackupFile || isDbProcessing} 
            isLoading={isDbProcessing}
            className="w-full sm:w-auto"
          >
            استعادة قاعدة البيانات
          </Button>
        </div>
      </Card>

      {/* رسائل النجاح والأخطاء لإعدادات العميل */}
      {generalError && <Card className="border-red-500/50 bg-red-50 dark:bg-red-900/20"><p className="text-sm text-red-600 dark:text-red-400 p-2 text-center">{generalError}</p></Card>}
      {generalSuccess && <Card className="border-green-500/50 bg-green-50 dark:bg-green-900/20"><p className="text-sm text-green-600 dark:text-green-400 p-2 text-center">{generalSuccess}</p></Card>}

      <Card title="إنشاء نسخة احتياطية (إعدادات العميل)" titleClassName="flex items-center gap-2 text-lg">
        <Download size={20} className="text-primary me-1 hidden sm:inline" />
        <div className="p-1 space-y-3">
            <div className="flex items-start p-3 bg-blue-50 dark:bg-sky-900/30 border border-blue-300 dark:border-sky-700 rounded-lg text-blue-700 dark:text-sky-200 text-sm">
                <Info size={28} className="me-3 flex-shrink-0 text-blue-500 dark:text-sky-400" />
                <div>
                  <strong className="font-semibold">معلومة:</strong>
                  <p>
                    قم بتنزيل ملف JSON يحتوي على إعدادات العميل الحالية (مثل جلسة المستخدم النشطة، وتفضيلات المظهر) المخزنة محلياً في هذا المتصفح. 
                    ننصح بالاحتفاظ بهذا الملف في مكان آمن. هذا النسخ لا يتضمن بيانات التطبيق الرئيسية (كالمنتجات والطلبات) والتي تدار عبر الخادم.
                  </p>
                </div>
            </div>
          
            <Button 
                onClick={handleBackupData} 
                variant="success" 
                leftIcon={<Download size={18}/>}
                isLoading={isProcessing && !backupFile} 
                disabled={isProcessing}
                className="w-full sm:w-auto"
            >
              تنزيل نسخة احتياطية للإعدادات
            </Button>
          </div>
      </Card>

      <Card title="استعادة إعدادات العميل من نسخة احتياطية" titleClassName="flex items-center gap-2 text-lg">
        <Upload size={20} className="text-primary me-1 hidden sm:inline" />
        <div className="p-1 space-y-3">
            <div className="flex items-start p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300">
              <AlertTriangleIcon size={28} className="me-3 flex-shrink-0 text-red-500 dark:text-red-400" />
              <div>
                <strong className="font-semibold">تحذير هام:</strong>
                <p className="text-sm">عملية الاستعادة ستقوم بالكتابة فوق إعدادات العميل الحالية في هذا المتصفح (مثل جلسة المستخدم النشطة وتفضيلات المظهر). لا يمكن التراجع عن هذا الإجراء. تأكد من أنك اخترت الملف الصحيح.</p>
              </div>
            </div>
            
            <Input 
              type="file" 
              id="backupFileInput"
              name="backupFile"
              accept=".json" 
              onChange={handleFileChange} 
              className="mb-4"
              label="اختر ملف النسخة الاحتياطية (.json)"
              wrapperClassName="max-w-md"
            />
            <Button 
                onClick={handleRestoreFromFileClick} 
                variant="danger" 
                leftIcon={<Upload size={18}/>} 
                disabled={!backupFile || isProcessing} 
                isLoading={isProcessing && !!backupFile}
                className="w-full sm:w-auto"
            >
              استعادة الإعدادات من الملف
            </Button>
          </div>
      </Card>

      {/* تأكيد استعادة قاعدة البيانات */}
      {showDbRestoreConfirmModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDbRestoreConfirmModal(false)}
          title="تأكيد استعادة قاعدة البيانات"
          size="md"
          footer={
            <div className="flex justify-end space-s-3">
              <Button variant="secondary" onClick={() => setShowDbRestoreConfirmModal(false)} disabled={isDbProcessing}>
                إلغاء
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDatabaseRestore} 
                isLoading={isDbProcessing} 
                leftIcon={<Upload size={16}/>}
              >
                نعم، استعد قاعدة البيانات
              </Button>
            </div>
          }
        >
          <div className="text-center">
            <AlertTriangleIcon size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">هل أنت متأكد من رغبتك في استعادة قاعدة البيانات؟</p>
            <p className="text-muted-foreground mb-3">
              سيؤدي هذا إلى حذف جميع البيانات الحالية (العملاء، المنتجات، الطلبات، المستخدمين) 
              واستبدالها بالبيانات الموجودة في الملف المحدد.
            </p>
            <p className="font-bold text-red-600 dark:text-red-400 text-lg">
              ⚠️ هذا الإجراء غير قابل للتراجع! ⚠️
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              الملف: {dbBackupFile?.name}
            </p>
          </div>
        </Modal>
      )}

      {/* تأكيد استعادة إعدادات العميل */}
      {showRestoreConfirmModal && (
        <Modal
            isOpen={true}
            onClose={() => setShowRestoreConfirmModal(false)}
            title="تأكيد عملية الاستعادة"
            size="md"
            footer={
                <div className="flex justify-end space-s-3">
                    <Button variant="secondary" onClick={() => setShowRestoreConfirmModal(false)} disabled={isProcessing}>إلغاء</Button>
                    <Button 
                        variant="danger" 
                        onClick={confirmRestore} 
                        isLoading={isProcessing} 
                        leftIcon={<Upload size={16}/>}
                    >
                        نعم، قم بالاستعادة
                    </Button>
                </div>
            }
        >
            <div className="text-center">
              <AlertTriangleIcon size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">هل أنت متأكد من رغبتك في استعادة إعدادات العميل؟</p>
              <p className="text-muted-foreground">
                سيؤدي هذا إلى استبدال إعدادات العميل الحالية (جلسة المستخدم، المظهر) بالبيانات الموجودة في الملف الذي اخترته.
              </p>
              <p className="font-bold text-red-600 dark:text-red-400 mt-3">لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default BackupRestorePage;
