import { supabase } from '@/lib/supabase';

export const orderStatuses = [
  'pending',
  'confirmed',
  'preparing',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const verifyAdminLogin = async (username: string, password: string) => {
  const { data, error } = await supabase
    .from('admin_credentials')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    console.error('Login error:', error);
    return false;
  }

  return true;
};

// Fetch all orders (for admin view)
export const fetchAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        meal_name,
        quantity,
        extras,
        special_instructions,
        line_total
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }

  return data || [];
};

// Update order status
export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }

  if (!data) {
    throw new Error('Failed to update order status. Check the orders table UPDATE policy in Supabase.');
  }
};

// Fetch all menu items (including unavailable ones)
export const fetchAllMenuItems = async () => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    throw new Error('Failed to fetch menu items');
  }

  return data || [];
};

// Toggle menu item availability
export const toggleMenuItemAvailability = async (itemId: string, isAvailable: boolean) => {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', itemId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error toggling menu item:', error);
    throw new Error('Failed to update menu item');
  }
  if (!data) {
    throw new Error('Failed to update menu item. Check the menu_items UPDATE policy in Supabase.');
  }
};

export const updateMenuItemImage = async (itemId: string, imageUrl: string) => {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ image_url: imageUrl })
    .eq('id', itemId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error updating menu image:', error);
    throw new Error('Image uploaded, but the menu item could not be updated.');
  }
  if (!data) {
    throw new Error('Image uploaded, but no menu item was updated. Check the menu_items UPDATE policy.');
  }
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: allOrders, error } = await supabase
    .from('orders')
    .select('total, created_at, status');

  if (error) {
    console.error('Error fetching stats:', error);
    throw new Error('Failed to fetch statistics');
  }

  const orders = allOrders || [];

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const todayOrders = orders.filter(o => new Date(o.created_at) >= today).length;
  const todayRevenue = orders
    .filter(o => new Date(o.created_at) >= today)
    .reduce((sum, order) => sum + order.total, 0);

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    todayOrders,
    todayRevenue,
  };
};