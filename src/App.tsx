import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Outlet, Route, Routes } from 'react-router-dom';
import { CartProvider } from '@/context/CartProvider';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import MenuPage from '@/pages/MenuPage';
import ContactPage from '@/pages/ContactPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderSuccessPage from '@/pages/OrderSuccessPage';
import TrackOrderPage from '@/pages/TrackOrderPage';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminMenu from '@/pages/admin/AdminMenu';

const isMissingMenuTable = (error: { code: string; message: string }) =>
  error.code === '42P01' ||
  error.code === 'PGRST205' ||
  /relation .*menu_items.* does not exist|could not find the table .*menu_items/i.test(
    error.message,
  );

function App() {
  const connectionCheckStarted = useRef(false);

  useEffect(() => {
    if (connectionCheckStarted.current) {
      return;
    }

    connectionCheckStarted.current = true;

    const testConnection = async () => {
      try {
        const { error } = await supabase.from('menu_items').select('*').limit(0);

        if (error && isMissingMenuTable(error)) {
          console.log('✅ Supabase connected successfully!');
          console.log('✅ Tables not created yet (expected at this stage)');
          return;
        }

        if (error) {
          console.error('❌ Supabase connection failed:', error);
          return;
        }

        console.log('✅ Supabase connected successfully!');
      } catch (error) {
        console.error('❌ Supabase connection failed:', error);
      }
    };

    void testConnection();
  }, []);

  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/menu" element={<ProtectedRoute><AdminMenu /></ProtectedRoute>} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;