import { useState } from 'react';
import type { FormEvent } from 'react';
import { getOrdersByPhone } from '@/services/orderService';
import type { TrackedOrder } from '@/services/orderService';

const TrackOrderPage = () => {
  const [phoneInput, setPhoneInput] = useState('');
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setOrders([]);
    setHasSearched(true);

    try {
      const fetchedOrders = await getOrdersByPhone(phoneInput);
      setOrders(fetchedOrders);
      
      if (fetchedOrders.length === 0) {
        setError('No orders found for this phone number. Please check and try again.');
      }
    } catch (err: unknown) {
      console.error('Failed to search orders:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not search orders right now. Please try again.',
      );
    } finally {
      setLoading(false);
    }
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

  return (
    <section className="py-12 md:py-16 bg-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-waakye-dark mb-4">
            Track Your Order
          </h1>
          <p className="text-gray-600">
            Enter the phone number you used during checkout to view your order history.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              id="tracking-phone"
              type="tel"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="e.g., 0241234567"
              autoComplete="tel"
              aria-label="Phone number used at checkout"
              aria-describedby={error ? 'tracking-error' : undefined}
              className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pepper focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-pepper hover:bg-pepper-light disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" aria-hidden="true" />
                  Searching...
                </>
              ) : (
                'Track Order'
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div id="tracking-error" className="mb-6 rounded-lg bg-pepper/10 p-4 text-center text-pepper" role="alert">
            {error}
          </div>
        )}

        {/* Orders List */}
        {hasSearched && !loading && orders.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-waakye-dark">
              Found {orders.length} Order{orders.length > 1 ? 's' : ''}
            </h2>
            
            {orders.map((order) => (
              <div key={order.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {/* Order Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
                    <p className="font-mono font-bold text-waakye-dark">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                    <p className="font-medium text-gray-800">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                    {order.status.replaceAll('_', ' ')}
                  </span>
                </div>

                {/* Order Items */}
                <div className="p-4 space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
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

                {/* Order Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Paid</span>
                  <span className="text-xl font-bold text-pepper">GH₵ {order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrackOrderPage;