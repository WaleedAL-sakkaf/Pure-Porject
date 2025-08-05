/*
=== ملاحظات التخصيص - صفحة إدارة المنتجات ===

الألوان المستخدمة:
- primary: اللون الأساسي للنظام (أزرق افتراضياً) - يظهر في الأزرار الرئيسية والروابط
- secondary: اللون الثانوي (رمادي فاتح) - للأزرار الثانوية مثل "طباعة"
- danger: أحمر - لأزرار الحذف والتحذيرات
- green: أخضر - للحالات الإيجابية والنجاح
- yellow: أصفر - للتحذيرات والتنبيهات
- muted-foreground: رمادي للنصوص الثانوية والأيقونات

الأزرار الرئيسية وأماكنها:
1. "منتج جديد" - Button variant="primary" (خط 325 تقريباً)
2. "طباعة" - Button variant="secondary" (خط 324 تقريباً)
3. "حفظ/إضافة" في النموذج - Button variant="primary" (خط 195 تقريباً)
4. "إلغاء" في النموذج - Button variant="secondary" (خط 194 تقريباً)
5. أزرار الإجراءات في الجدول: تعديل، حذف، عرض

الأيقونات المستخدمة ومعانيها:
- PlusCircle: أيقونة إضافة منتج جديد (أخضر عادة)
- PackageIcon: أيقونة المنتج واسمه
- Tag: أيقونة فئة المنتج
- DollarSign: أيقونة الأسعار (تجزئة وجملة)
- Archive: أيقونة المخزون والكمية
- Info: أيقونة وصف المنتج
- Edit: أيقونة تعديل المنتج (أزرق عادة)
- Trash2: أيقونة حذف المنتج (أحمر)
- Eye: أيقونة عرض تفاصيل المنتج
- Printer: أيقونة طباعة قائمة المنتجات

تخصيص الألوان:
- الأزرار الرئيسية: عدّل في components/ui/Button.tsx
- ألوان الأيقونات: غيّر className مثل "text-muted-foreground" إلى "text-blue-500"
- ألوان الخلفية: عدّل classes مثل "bg-primary" و "bg-secondary"
- الألوان العامة: في tailwind.config.js أو global.css

المتغيرات المهمة للتعديل:
- PRODUCT_CATEGORIES: فئات المنتجات في ملف constants.ts
- formData: بيانات نموذج المنتج
- columns: أعمدة جدول المنتجات وتنسيقها
*/

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, SaleType, TableColumn } from '../types';
import { getProducts, getProductById, addProduct, updateProduct, deleteProduct } from '../services/apiService';
import { printHtml, generateProductsListHtmlForPrint } from '../services/printService';
import useApi from '../hooks/useApi';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import { PlusCircle, Edit, Trash2, Eye, Printer, Package as PackageIcon, Tag, Archive, DollarSign, Info } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { PRODUCT_CATEGORIES } from '../constants';
import { useAuth } from '../contexts/AuthContext';

type ProductsPageProps = {
  mode?: 'list' | 'new' | 'edit';
};

