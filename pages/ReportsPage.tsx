/*
=== ملاحظات التخصيص - صفحة مركز التقارير ===

الألوان المستخدمة:
- primary: اللون الأساسي (أزرق) - للعناصر العامة
- green: أخضر - لتقرير المبيعات
- blue: أزرق - لتقرير التوصيل  
- purple: بنفسجي - لتقرير العملاء
- sky: أزرق سماوي - لتقرير المنتجات
- yellow: أصفر - لتقرير المدفوعات
- slate: رمادي - لتقرير الفواتير

بطاقات التقارير (ReportCard):
- تصميم متجاوب: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- تأثيرات الحركة: hover:-translate-y-1 و hover:shadow-xl
- حالات التعطيل: opacity-60 cursor-not-allowed

الأيقونات وألوانها:
1. تقرير المبيعات:
   - أيقونة: TrendingUp (اتجاه صاعد)
   - الألوان: bg-green-100 dark:bg-green-500/20
   - لون الأيقونة: text-green-600 dark:text-green-400

2. تقرير التوصيل:
   - أيقونة: Truck (شاحنة)
   - الألوان: bg-blue-100 dark:bg-blue-500/20
   - لون الأيقونة: text-blue-600 dark:text-blue-400

3. تقرير العملاء:
   - أيقونة: Users (مستخدمون)
   - الألوان: bg-purple-100 dark:bg-purple-500/20
   - لون الأيقونة: text-purple-600 dark:text-purple-400

4. تقرير المنتجات:
   - أيقونة: Package (صندوق)
   - الألوان: bg-sky-100 dark:bg-sky-500/20
   - لون الأيقونة: text-sky-600 dark:text-sky-400

5. تقرير المدفوعات:
   - أيقونة: DollarSign (علامة دولار)
   - الألوان: bg-yellow-100 dark:bg-yellow-500/20
   - لون الأيقونة: text-yellow-600 dark:text-yellow-400

6. تقرير الفواتير:
   - أيقونة: FileSpreadsheet (جدول بيانات)
   - الألوان: bg-slate-100 dark:bg-slate-500/20
   - لون الأيقونة: text-slate-600 dark:text-slate-400

تخطيط البطاقة:
- منطقة الأيقونة: p-4 rounded-full mb-4
- العنوان: text-xl font-semibold mb-2
- الوصف: text-sm مع لون مكتوم

تأثيرات التفاعل:
- عند التمرير: تغيير الموقع والظل
- عند التعطيل: تغيير الشفافية واللون
- الانتقال: transition-all duration-300 ease-in-out

تخصيص الألوان:
- ألوان الخلفية: iconBgColor في كل ReportCard
- ألوان الأيقونات: iconColor في كل ReportCard
- ألوان النصوص: text-foreground و text-muted-foreground

المتغيرات المهمة:
- ReportCardProps: خصائص بطاقة التقرير
- navigate: للتنقل بين الصفحات
- disabled: لتعطيل أو تفعيل البطاقات
*/

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { BarChart, FileText, Truck, Users, DollarSign, Package, TrendingUp, LucideProps, FileSpreadsheet } from 'lucide-react'; 

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactElement<LucideProps>; // Changed from React.ReactNode or React.ReactElement
  onClick?: () => void;
  disabled?: boolean;
  iconBgColor?: string;
  iconColor?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({title, description, icon, onClick, disabled, iconBgColor = 'bg-primary-light dark:bg-primary-dark/30', iconColor = 'text-primary'}) => (
    <Card 
      className={`transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl dark:hover:shadow-xl-dark'}`}
      bodyClassName="flex flex-col items-center text-center p-6"
      onClick={disabled ? undefined : onClick}
    >
        <div className={`p-4 rounded-full mb-4 ${iconBgColor} ${iconColor}`}>
            {React.cloneElement(icon, { size: 32 })}
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>{title}</h3>
        <p className={`${disabled ? 'text-muted-foreground/70' : 'text-muted-foreground'} text-sm`}>{description}</p>
    </Card>
);

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">مركز التقارير</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          استعرض تقارير مفصلة حول المبيعات، التوصيل، العملاء، وغيرها لتحليل أداء عملك واتخاذ قرارات مستنيرة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard 
            title="تقرير المبيعات" 
            description="تحليل المبيعات حسب الفترة، المنتج، العميل، إلخ." 
            icon={<TrendingUp />}
            iconBgColor="bg-green-100 dark:bg-green-500/20"
            iconColor="text-green-600 dark:text-green-400"
            onClick={() => navigate('/reports/sales')}
        />
        <ReportCard 
            title="تقرير التوصيل" 
            description="تتبع كفاءة عمليات التوصيل وأداء السائقين." 
            icon={<Truck />}
            iconBgColor="bg-blue-100 dark:bg-blue-500/20"
            iconColor="text-blue-600 dark:text-blue-400"
            onClick={() => navigate('/reports/delivery')}
        />
        <ReportCard 
            title="تقرير العملاء" 
            description="فهم سلوك العملاء وقيمة كل عميل." 
            icon={<Users />}
            iconBgColor="bg-purple-100 dark:bg-purple-500/20"
            iconColor="text-purple-600 dark:text-purple-400"
            onClick={() => navigate('/reports/customers')}
        />
        <ReportCard 
            title="تقرير المنتجات" 
            description="أداء المنتجات، مستويات المخزون، والأكثر مبيعًا." 
            icon={<Package />} 
            iconBgColor="bg-sky-100 dark:bg-sky-500/20"
            iconColor="text-sky-600 dark:text-sky-400"
            onClick={() => navigate('/reports/products')}
        />
         <ReportCard 
            title="تقرير المدفوعات" 
            description="تتبع الإيرادات، المدفوعات المستحقة، وطرق الدفع." 
            icon={<DollarSign />}
            iconBgColor="bg-yellow-100 dark:bg-yellow-500/20"
            iconColor="text-yellow-600 dark:text-yellow-400"
            onClick={() => navigate('/reports/payments')}
        />
         <ReportCard 
            title="تقرير الفواتير" 
            description="نظرة شاملة على جميع الفواتير الصادرة وحالاتها." 
            icon={<FileSpreadsheet />} // Changed icon
            iconBgColor="bg-slate-100 dark:bg-slate-500/20"
            iconColor="text-slate-600 dark:text-slate-400"
            onClick={() => navigate('/reports/invoices')} // Enabled and added onClick
            disabled={false} // Explicitly set to false, or can be removed
        />
      </div>
      
    </div>
  );
};

export default ReportsPage;