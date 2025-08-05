import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/apiService';
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Search, Package, LogIn, UserPlus } from 'lucide-react';
import { APP_NAME } from '../constants';

const CatalogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const { data: products, isLoading: isLoadingProducts, exec: fetchProducts } = useApi<Product[], [], Product[]>(getProducts, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm.trim()) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleProductClick = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary">{APP_NAME}</h1>
        <p className="text-lg text-muted-foreground mt-2">تصفح منتجاتنا عالية الجودة</p>
      </div>

      <Card 
          title="كتالوج المنتجات" 
          className="shadow-lg" 
          bodyClassName="p-3 sm:p-4"
          actions={
              <Input
                  type="text"
                  placeholder="ابحث بالاسم أو الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={18} className="text-muted-foreground" />}
                  wrapperClassName="mb-0 w-full sm:w-72"
                  className="text-sm"
              />
          }
      >
        {isLoadingProducts && !products?.length ? (
          <div className="flex-grow flex items-center justify-center min-h-[300px]"><LoadingSpinner text="جاري تحميل المنتجات..." /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-1">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={handleProductClick}
                className="group relative border bg-card text-card-foreground rounded-lg p-2 sm:p-3 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              >
                <div className="w-full h-24 sm:h-32 mb-2 flex items-center justify-center overflow-hidden rounded-md bg-gray-50 dark:bg-gray-800">
                  {product.image ? (
                    <img 
                      src={`http://localhost:4000${product.image}`} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                    />
                  ) : null}
                  <Package 
                    size={32} 
                    className={`text-muted-foreground group-hover:text-primary transition-colors ${product.image ? 'hidden' : ''}`}
                  />
                </div>
                
                <div className="flex-1 w-full flex flex-col justify-between">
                  <p className="text-sm sm:text-base font-medium text-foreground truncate w-full leading-tight" title={product.name}>
                    {product.name}
                  </p>
                  <p className="text-base sm:text-lg text-primary font-semibold mt-1">
                    {Number(product.price).toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ر.س
                  </p>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && !isLoadingProducts && <p className="col-span-full text-center text-muted-foreground py-10">لم يتم العثور على منتجات.</p>}
          </div>
        )}
      </Card>

      <Modal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        title="مطلوب تسجيل الدخول"
        size="md"
      >
        <div className="text-center">
            <p className="text-lg text-foreground mb-6">
                الرجاء تسجيل الدخول أو إنشاء حساب جديد لتتمكن من الطلب.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/login')}
                    leftIcon={<LogIn size={18}/>}
                    className="w-full justify-center text-base py-3"
                >
                    تسجيل الدخول
                </Button>
                <Button 
                    variant="secondary" 
                    onClick={() => navigate('/signup')}
                    leftIcon={<UserPlus size={18}/>}
                    className="w-full justify-center text-base py-3"
                >
                    إنشاء حساب جديد
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default CatalogPage; 