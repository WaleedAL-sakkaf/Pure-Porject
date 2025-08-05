/*
=== ملاحظات التخصيص - صفحة تسجيل الدخول ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - لشعار النظام وروابط التسجيل
- background: لون خلفية الصفحة
- card: لون خلفية البطاقة
- foreground: لون النص الرئيسي
- muted-foreground: رمادي للنصوص الثانوية
- red: أحمر لرسائل الخطأ

العناصر الرئيسية:
1. شعار النظام - Droplets مع اسم التطبيق (APP_NAME)
2. بطاقة تسجيل الدخول - Card مع ظل وحدود
3. حقل اسم المستخدم - Input مع أيقونة AtSign
4. حقل كلمة المرور - Input مع أيقونة KeyRound
5. زر تسجيل الدخول - Button variant="primary" مع أيقونة LogIn
6. رابط إنشاء حساب - Link مع أيقونة UserPlus

الأيقونات ومعانيها:
- Droplets: أيقونة شعار شركة المياه (لون أساسي)
- AtSign: أيقونة اسم المستخدم (@)
- KeyRound: أيقونة كلمة المرور (مفتاح دائري)
- LogIn: أيقونة تسجيل الدخول (سهم داخل)
- UserPlus: أيقونة إنشاء حساب جديد (مستخدم + علامة زائد)

ألوان رسائل الخطأ:
- النص: text-red-600 dark:text-red-400
- الخلفية: bg-red-100 dark:bg-red-500/20
- الحدود: حدود حمراء ناعمة

تخصيص المظهر:
- حجم الشعار: size={48} للأيقونة و text-3xl للنص
- ظل البطاقة: shadow-xl dark:shadow-xl-dark
- عرض البطاقة: max-w-md (حد أقصى متوسط)
- المسافات: space-y-6 بين العناصر

العناصر المتجاوبة:
- التخطيط: min-h-screen flex flex-col للشاشة الكاملة
- المحاذاة: items-center justify-center للتوسيط
- الحشو: p-4 للهوامش الخارجية

المتغيرات المهمة:
- APP_NAME: اسم التطبيق من constants.ts
- UserRole: أدوار المستخدمين (Admin, PosAgent)
- isLoadingAuth: حالة التحميل للمصادقة
*/

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { APP_NAME } from '../constants';
import { LogIn, UserPlus, Droplets, AtSign, KeyRound, Package } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { loginUser, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await loginUser(username, password);
      if (user) {
        if (user.role === UserRole.Admin) {
          navigate('/dashboard');
        } else if (user.role === UserRole.PosAgent) {
          navigate('/pos');
        } else {
          navigate('/dashboard'); 
        }
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center mb-8 text-primary">
        <Droplets size={48} />
        <h1 className="text-3xl font-bold ms-3">{APP_NAME}</h1>
      </div>
      <Card 
        title="تسجيل الدخول" 
        className="w-full max-w-md shadow-xl dark:shadow-xl-dark"
        titleClassName="text-xl text-center font-semibold"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="اسم المستخدم"
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
            autoComplete="current-password"
            leftIcon={<KeyRound size={18} className="text-muted-foreground"/>}
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400 text-center bg-red-100 dark:bg-red-500/20 p-2 rounded-md">{error}</p>}
          <Button type="submit" variant="primary" className="w-full !py-2.5 text-base" isLoading={isLoadingAuth} leftIcon={<LogIn size={18}/>}>
            تسجيل الدخول
          </Button>
          <div className="text-center mt-4">
            <Link to="/signup" className="text-sm text-primary hover:text-primary-hover hover:underline flex items-center justify-center">
              <UserPlus size={16} className="me-1" />
              ليس لديك حساب؟ إنشاء حساب جديد
            </Link>
          </div>
          <p className="text-center mt-4">
            <Link to="/catalog" className="text-sm text-primary hover:text-primary-hover hover:underline flex items-center justify-center">
              <Package size={16} className="me-1" />
              أو تصفح المنتجات كزائر
            </Link>
          </p>
        </form>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {APP_NAME}. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
};

export default LoginPage;