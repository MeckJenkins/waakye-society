import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getOrderByTrackingToken,
  getOrderTrackingToken,
} from '@/services/orderService';
import type { TrackedOrder } from '@/services/orderService';

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('id') ?? '');
  const [trackingToken, setTrackingToken] = useState(() =>
    getOrderTrackingToken(searchParams.get('id') ?? '') ?? '',
  );
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      setOrder(await getOrderByTrackingToken(orderId.trim(), trackingToken.trim()));
    } catch (err: unknown) {
      console.error('Secure order lookup failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not retrieve this order. Check the order number and access code.',
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-GH', {
      timeZone: 'Africa/Accra',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

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
    <section className="min-h-screen bg-cream py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="mb-4 font-heading text-3xl font-bold text-waakye-dark md:text-4xl">
            Track Your Order
          </h1>
          <p className="text-gray-600">
            Enter your order number and the private access code shown after checkout.
            A phone number alone cannot access order details.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="tracking-order-id" className="mb-2 block text-sm font-medium text-gray-700">
              Order number
            </label>
            <input
              id="tracking-order-id"
              type="text"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              autoComplete="off"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-pepper"
            />
          </div>
          <div>
            <label htmlFor="tracking-access-code" className="mb-2 block text-sm font-medium text-gray-700">
              Private access code
            </label>
            <input
              id="tracking-access-code"
              type="text"
              value={trackingToken}
              onChange={(event) => setTrackingToken(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono focus:border-transparent focus:ring-2 focus:ring-pepper"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-pepper px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-pepper-light disabled:bg-gray-400"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>

        {error && (
          <div className="mb-6 rounded-lg bg-pepper/10 p-4 text-center text-pepper" role="alert">
            {error}
          </div>
        )}

        {order && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col items-start justify-between gap-2 border-b border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Order number</p>
                <p className="font-mono font-bold text-waakye-dark">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500">Date</p>
                <p className="font-medium text-gray-800">{formatDate(order.created_at)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                {order.status.replaceAll('_', ' ')}
              </span>
            </div>

            <div className="space-y-4 p-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-start justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold text-waakye-dark">
                      {item.quantity}x {item.meal_name}
                    </p>
                    {item.extras.length > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        + {item.extras.map((extra) => `${extra.quantity}x ${extra.name}`).join(', ')}
                      </p>
                    )}
                    {item.special_instructions && (
                      <p className="mt-1 text-xs italic text-pepper">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <p className="font-medium text-gray-800">GH₵ {item.line_total.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-4">
              <span className="font-medium text-gray-600">Total</span>
              <span className="text-xl font-bold text-pepper">GH₵ {order.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrackOrderPage;
