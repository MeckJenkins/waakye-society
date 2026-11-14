import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  fetchAllOrders,
  orderStatuses,
  updateOrderStatus,
  type OrderStatus,
} from '@/services/adminService';

interface OrderItem {
  id: string;
  meal_name: string;
  quantity: number;
  extras: OrderExtra[] | null;
  special_instructions: string | null;
  line_total: number;
}

interface OrderExtra {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

type DeliveryMethod = 'delivery' | 'pickup';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method?: DeliveryMethod | null;
  delivery_address: string;
  delivery_notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  order_items: OrderItem[];
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const data = await fetchAllOrders();
        if (isMounted) {
          setOrders(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
        if (isMounted) {
          setError('Could not load orders. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadOrders();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    setError(null);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err instanceof Error ? err.message : 'Could not update the order status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const refreshOrders = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((key) => key + 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GH', {
      timeZone: 'Africa/Accra',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-plantain/20 text-waakye-dark';
      case 'delivered': return 'bg-leaf/10 text-leaf';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pepper"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-waakye-dark">
              Orders
            </h1>
            <p className="text-gray-600 mt-2">Manage and track all customer orders</p>
          </div>
          <button
            type="button"
            onClick={refreshOrders}
            disabled={loading}
            className="px-4 py-2 bg-waakye hover:bg-waakye-dark text-white font-semibold rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-pepper/10 p-4 text-pepper" role="alert">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', ...orderStatuses] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              type="button"
              aria-pressed={filter === status}
              className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-pepper text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status} ({status === 'all' ? orders.length : orders.filter(o => o.status === status).length})
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-mono font-bold text-waakye-dark">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const newStatus = orderStatuses.find(
                            (status) => status === e.target.value,
                          );
                          if (newStatus) {
                            void handleStatusChange(order.id, newStatus);
                          }
                        }}
                        disabled={updatingOrderId === order.id}
                        aria-label={`Update status for order ${order.id.slice(0, 8)}`}
                        aria-busy={updatingOrderId === order.id}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pepper"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 border-b border-gray-100 bg-cream/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Customer</p>
                      <p className="font-semibold text-waakye-dark">{order.customer_name}</p>
                      <p className="text-gray-600">{order.customer_phone}</p>
                      {order.customer_email && <p className="text-gray-600 text-xs">{order.customer_email}</p>}
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Delivery Method</p>
                      <p className="text-gray-800 capitalize">{order.delivery_method ?? 'delivery'}</p>
                      {(order.delivery_method ?? 'delivery') === 'delivery' && (
                        <>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mt-3 mb-1">Delivery Address</p>
                          <p className="text-gray-800">{order.delivery_address}</p>
                        </>
                      )}
                      {order.delivery_notes && (
                        <p className="text-pepper text-xs mt-1 italic">
                          {order.delivery_method === 'pickup' ? 'Pickup note' : 'Note'}: {order.delivery_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Total</p>
                      <p className="text-2xl font-bold text-pepper">GH₵ {order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Order Items</p>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <p className="font-semibold text-waakye-dark">
                            {item.quantity}x {item.meal_name}
                          </p>
                          {item.extras && item.extras.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              + {item.extras.map((extra) => `${extra.quantity}x ${extra.name}`).join(', ')}
                            </p>
                          )}
                          {item.special_instructions && (
                            <p className="text-xs text-pepper italic mt-1">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <p className="font-medium text-gray-800">
                          GH₵ {item.line_total.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;