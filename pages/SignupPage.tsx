
/*
=== ملاحظات التخصيص - صفحة إنشاء حساب جديد ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - للشعار والروابط والأزرار الرئيسية
- red: أحمر - لرسائل الخطأ وأزرار الحذف
- green: أخضر - لرسائل النجاح
- muted-foreground: رمادي للأيقونات والنصوص الثانوية

العناصر الرئيسية:
1. شعار النظام - Droplets مع اسم التطبيق
2. بطاقة التسجيل - Card مع ظل قوي
3. حقل اسم الشركة - Input مع أيقونة Briefcase
4. حقول أرقام الهواتف - متعددة مع إمكانية الإضافة والحذف
5. حقل اسم المستخدم - Input مع أيقونة AtSign
6. حقلي كلمة المرور - Input مع أيقونة KeyRound
7. حقل نوع الحساب - Select مع أيقونة Users
8. زر إنشاء الحساب - Button variant="primary"

الأيقونات ومعانيها:
- Droplets: شعار شركة المياه (أزرق أساسي)
- Briefcase: أيقونة الشركة/المؤسسة (رمادي)
- Phone: أيقونة أرقام الهواتف (رمادي)
- PlusCircle: إضافة رقم هاتف جديد (أزرق رابط)
- XCircle: إزالة رقم هاتف (أحمر)
- AtSign: أيقونة اسم المستخدم (@)
- KeyRound: أيقونة كلمة المرور (مفتاح دائري)
- Users: أيقونة نوع الحساب/الدور
- UserPlus: أيقونة إنشاء الحساب (مستخدم + علامة زائد)
- LogIn: أيقونة رابط تسجيل الدخول

إدارة أرقام الهواتف:
- مصفوفة ديناميكية: phoneNumbers array
- حد أقصى 4 أرقام: phoneNumbers.length < 4
- حد أدنى رقم واحد: phoneNumbers.length > 1 للحذف
- تخطيط مرن: flex items-center gap-2

ألوان الرسائل:
- رسائل الخطأ:
  * النص: text-red-600 dark:text-red-400
  * الخلفية: bg-red-100 dark:bg-red-500/20
- رسائل النجاح:
  * النص: text-green-600 dark:text-green-400
  * الخلفية: bg-green-100 dark:bg-green-500/20

ألوان أزرار إدارة الهواتف:
- زر الإضافة: variant="link" size="sm" (أزرق رابط)
- زر الحذف: variant="ghost" size="icon" مع:
  * text-red-500 hover:bg-red-500/10
  * خلفية حمراء شفافة عند التمرير

التخطيط والمسافات:
- عرض البطاقة: max-w-lg (عريض قليلاً من تسجيل الدخول)
- المسافات بين العناصر: space-y-5
- ظل قوي: shadow-xl dark:shadow-xl-dark

التحقق من صحة البيانات:
- تطابق كلمات المرور
- طول كلمة المرور (6 أحرف كحد أدنى)
- صيغة أرقام الهواتف (05xxxxxxxx أو أرضية)
- وجود رقم هاتف واحد على الأقل

المتغيرات المهمة:
- UserRole: أدوار المستخدمين (Admin, PosAgent)
- ROLE_OPTIONS: خيارات الأدوار من constants.ts
- phoneNumbers: مصفوفة أرقام الهواتف
*/

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { APP_NAME, ROLE_OPTIONS } from '../constants';
import { UserPlus, LogIn, PlusCircle, XCircle, Phone, Briefcase, AtSign, KeyRound, Users, Droplets } from 'lucide-react';

const SignupPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PosAgent); 
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']); 
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signupUser, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const handlePhoneNumberChange = (index: number, value: string) => {
    const newPhoneNumbers = [...phoneNumbers];
    newPhoneNumbers[index] = value;
    setPhoneNumbers(newPhoneNumbers);
  };

  const addPhoneNumberField = () => {
    if (phoneNumbers.length < 4) {
      setPhoneNumbers([...phoneNumbers, '']);
    }
  };

  const removePhoneNumberField = (index: number) => {
    if (phoneNumbers.length > 1) {
      const newPhoneNumbers = phoneNumbers.filter((_, i) => i !== index);
      setPhoneNumbers(newPhoneNumbers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    if (password.length < 6) {
      setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }
    const activePhoneNumbers = phoneNumbers.map(p => p.trim()).filter(p => p !== '');
    if (activePhoneNumbers.length === 0) {
      setError('يجب إدخال رقم هاتف واحد على الأقل.');
      return;
    }
    // Accept any non-empty phone number - no format validation needed
    if (!companyName.trim()) {
        setError('اسم الشركة مطلوب.');
        return;
    }
     if (!username.trim()) {
        setError('اسم المستخدم مطلوب.');
        return;
    }
    if (username.trim().length < 3) {
        setError('يجب أن يكون اسم المستخدم 3 أحرف على الأقل.');
        return;
    }


    try {
      const response = await signupUser(username, password, companyName, activePhoneNumbers, role); 
      if (response) {
        setSuccessMessage('🎉 تم إنشاء طلب حسابك بنجاح!\n\n⏳ حسابك الآن في انتظار مراجعة المدير\n\n📧 ستتلقى إشعاراً عند الموافقة على حسابك\n\nيرجى الانتظار وعدم إنشاء حساب آخر');
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError('فشل إنشاء الحساب. قد يكون اسم المستخدم موجودًا بالفعل.');
      }
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center mb-6 text-primary">
        <Droplets size={40} />
        <h1 className="text-3xl font-bold ms-3">{APP_NAME}</h1>
      </div>
      <Card 
        title="إنشاء حساب جديد" 
        className="w-full max-w-lg shadow-xl dark:shadow-xl-dark"
        titleClassName="text-xl text-center font-semibold"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-red-600 dark:text-red-400 text-center bg-red-100 dark:bg-red-500/20 p-4 rounded-md mb-4 border border-red-300 dark:border-red-500/30">
              <div className="text-lg font-bold mb-1">خطأ في التسجيل</div>
              <p className="text-md">{error}</p>
            </div>
          )}
          {successMessage && <p className="text-sm text-green-600 dark:text-green-400 text-center bg-green-100 dark:bg-green-500/20 p-2.5 rounded-md">{successMessage}</p>}
          
          <Input
            label="اسم الشركة/المؤسسة"
            name="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            leftIcon={<Briefcase size={18} className="text-muted-foreground"/>}
          />

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              أرقام الهواتف (مطلوب واحد على الأقل - أي رقم مقبول):
            </label>
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <Input
                  name={`phoneNumber-${index}`}
                  type="tel"
                  placeholder={`رقم الهاتف ${index + 1}`}
                  value={phone}
                  onChange={(e) => handlePhoneNumberChange(index, e.target.value)}
                  leftIcon={<Phone size={18} className="text-muted-foreground"/>}
                  wrapperClassName="flex-grow mb-0"
                  aria-label={`رقم الهاتف ${index+1}`}
                />
                {phoneNumbers.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePhoneNumberField(index)} className="text-red-500 hover:bg-red-500/10 p-2" aria-label="إزالة رقم الهاتف">
                    <XCircle size={20} />
                  </Button>
                )}
              </div>
            ))}
            {phoneNumbers.length < 4 && (
              <Button type="button" variant="link" size="sm" onClick={addPhoneNumberField} leftIcon={<PlusCircle size={16}/>} className="text-primary dark:text-primary-light p-0">
                إضافة رقم هاتف آخر
              </Button>
            )}
          </div>

          <Input
            label="اسم المستخدم (للدخول)"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            leftIcon={<AtSign size={18} className="text-muted-foreground"/>}
          />
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            leftIcon={<KeyRound size={18} className="text-muted-foreground"/>}
          />
          <Input
            label="تأكيد كلمة المرور"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            leftIcon={<KeyRound size={18} className="text-muted-foreground"/>}
          />
          <Select
            label="نوع الحساب (الدور)"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={ROLE_OPTIONS}
            required
            leftIcon={<Users size={18} className="text-muted-foreground"/>}
          />
          <Button type="submit" variant="primary" className="w-full !py-2.5 text-base" isLoading={isLoadingAuth} leftIcon={<UserPlus size={18}/>}>
            إنشاء الحساب
          </Button>
          <div className="text-center mt-3">
            <Link to="/login" className="text-sm text-primary hover:text-primary-hover hover:underline flex items-center justify-center">
              <LogIn size={16} className="me-1" />
              لديك حساب بالفعل؟ تسجيل الدخول
            </Link>
          </div>
        </form>
      </Card>
      <footer className="mt-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {APP_NAME}. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
};

export default SignupPage;
