import React, { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { Product, Order, OrderStatus, TableColumn, SelectOption } from '../types';
import { getProducts, getOrders } from '../services/apiService';
import { printHtml, generateDetailedProductReportHtmlForPrint } from '../services/printService';
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Printer, Filter, Calendar, Package as PackageIcon, Tag, PackageCheck, PackageX, BarChartBig, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PRODUCT_CATEGORIES } from '../constants';
import { useAuth } from '../contexts/AuthContext'; // Added

const LOW_STOCK_THRESHOLD = 10;

const STOCK_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'الكل' },
  { value: 'available', label: 'متوفر' },
  { value: 'low', label: `كمية قليلة (أقل من ${LOW_STOCK_THRESHOLD})` },
  { value: 'out_of_stock', label: 'نفذ المخزون' },
];

interface ProductReportTableItem extends Product {
  quantitySoldInPeriod: number;
  revenueInPeriod: number;
  stockStatusText: string;
}

const DetailedProductReportPage: React.FC = () => {
  const { currentUser } = useAuth(); // Added
  const { data: allProducts, isLoading: isLoadingProducts, exec: fetchProducts } = useApi<Product[], [], Product[]>(getProducts, []);
  const { data: allOrders, isLoading: isLoadingOrders, exec: fetchOrders } = useApi<Order[], [], Order[]>(getOrders, []);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'جميع الفئات' },
      ...PRODUCT_CATEGORIES.map(cat => ({ value: cat, label: cat }))
    ];
  }, []);

  const filteredOrdersForPeriod = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(order => {
      if (order.status !== OrderStatus.Delivered) return false;
      const orderDate = new Date(order.deliveryDate || order.orderDate);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    });
  }, [allOrders, startDate, endDate]);

  const getStockStatusText = (stock: number): string => {
      if (stock === 0) return 'نفذ المخزون';
      if (stock < LOW_STOCK_THRESHOLD) return 'كمية قليلة';
      return 'متوفر';
  };

  const productsForTable = useMemo((): ProductReportTableItem[] => {
    if (!allProducts) return [];

    return allProducts
      .filter(product => {
        const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
        const stockStatusMatch = selectedStockStatus === 'all' ||
          (selectedStockStatus === 'available' && product.stock >= LOW_STOCK_THRESHOLD) ||
          (selectedStockStatus === 'low' && product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD) ||
          (selectedStockStatus === 'out_of_stock' && product.stock === 0);
        return categoryMatch && stockStatusMatch;
      })
      .map(product => {
        let quantitySoldInPeriod = 0;
        let revenueInPeriod = 0;
        filteredOrdersForPeriod.forEach(order => {
          order.items.forEach(item => {
            if (item.productId === product.id) {
              quantitySoldInPeriod += item.quantity;
              revenueInPeriod += item.totalPrice;
            }
          });
        });
        return {
          ...product,
          quantitySoldInPeriod,
          revenueInPeriod,
          stockStatusText: getStockStatusText(product.stock)
        };
      })
      .sort((a,b) => b.revenueInPeriod - a.revenueInPeriod);
  }, [allProducts, selectedCategory, selectedStockStatus, filteredOrdersForPeriod]);

  const summaryStats = useMemo(() => {
    if (!allProducts) return { totalUniqueProducts: 0, lowStockCount: 0, outOfStockCount: 0, totalInventoryValue: 0 };
    const totalUniqueProducts = allProducts.length;
    const lowStockCount = allProducts.filter(p => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length;
    const outOfStockCount = allProducts.filter(p => p.stock === 0).length;
    const totalInventoryValue = allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
    return { totalUniqueProducts, lowStockCount, outOfStockCount, totalInventoryValue };
  }, [allProducts]);

  const bestSellingProductsChartData = useMemo(() => {
    return productsForTable
      .filter(p => p.quantitySoldInPeriod > 0)
      .sort((a, b) => b.quantitySoldInPeriod - a.quantitySoldInPeriod)
      .slice(0, 5)
      .map(p => ({ name: p.name, "الكمية المباعة": p.quantitySoldInPeriod }));
  }, [productsForTable]);

  const salesByCategoryChartData = useMemo(() => {
    const salesByCat: { [key: string]: number } = {};
    productsForTable.forEach(p => {
      if (p.revenueInPeriod > 0) {
        salesByCat[p.category] = (salesByCat[p.category] || 0) + p.revenueInPeriod;
      }
    });
    return Object.entries(salesByCat).map(([name, value]) => ({ name, value }));
  }, [productsForTable]);

  const columns: TableColumn<ProductReportTableItem>[] = [
    { key: 'name', header: 'اسم المنتج', className: "font-medium" },
    { key: 'category', header: 'الفئة' },
    { key: 'stock', header: 'المخزون الحالي', render: (item) => item.stock, className: 'text-center' },
    { key: 'quantitySoldInPeriod', header: 'الكمية المباعة (فترة)', render: (item) => item.quantitySoldInPeriod, className: 'text-center' },
    { key: 'revenueInPeriod', header: 'الإيرادات (فترة)', render: (item) => `${item.revenueInPeriod.toLocaleString()} ر.س` },
    { key: 'stockStatusText', header: 'حالة المخزون', render: (item) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            item.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
            item.stock < LOW_STOCK_THRESHOLD ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-100' :
            'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100'
        }`}>{item.stockStatusText}</span>
    )},
  ];

  const handlePrintReport = () => {
     if (!currentUser || !allProducts || !allOrders) {
        alert("خطأ: بيانات المستخدم أو البيانات الأساسية غير متاحة للطباعة.");
        return;
    }
    if (productsForTable.length === 0 && selectedCategory === 'all' && selectedStockStatus === 'all') {
      alert("لا توجد منتجات لطباعتها.");
      return;
    }
    const filters = { startDate, endDate, category: selectedCategory, stockStatus: selectedStockStatus };
    const bestSellingSummary = bestSellingProductsChartData.map(p => ({name: p.name, quantity: p['الكمية المباعة']}));
    const salesByCategorySummary = salesByCategoryChartData.map(c => ({name: c.name, revenue: c.value}));

    const reportHtml = generateDetailedProductReportHtmlForPrint(
        productsForTable,
        filters,
        summaryStats,
        bestSellingSummary,
        salesByCategorySummary,
        currentUser.companyName,
        currentUser.phoneNumbers
    ); // Updated call
    printHtml(reportHtml, `تقرير المنتجات (${startDate} - ${endDate})`);
  };

  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartTextColor = isDarkMode ? '#A0AEC0' : '#4A5568';
  const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];


  const anyLoading = (isLoadingProducts && !allProducts?.length) || (isLoadingOrders && !allOrders?.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">تقرير المنتجات المفصل</h2>
        <Button onClick={handlePrintReport} leftIcon={<Printer size={20} />} variant="secondary" disabled={anyLoading || !currentUser}>
          طباعة التقرير
        </Button>
      </div>

      <Card title="تصفية التقرير" titleClassName="flex items-center gap-2">
        <Filter size={20} className="text-blue-600 dark:text-blue-400 inline"/>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input label="من تاريخ (للمبيعات)" type="date" name="startDate" value={startDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} leftIcon={<Calendar size={16} className="text-gray-400" />}/>
          <Input label="إلى تاريخ (للمبيعات)" type="date" name="endDate" value={endDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} leftIcon={<Calendar size={16} className="text-gray-400" />}/>
          <Select label="فئة المنتج" options={categoryOptions} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} leftIcon={<Tag size={16} className="text-gray-400"/>}/>
          <Select label="حالة المخزون" options={STOCK_STATUS_OPTIONS} value={selectedStockStatus} onChange={(e) => setSelectedStockStatus(e.target.value)} leftIcon={<PackageIcon size={16} className="text-gray-400"/>}/>
          <p className="text-xs text-gray-500 dark:text-gray-400 md:col-span-full">
            يتم تحديث التقرير تلقائيًا عند تغيير الفلاتر.
          </p>
        </div>
      </Card>

      {anyLoading ? (
        <LoadingSpinner text="جاري تحميل بيانات المنتجات والطلبات..." />
      ) : (
        <>
          <Card title="ملخص المنتجات العام" titleClassName="flex items-center gap-2">
            <PackageIcon size={20} className="text-blue-600 dark:text-blue-400 inline"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center md:text-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المنتجات الفريدة</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.totalUniqueProducts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">منتجات مخزونها منخفض</p>
                <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{summaryStats.lowStockCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">منتجات نفذ مخزونها</p>
                <p className="text-2xl font-bold text-red-500 dark:text-red-400">{summaryStats.outOfStockCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">القيمة الإجمالية للمخزون</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summaryStats.totalInventoryValue.toLocaleString()} ر.س</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="المنتجات الأكثر مبيعًا (كمية)" titleClassName="flex items-center gap-2">
                <BarChartBig size={20} className="text-blue-600 dark:text-blue-400 inline"/>
                {bestSellingProductsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bestSellingProductsChartData} layout="vertical" margin={{ right: 30, left: 20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#4A5568" : "#E2E8F0"}/>
                    <XAxis type="number" tick={{ fill: chartTextColor }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: chartTextColor, width: 100, fontSize: '10px' }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: isDarkMode ? '#2D3748' : '#FFFFFF', border: isDarkMode ? '1px solid #4A5568': '1px solid #E2E8F0', direction: 'rtl' }}
                        labelStyle={{ color: chartTextColor }}
                        formatter={(value: number) => [value, "الكمية المباعة"]}
                    />
                    <Bar dataKey="الكمية المباعة" fill={isDarkMode ? "#60A5FA" : "#8884d8"} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
                ) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">لا توجد بيانات مبيعات كافية لعرض الرسم البياني.</p>}
            </Card>
            <Card title="المبيعات حسب الفئة (إيرادات)" titleClassName="flex items-center gap-2">
                <PieChartIcon size={20} className="text-blue-600 dark:text-blue-400 inline"/>
                {salesByCategoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie
                        data={salesByCategoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"

                    >
                        {salesByCategoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: isDarkMode ? '#2D3748' : '#FFFFFF', border: isDarkMode ? '1px solid #4A5568': '1px solid #E2E8F0', direction: 'rtl' }}
                        labelStyle={{ color: chartTextColor }}
                        formatter={(value: number, name: string) => [`${value.toLocaleString()} ر.س`, name]}
                    />
                    <Legend wrapperStyle={{ direction: 'rtl', color: chartTextColor, fontSize: '12px' }} />
                    </PieChart>
                </ResponsiveContainer>
                ) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">لا توجد بيانات مبيعات كافية لعرض الرسم البياني.</p>}
            </Card>
          </div>

          <Card title="تفاصيل المنتجات (حسب الفلاتر والفترة المحددة للمبيعات)">
            <Table
              columns={columns}
              data={productsForTable}
              isLoading={anyLoading && productsForTable.length === 0}
              emptyMessage="لا توجد منتجات تطابق الفلاتر المحددة."
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DetailedProductReportPage;