const ProductForm: React.FC<{ product?: Product; onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>; onClose: () => void; isLoading: boolean; }> =
  ({ product, onSave, onClose, isLoading }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(product || {
    name: '',
    category: PRODUCT_CATEGORIES[0],
    price: 0,
    wholesalePrice: undefined, // Make optional fields initially undefined
    stock: 0,
    description: '',
    image: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
        const { id, ...restOfProduct } = product;
        setFormData({
            ...restOfProduct,
            wholesalePrice: restOfProduct.wholesalePrice === null ? undefined : restOfProduct.wholesalePrice, // Handle null from potential backend
        });
        // Set image preview if product has an image
        if (restOfProduct.image) {
          setImagePreview(`http://localhost:4000${restOfProduct.image}`);
        }
    } else {
        setFormData({
            name: '',
            category: PRODUCT_CATEGORIES[0],
            price: 0,
            wholesalePrice: undefined,
            stock: 0,
            description: '',
            image: undefined,
        });
        setImagePreview(null);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: string | number | undefined = value;
    if (type === 'number') {
        val = value === '' ? undefined : parseFloat(value); // Allow empty to be undefined for optional numbers
        if (val !== undefined && isNaN(val as number)) val = 0; // Default to 0 if NaN after parsing
    }
    setFormData(prev => ({ ...prev, [name]: val }));
    setErrors(prev => ({...prev, [name]: ''}));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({...prev, image: 'يجب أن يكون الملف صورة'}));
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({...prev, image: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت'}));
        return;
      }

      setImageFile(file);
      setErrors(prev => ({...prev, image: ''}));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: undefined }));
    // Reset file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "اسم المنتج مطلوب";
    if (!formData.category) newErrors.category = "فئة المنتج مطلوبة";
    if (formData.price === undefined || formData.price < 0) newErrors.price = "سعر التجزئة يجب أن يكون رقمًا موجبًا أو صفرًا";
    if (formData.wholesalePrice !== undefined && formData.wholesalePrice < 0) newErrors.wholesalePrice = "سعر الجملة يجب أن يكون رقمًا موجبًا أو صفرًا";
    if (formData.stock === undefined || formData.stock < 0) newErrors.stock = "المخزون يجب أن يكون رقمًا موجبًا أو صفرًا";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Create FormData for multipart upload
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name || '');
    formDataToSend.append('category', formData.category || '');
    formDataToSend.append('price', formData.price?.toString() || '0');
    if (formData.wholesalePrice !== undefined) {
      formDataToSend.append('wholesalePrice', formData.wholesalePrice.toString());
    }
    formDataToSend.append('stock', formData.stock?.toString() || '0');
    if (formData.description) {
      formDataToSend.append('description', formData.description);
    }
    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    await onSave(formDataToSend as any); // Type assertion needed for FormData
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <Input label="اسم المنتج" name="name" value={formData.name || ''} onChange={handleChange} error={errors.name} required leftIcon={<PackageIcon size={16} className="text-muted-foreground"/>} />
      <Select
        label="فئة المنتج"
        name="category"
        value={formData.category}
        onChange={handleChange}
        options={PRODUCT_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
        error={errors.category}
        required
        leftIcon={<Tag size={16} className="text-muted-foreground"/>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="سعر التجزئة" name="price" type="number" value={formData.price?.toString() || ''} onChange={handleChange} error={errors.price} required min="0" step="0.01" leftIcon={<DollarSign size={16} className="text-muted-foreground"/>} />
        <Input label="سعر الجملة (اختياري)" name="wholesalePrice" type="number" value={formData.wholesalePrice?.toString() || ''} onChange={handleChange} error={errors.wholesalePrice} min="0" step="0.01" leftIcon={<DollarSign size={16} className="text-muted-foreground"/>} />
      </div>
      <Input label="الكمية المتوفرة (المخزون)" name="stock" type="number" value={formData.stock?.toString() || ''} onChange={handleChange} error={errors.stock} required min="0" leftIcon={<Archive size={16} className="text-muted-foreground"/>} />
      
      <Input
        as="textarea"
        label="وصف المنتج (اختياري)"
        name="description"
        rows={3}
        value={formData.description || ''}
        onChange={handleChange}
        className="min-h-[80px]" // Ensure textarea has some default height
        leftIcon={<Info size={16} className="text-muted-foreground mt-2.5 !items-start"/>} // Adjust icon position for textarea
      />

      {/* Image Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">صورة المنتج (اختياري)</label>
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
            <img 
              src={imagePreview} 
              alt="معاينة الصورة" 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* File Input */}
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {errors.image && (
          <p className="text-red-500 text-sm">{errors.image}</p>
        )}
        
        <p className="text-xs text-gray-500">
          الحد الأقصى لحجم الصورة: 5 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF
        </p>
      </div>
      <div className="flex justify-end space-s-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>إلغاء</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {product ? 'حفظ التعديلات' : 'إضافة منتج'}
        </Button>
      </div>
    </form>
  );
};


