# دليل تخصيص الواجهة - نظام إدارة شركة المياه

## 📋 جدول المحتويات
1. [تخصيص الألوان](#تخصيص-الألوان)
2. [تعديل الأزرار](#تعديل-الأزرار)
3. [تخصيص النصوص والخطوط](#تخصيص-النصوص-والخطوط)
4. [تعديل التخطيط العام](#تعديل-التخطيط-العام)
5. [تخصيص المكونات الفردية](#تخصيص-المكونات-الفردية)

---

## 🎨 تخصيص الألوان

### 1. الألوان الأساسية في `tailwind.config.js`
```javascript
// الملف: tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // الألوان الأساسية
        primary: {
          DEFAULT: '#3B82F6',    // اللون الأساسي (أزرق)
          hover: '#2563EB',      // عند التحويم
          light: '#93C5FD',      // فاتح
          dark: '#1E40AF',       // داكن
          text: '#FFFFFF'        // نص على الأزرار الأساسية
        },
        
        // ألوان الخلفية
        background: {
          DEFAULT: '#F8FAFC',    // خلفية فاتحة
          dark: '#0F172A',       // خلفية داكنة
          card: '#FFFFFF',       // خلفية البطاقات
          'card-dark': '#1E293B' // خلفية البطاقات الداكنة
        },
        
        // ألوان النصوص
        foreground: {
          DEFAULT: '#1E293B',    // نص رئيسي فاتح
          dark: '#F8FAFC',       // نص رئيسي داكن
          muted: '#64748B',      // نص خافت
          'muted-dark': '#94A3B8' // نص خافت داكن
        },
        
        // ألوان مخصصة للمياه
        water: {
          blue: '#0EA5E9',       // أزرق مائي
          cyan: '#06B6D4',       // سماوي
          teal: '#14B8A6'        // أخضر مائي
        }
      }
    }
  }
}
```

### 2. تطبيق الألوان في `Layout.tsx`
```typescript
// الملف: components/layout/Layout.tsx
useEffect(() => {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    // الوضع الداكن
    root.style.setProperty('--bg-primary', '#0F172A');      // خلفية رئيسية
    root.style.setProperty('--bg-secondary', '#1E293B');    // خلفية ثانوية
    root.style.setProperty('--text-primary', '#F8FAFC');    // نص رئيسي
    root.style.setProperty('--text-secondary', '#94A3B8');  // نص ثانوي
    root.style.setProperty('--border-color', '#334155');    // لون الحدود
    root.style.setProperty('--accent-color', '#0EA5E9');    // لون مميز
  } else {
    // الوضع الفاتح
    root.style.setProperty('--bg-primary', '#F8FAFC');      // خلفية رئيسية
    root.style.setProperty('--bg-secondary', '#FFFFFF');    // خلفية ثانوية
    root.style.setProperty('--text-primary', '#1E293B');    // نص رئيسي
    root.style.setProperty('--text-secondary', '#64748B');  // نص ثانوي
    root.style.setProperty('--border-color', '#E2E8F0');    // لون الحدود
    root.style.setProperty('--accent-color', '#3B82F6');    // لون مميز
  }
}, [theme]);

// تطبيق الألوان على العنصر الرئيسي
return (
  <div className="flex h-screen" style={{
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  }}>
    {/* المحتوى */}
  </div>
);
```

### 3. ألوان مخصصة في `global.css`
```css
/* الملف: global.css */
:root {
  /* ألوان أساسية */
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-secondary: #64748B;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  
  /* ألوان النظام */
  --color-background: #F8FAFC;
  --color-foreground: #1E293B;
  --color-muted: #64748B;
  --color-border: #E2E8F0;
  
  /* ألوان مياه مخصصة */
  --water-blue: #0EA5E9;
  --water-light: #BAE6FD;
  --water-dark: #0369A1;
}

.dark {
  /* الوضع الداكن */
  --color-background: #0F172A;
  --color-foreground: #F8FAFC;
  --color-muted: #94A3B8;
  --color-border: #334155;
}

/* فئات مخصصة */
.water-gradient {
  background: linear-gradient(135deg, var(--water-blue), var(--water-light));
}

.text-water {
  color: var(--water-blue);
}
```

---

## 🔘 تعديل الأزرار

### 1. أنواع الأزرار في `Button.tsx`
```typescript
// الملف: components/ui/Button.tsx

// إضافة أنواع أزرار جديدة
const variantStyles = {
  // الأزرار الموجودة
  primary: 'bg-primary text-primary-text hover:bg-primary-hover shadow-sm',
  secondary: 'bg-secondary text-secondary-text hover:bg-secondary-hover border',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
  
  // أزرار جديدة مخصصة
  water: 'bg-water-blue text-white hover:bg-water-dark shadow-md',
  gradient: 'water-gradient text-white hover:opacity-90 shadow-lg',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  minimal: 'bg-transparent text-primary hover:bg-primary/10',
  
  // أحجام مخصصة
  xs: 'px-2 py-1 text-xs',
  xl: 'px-8 py-4 text-xl',
};
```

### 2. تخصيص أزرار في الصفحات
```tsx
// مثال في أي صفحة
<Button 
  variant="water"           // نوع الزر
  size="lg"                // الحجم
  className="rounded-full" // تخصيص إضافي
  leftIcon={<Save />}      // أيقونة يسار
  onClick={handleSave}     // الحدث
>
  حفظ البيانات
</Button>

// زر بتدرج لوني
<Button 
  variant="gradient"
  className="transform hover:scale-105 transition-transform"
>
  زر متحرك
</Button>

// زر بإطار
<Button 
  variant="outline"
  className="border-water-blue text-water-blue hover:bg-water-blue"
>
  زر بإطار
</Button>
```

### 3. أزرار مخصصة للنوافذ المنبثقة
```tsx
// في Modal.tsx
<Modal 
  footer={
    <div className="flex justify-end space-x-2 space-x-reverse">
      <Button variant="secondary">إلغاء</Button>
      <Button variant="water">تأكيد</Button>
    </div>
  }
>
  {/* المحتوى */}
</Modal>
```

---

## 📝 تخصيص النصوص والخطوط

### 1. إعداد الخطوط في `tailwind.config.js`
```javascript
// الملف: tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        // خطوط عربية
        'arabic': ['Tajawal', 'Cairo', 'sans-serif'],
        'noto': ['Noto Sans Arabic', 'sans-serif'],
        'amiri': ['Amiri', 'serif'],
        
        // خطوط إنجليزية
        'roboto': ['Roboto', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      
      fontSize: {
        // أحجام خط مخصصة
        'xs-ar': ['0.75rem', { lineHeight: '1.2' }],   // صغير عربي
        'sm-ar': ['0.875rem', { lineHeight: '1.3' }],  // متوسط صغير
        'base-ar': ['1rem', { lineHeight: '1.4' }],    // أساسي
        'lg-ar': ['1.125rem', { lineHeight: '1.5' }],  // كبير
        'xl-ar': ['1.25rem', { lineHeight: '1.6' }],   // كبير جداً
        'title': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
      }
    }
  }
}
```

### 2. تطبيق الخطوط في `Layout.tsx`
```typescript
// الملف: components/layout/Layout.tsx
return (
  <div className="font-arabic text-base-ar" dir="rtl">
    {/* تطبيق الخط العربي على كامل التطبيق */}
    <Sidebar />
    <div className="flex-1">
      <Navbar />
      <main className="font-arabic leading-relaxed">
        {children}
      </main>
    </div>
  </div>
);
```

### 3. تخصيص النصوص في المكونات
```tsx
// العناوين
<h1 className="font-amiri text-2xl font-bold text-water-blue mb-4">
  عنوان رئيسي
</h1>

<h2 className="font-arabic text-xl font-semibold text-foreground mb-3">
  عنوان فرعي
</h2>

// النصوص العادية
<p className="font-arabic text-base text-muted leading-relaxed">
  نص عادي بخط مقروء ومسافة جيدة بين الأسطر
</p>

// نصوص مميزة
<span className="font-inter text-sm text-water-blue font-medium">
  نص مميز باللون المائي
</span>
```

### 4. نصوص تفاعلية
```css
/* في global.css */
.interactive-text {
  @apply transition-colors duration-200 hover:text-primary cursor-pointer;
}

.heading-gradient {
  background: linear-gradient(135deg, var(--water-blue), var(--color-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 🏗️ تعديل التخطيط العام

### 1. تخصيص `Navbar.tsx`
```tsx
// الملف: components/layout/Navbar.tsx
const Navbar = ({ toggleTheme, currentTheme }) => {
  return (
    <nav className="
      bg-gradient-to-r from-water-blue to-primary  // خلفية متدرجة
      text-white                                   // نص أبيض
      shadow-lg                                    // ظل
      border-b border-water-dark                   // حد سفلي
      px-6 py-3                                    // مساحة داخلية
    ">
      {/* شعار مخصص */}
      <div className="flex items-center">
        <Droplets className="text-white mr-2" size={32} />
        <span className="font-amiri text-xl font-bold">
          نظام إدارة المياه النقية
        </span>
      </div>
      
      {/* أزرار التنقل */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Button 
          variant="minimal" 
          className="text-white hover:bg-white/20"
          onClick={toggleTheme}
        >
          {currentTheme === 'light' ? <Moon /> : <Sun />}
        </Button>
      </div>
    </nav>
  );
};
```

### 2. تخصيص `Sidebar.tsx`
```tsx
// الملف: components/layout/Sidebar.tsx
const Sidebar = ({ isOpen, setIsOpen }) => {
  return (
    <aside className="
      bg-gradient-to-b from-background to-background/80  // خلفية متدرجة
      border-r border-water-blue/20                      // حد يميني
      shadow-xl                                          // ظل قوي
      w-64                                               // عرض ثابت
    ">
      {/* رأس الشريط الجانبي */}
      <div className="p-5 border-b border-water-blue/30">
        <div className="flex items-center">
          <div className="bg-water-gradient p-2 rounded-lg mr-3">
            <Droplets className="text-white" size={24} />
          </div>
          <span className="font-arabic text-lg font-bold text-water-blue">
            المياه النقية
          </span>
        </div>
      </div>
      
      {/* عناصر التنقل */}
      <nav className="p-3">
        {navItems.map(item => (
          <NavLink 
            key={item.path}
            to={item.path}
            className="
              flex items-center p-3 mb-2 rounded-lg
              text-foreground hover:bg-water-blue/10
              hover:text-water-blue transition-all duration-200
              font-arabic
            "
          >
            {item.icon}
            <span className="mr-3">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
```

---

## 🎯 تخصيص المكونات الفردية

### 1. تخصيص `Card.tsx`
```tsx
// الملف: components/ui/Card.tsx
const Card = ({ title, children, variant = 'default' }) => {
  const variants = {
    default: 'bg-card border border-border shadow-sm',
    water: 'bg-gradient-to-br from-water-light/20 to-white border border-water-blue/30 shadow-md',
    success: 'bg-gradient-to-br from-green-50 to-white border border-green-200',
    warning: 'bg-gradient-to-br from-yellow-50 to-white border border-yellow-200',
  };
  
  return (
    <div className={`
      rounded-xl overflow-hidden transition-all duration-300
      hover:shadow-lg hover:scale-[1.02]
      ${variants[variant]}
    `}>
      {title && (
        <div className="p-4 border-b border-water-blue/20 bg-water-blue/5">
          <h3 className="font-arabic font-semibold text-water-blue">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6 font-arabic">
        {children}
      </div>
    </div>
  );
};
```

### 2. تخصيص `Input.tsx`
```tsx
// الملف: components/ui/Input.tsx
const Input = ({ label, error, variant = 'default', ...props }) => {
  const variants = {
    default: 'border-border focus:border-primary focus:ring-primary/20',
    water: 'border-water-blue/30 focus:border-water-blue focus:ring-water-blue/20',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500/20',
  };
  
  return (
    <div className="mb-4">
      {label && (
        <label className="block font-arabic text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <input 
        className={`
          w-full px-4 py-3 rounded-lg transition-all duration-200
          bg-background text-foreground font-arabic
          placeholder:text-muted placeholder:font-arabic
          ${variants[variant]}
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 font-arabic">
          {error}
        </p>
      )}
    </div>
  );
};
```

### 3. تخصيص `Table.tsx`
```tsx
// الملف: components/ui/Table.tsx
const Table = ({ columns, data, variant = 'default' }) => {
  const variants = {
    default: 'border-border',
    water: 'border-water-blue/30',
    minimal: 'border-transparent',
  };
  
  return (
    <div className="overflow-hidden rounded-xl shadow-sm border border-border">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-water-blue/10 to-primary/10">
          <tr>
            {columns.map(column => (
              <th className="
                px-6 py-4 text-right font-arabic font-semibold
                text-water-blue border-b border-water-blue/20
              ">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr className={`
              transition-colors duration-150
              hover:bg-water-blue/5
              ${index % 2 === 0 ? 'bg-background' : 'bg-water-blue/2'}
            `}>
              {columns.map(column => (
                <td className="px-6 py-4 font-arabic text-foreground border-b border-border/50">
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 🚀 نصائح للتخصيص السريع

### 1. استخدام متغيرات CSS العامة
```css
/* في global.css */
:root {
  /* ألوان سريعة التبديل */
  --quick-primary: #3B82F6;
  --quick-secondary: #64748B;
  --quick-accent: #0EA5E9;
}

/* تطبيق على جميع الأزرار */
.btn-quick {
  background-color: var(--quick-primary);
  color: white;
  transition: all 0.2s;
}

.btn-quick:hover {
  background-color: var(--quick-accent);
  transform: translateY(-1px);
}
```

### 2. فئات مساعدة سريعة
```css
/* فئات للنصوص */
.text-primary-custom { color: var(--quick-primary); }
.text-accent-custom { color: var(--quick-accent); }

/* فئات للخلفيات */
.bg-primary-custom { background-color: var(--quick-primary); }
.bg-gradient-custom { 
  background: linear-gradient(135deg, var(--quick-primary), var(--quick-accent)); 
}

/* فئات للحدود */
.border-primary-custom { border-color: var(--quick-primary); }
```

### 3. تبديل سريع للسمات
```javascript
// دالة تبديل سريع في Layout.tsx
const quickThemeSwitch = (themeName) => {
  const themes = {
    ocean: {
      primary: '#0EA5E9',
      secondary: '#0369A1',
      accent: '#BAE6FD'
    },
    forest: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#A7F3D0'
    },
    sunset: {
      primary: '#F59E0B',
      secondary: '#D97706',
      accent: '#FED7AA'
    }
  };
  
  const theme = themes[themeName];
  document.documentElement.style.setProperty('--quick-primary', theme.primary);
  document.documentElement.style.setProperty('--quick-secondary', theme.secondary);
  document.documentElement.style.setProperty('--quick-accent', theme.accent);
};
```

---

## ✅ قائمة مرجعية للتخصيص

### قبل البدء:
- [ ] نسخ احتياطي من الملفات الأصلية
- [ ] تحديد الألوان المطلوبة مسبقاً
- [ ] اختبار الألوان على شاشات مختلفة

### أثناء التخصيص:
- [ ] تعديل `tailwind.config.js` للألوان الأساسية
- [ ] تحديث `global.css` للمتغيرات العامة
- [ ] تعديل `Layout.tsx` للسمات
- [ ] تخصيص المكونات الفردية حسب الحاجة
- [ ] اختبار في الوضعين الفاتح والداكن

### بعد التخصيص:
- [ ] فحص جميع الصفحات
- [ ] اختبار على أجهزة مختلفة
- [ ] التأكد من قابلية القراءة
- [ ] توثيق التغييرات المطبقة

---

*هذا الدليل يغطي جميع جوانب تخصيص الواجهة في نظام إدارة شركة المياه. يمكن الرجوع إليه عند الحاجة لأي تعديلات مستقبلية.*