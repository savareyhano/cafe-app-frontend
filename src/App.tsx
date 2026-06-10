import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';

// Pages
import LandingPageReference from './LandingPageReference';
import CmsLayout from './layouts/CmsLayout';
import LoginPage from './pages/cms/LoginPage';
import MenuItemsPage from './pages/cms/MenuItemsPage';
import OrdersPage from './pages/cms/OrdersPage';
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
          {/* Keep the landing page as a reference for styling */}
          <Route path="/landing-reference" element={<LandingPageReference />} />

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
          <Route path="*" element={<Navigate to="/cms/menu" replace />} />
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