const ProductsPage: React.FC<ProductsPageProps> = ({ mode: initialMode }) => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { currentUser } = useAuth();

  const [currentMode, setCurrentMode] = useState<'list' | 'new' | 'edit' | 'view'>(initialMode || (productId ? 'edit' : 'list'));
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Product | null>(null);

  const { data: products, isLoading, error, exec: fetchProducts, setData: setProducts } = useApi<Product[], [], Product[]>(getProducts, []);
  const { isLoading: isFetchingDetails, exec: fetchProductDetails } = useApi<Product | undefined, [string], Product | undefined>(getProductById);
  const { isLoading: isSaving, exec: saveProductApi } = useApi<Product, [Product | Omit<Product, 'id'> | FormData], Product>(
    (data) => {
        if (data instanceof FormData) {
            const hasId = data.get('id');
            if (hasId) {
                return updateProduct(data);
            }
            return addProduct(data);
        } else if ((data as Product).id) {
            return updateProduct(data as Product);
        }
        return addProduct(data as Omit<Product, 'id'>);
    }
  );
  const { isLoading: isDeleting, exec: deleteProductApi } = useApi<void, [string], void>(deleteProduct);

  const refreshProducts = useCallback(() => {
    fetchProducts().then(data => {
      if(data) setProducts(data);
    });
  }, [fetchProducts, setProducts]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    if (initialMode) setCurrentMode(initialMode);
    else if (productId) setCurrentMode('edit');
    else setCurrentMode('list');

    if ((initialMode === 'edit' || productId) && productId) {
        fetchProductDetails(productId).then(prod => setSelectedProduct(prod));
    } else {
        setSelectedProduct(undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, productId]);


  const handleAddNew = () => {
    setSelectedProduct(undefined);
    setCurrentMode('new');
    navigate('/products/new');
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setCurrentMode('edit');
    navigate(`/products/edit/${product.id}`);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setCurrentMode('view');
  };

  const handleSaveProduct = async (productData: Product | Omit<Product, 'id'> | FormData) => {
    // For FormData with existing product, add the ID
    if (productData instanceof FormData && selectedProduct) {
      productData.append('id', selectedProduct.id);
    }
    
    await saveProductApi(productData as any);
    refreshProducts();
    handleCloseModal();
  };

  const handleDelete = async (productToDelete: Product) => {
    if (productToDelete) {
        await deleteProductApi(productToDelete.id);
        refreshProducts();
        setShowDeleteConfirm(null);
    }
  };

  const handleCloseModal = () => {
    setCurrentMode('list');
    setSelectedProduct(undefined);
    navigate('/products');
  };

  const handlePrintList = () => {
    if (!currentUser) {
      alert("خطأ: بيانات المستخدم غير متاحة للطباعة.");
      return;
    }
    if (products && products.length > 0) {
      const productsHtml = generateProductsListHtmlForPrint(products, currentUser.companyName, currentUser.phoneNumbers);
      printHtml(productsHtml, "قائمة المنتجات");
    } else {
      alert("لا توجد منتجات لطباعتها.");
    }
  };

  const columns: TableColumn<Product>[] = [
    { 
      key: 'image', 
      header: 'الصورة',
      className: "text-center",
      render: (item) => (
        <div className="flex justify-center">
          {item.image ? (
            <img 
              src={`http://localhost:4000${item.image}`} 
              alt={item.name}
              className="w-12 h-12 object-cover rounded-md border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
              <PackageIcon size={20} className="text-gray-400" />
            </div>
          )}
        </div>
      )
    },
    { key: 'name', header: 'اسم المنتج', className: "font-medium" },
    { key: 'category', header: 'الفئة' },
    { key: 'price', header: 'سعر التجزئة', render: (item) => `${item.price.toLocaleString()} ر.س` },
    { key: 'wholesalePrice', header: 'سعر الجملة', render: (item) => item.wholesalePrice ? `${item.wholesalePrice.toLocaleString()} ر.س` : <span className="text-muted-foreground">-</span> },
    { key: 'stock', header: 'المخزون', className:"text-center" },
    {
      key: 'actions',
      header: 'إجراءات',
      className: "text-center",
      render: (item) => (
        <div className="flex justify-center space-s-1 sm:space-s-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleView(item); }} title="عرض التفاصيل"><Eye size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item); }} title="تعديل"><Edit size={16} /></Button>
          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 hover:bg-red-500/10" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(item); }} title="حذف"><Trash2 size={16} /></Button>
        </div>
      ),
    },
  ];

  if (isLoading && currentMode === 'list' && !products?.length) {
    return <LoadingSpinner text="جاري تحميل المنتجات..." />;
  }

  if (error) {
    return <Card title="خطأ في التحميل" className="border-red-500/50"><p className="text-red-500 dark:text-red-400 p-4 text-center"> {error.message}</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إدارة المنتجات</h1>
        <div className="flex space-s-2 sm:space-s-3 w-full sm:w-auto">
          <Button onClick={handlePrintList} variant="secondary" leftIcon={<Printer size={18}/>} disabled={!currentUser || !products || products.length === 0} className="flex-1 sm:flex-initial">
            طباعة
          </Button>
          <Button onClick={handleAddNew} leftIcon={<PlusCircle size={18} />} className="flex-1 sm:flex-initial">
            منتج جديد
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table columns={columns} data={products || []} isLoading={isLoading} onRowClick={handleView} />
      </Card>

      {(currentMode === 'new' || (currentMode === 'edit' && selectedProduct !== undefined)) && (
        <Modal isOpen={true} onClose={handleCloseModal} title={currentMode === 'new' ? 'إضافة منتج جديد' : 'تعديل المنتج'} size="lg">
          {isFetchingDetails && currentMode === 'edit' ? <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner text="جاري تحميل بيانات المنتج..." /></div> :
          <ProductForm
            product={selectedProduct}
            onSave={handleSaveProduct}
            onClose={handleCloseModal}
            isLoading={isSaving}
          />
          }
        </Modal>
      )}

      {currentMode === 'view' && selectedProduct && (
        <Modal isOpen={true} onClose={handleCloseModal} title={`تفاصيل المنتج`} size="md">
            <div className="space-y-4">
                {/* Product Image */}
                {selectedProduct.image && (
                  <div className="flex justify-center">
                    <img 
                      src={`http://localhost:4000${selectedProduct.image}`} 
                      alt={selectedProduct.name}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                
                <div className="space-y-3 text-sm">
                    <h3 className="text-lg font-semibold text-primary mb-2">{selectedProduct.name}</h3>
                    <p><strong>الفئة:</strong> {selectedProduct.category}</p>
                    <p><strong>سعر التجزئة:</strong> <span className="font-semibold">{selectedProduct.price.toLocaleString()} ر.س</span></p>
                    {selectedProduct.wholesalePrice !== undefined && <p><strong>سعر الجملة:</strong> <span className="font-semibold">{selectedProduct.wholesalePrice.toLocaleString()} ر.س</span></p>}
                    <p><strong>المخزون الحالي:</strong> <span className="font-semibold">{selectedProduct.stock}</span></p>
                    {selectedProduct.description && <p><strong>الوصف:</strong> {selectedProduct.description}</p>}
                </div>
            </div>
            <div className="flex justify-end space-s-3 pt-6 mt-4 border-t border-border">
                <Button variant="secondary" onClick={handleCloseModal}>إغلاق</Button>
                <Button variant="primary" onClick={() => handleEdit(selectedProduct)} leftIcon={<Edit size={16}/>}>تعديل</Button>
            </div>
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
                    <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)} isLoading={isDeleting} leftIcon={<Trash2 size={16}/>}>حذف</Button>
                </div>
            }
        >
            <p className="text-center">هل أنت متأكد أنك تريد حذف المنتج <br/> "<strong>{showDeleteConfirm.name}</strong>"؟ <br/> لا يمكن التراجع عن هذا الإجراء.</p>
        </Modal>
      )}
    </div>
  );
};

export default ProductsPage;