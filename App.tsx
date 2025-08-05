import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage'; // Changed to use @ alias
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import DriversPage from './pages/DriversPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import DetailedSalesReportPage from './pages/DetailedSalesReportPage';
import DetailedDeliveryReportPage from './pages/DetailedDeliveryReportPage';
import DetailedCustomerReportPage from './pages/DetailedCustomerReportPage';
import DetailedProductReportPage from './pages/DetailedProductReportPage';
import DetailedPaymentsReportPage from './pages/DetailedPaymentsReportPage';
import DetailedInvoiceReportPage from '@/pages/DetailedInvoiceReportPage'; // Changed to use @ alias
import PointOfSalePage from './pages/PointOfSalePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import SignupPage from '@/pages/SignupPage'; // Changed to use @ alias
import AccessDeniedPage from './pages/AccessDeniedPage';
import NotificationsPage from './pages/NotificationsPage'; 
import ProfilePage from '@/pages/ProfilePage'; 
import BackupRestorePage from '@/pages/BackupRestorePage'; // Added new page import
import UserManagementPage from '@/pages/UserManagementPage'; // Added user management page import
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types';
import LoadingSpinner from './components/ui/LoadingSpinner';
import CatalogPage from './pages/CatalogPage'; // <-- Import CatalogPage


const AppRoutes: React.FC = () => {
  const { currentUser, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner text="جاري تحميل التطبيق..." />
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/catalog" element={<CatalogPage />} /> {/* <-- Add catalog route */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Routes accessible only when logged in */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={
            currentUser ? (currentUser.role === UserRole.Admin ? <Navigate to="/dashboard" replace /> : <Navigate to="/pos" replace />) : <Navigate to="/catalog" replace />
          } 
        />
        {/* Layout for authenticated users */}
        <Route element={<Layout><Outlet /></Layout>}>
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.Admin]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/new" element={<OrdersPage mode="new" />} />
            <Route path="/orders/edit/:orderId" element={<OrdersPage mode="edit" />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/new" element={<CustomersPage mode="new" />} />
            <Route path="/customers/edit/:customerId" element={<CustomersPage mode="edit" />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductsPage mode="new" />} />
            <Route path="/products/edit/:productId" element={<ProductsPage mode="edit" />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/drivers/new" element={<DriversPage mode="new" />} />
            <Route path="/drivers/edit/:driverId" element={<DriversPage mode="edit" />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/sales" element={<DetailedSalesReportPage />} />
            <Route path="/reports/delivery" element={<DetailedDeliveryReportPage />} />
            <Route path="/reports/customers" element={<DetailedCustomerReportPage />} />
            <Route path="/reports/products" element={<DetailedProductReportPage />} />
            <Route path="/reports/payments" element={<DetailedPaymentsReportPage />} />
            <Route path="/reports/invoices" element={<DetailedInvoiceReportPage />} /> {/* Added route */}
            <Route path="/backup-restore" element={<BackupRestorePage />} /> {/* Added new route */}
            <Route path="/user-management" element={<UserManagementPage />} /> {/* Added user management route */}
          </Route>

          {/* POS Agent Routes (can also be accessed by Admin) - NOW INSIDE LAYOUT */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.PosAgent]} />}>
            <Route path="/pos" element={<PointOfSalePage />} />
          </Route>

          {/* Routes for All Authenticated Users */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      
      {/* Fallback for any other route */}
      <Route 
        path="*" 
        element={
          currentUser ? (
            <Layout><NotFoundPage /></Layout> // If logged in, show NotFoundPage within Layout
          ) : (
            <NotFoundPage /> // If not logged in, show NotFoundPage directly (e.g. for bad public routes)
          )
        } 
      />
    </Routes>
  );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
