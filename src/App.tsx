import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';

// Pages
import CmsLayout from './layouts/CmsLayout';
import PublicLayout from './layouts/PublicLayout';
import LoginPage from './pages/cms/LoginPage';
import MenuItemsPage from './pages/cms/MenuItemsPage';
import OrdersPage from './pages/cms/OrdersPage';
import MenuPage from './pages/public/MenuPage';
import OrderTrackingPage from './pages/public/OrderTrackingPage';
import PaymentSuccessPage from './pages/public/PaymentSuccessPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<MenuPage />} />
            <Route path="track" element={<OrderTrackingPage />} />
            <Route path="payment-success" element={<PaymentSuccessPage />} />
          </Route>

          {/* CMS Routes */}
          <Route path="/cms/login" element={<LoginPage />} />

          <Route path="/cms" element={<ProtectedRoute />}>
            <Route element={<CmsLayout />}>
              <Route index element={<Navigate to="/cms/menu" replace />} />
              <Route path="menu" element={<MenuItemsPage />} />
              <Route path="orders" element={<OrdersPage />} />
            </Route>
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-center"
        duration={3000}
        toastOptions={{
          className: 'bg-forest text-beige border-wood font-mono text-xs tracking-widest',
        }}
        expand={true}
      />
    </QueryClientProvider>
  );
}
