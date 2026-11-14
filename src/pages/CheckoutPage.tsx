import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChangeEvent, FormEvent } from 'react';
import { useCart } from '@/context/useCart';
import { createOrder, updateOrderPayment } from '@/services/orderService';
import { initializePaystackPayment, generatePaystackReference, verifyPayment } from '@/services/paystackService';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, totalPrice, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryNotes: '',
  });

  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to menu if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-heading font-bold text-waakye-dark mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some delicious Waakye before checking out!</p>
        <button
          onClick={() => navigate('/menu')}
          className="px-6 py-3 bg-pepper hover:bg-pepper-light text-white font-semibold rounded-lg transition-colors"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    setError(null);

    // Validate email is provided for Paystack (Paystack requires email)
    if (!formData.customerEmail) {
      setError('Email address is required for payment processing.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the order first (status: pending, payment_status: pending)
      const orderId = await createOrder({
        ...formData,
        deliveryMethod,
        subtotal: totalPrice,
        total: totalPrice,
        cartItems,
      });

      // 2. Generate unique Paystack reference
      const reference = generatePaystackReference();

      // 3. Open Paystack payment popup
      initializePaystackPayment({
        email: formData.customerEmail,
        amount: totalPrice,
        reference,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        onSuccess: async (response) => {
          try {
            // 4. Verify payment on the server (SECURE!)
            await verifyPayment(response.reference);

            // 5. Update order with payment details
            await updateOrderPayment(orderId, response.reference, 'paystack');

            // 6. Clear cart and redirect to success
            clearCart();
            navigate(`/order-success?id=${orderId}`);
          } catch (verifyError: unknown) {
            console.error('Payment verification failed:', verifyError);
            const details =
              verifyError instanceof Error ? ` ${verifyError.message}` : '';
            setError(
              `Payment was made but verification failed.${details} Please contact support with reference: ${response.reference}`,
            );
            setIsSubmitting(false);
          }
        },
        onClose: () => {
          // User closed the payment popup without paying
          setError('Payment was cancelled. Your order is pending. Please try again or contact us.');
          setIsSubmitting(false);
        },
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-cream min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-waakye-dark mb-8 text-center">
          Secure Checkout
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: Customer Details Form */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
            <h2 className="text-xl font-heading font-bold text-waakye-dark border-b pb-2">
              Your Details
            </h2>

            {error && (
              <div className="bg-pepper/10 text-pepper p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Delivery Method Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you like to receive your order?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    deliveryMethod === 'delivery'
                      ? 'border-pepper bg-pepper/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🚴</div>
                  <p className="font-semibold text-waakye-dark">Delivery</p>
                  <p className="text-xs text-gray-500">We'll bring it to you</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    deliveryMethod === 'pickup'
                      ? 'border-pepper bg-pepper/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🏪</div>
                  <p className="font-semibold text-waakye-dark">Pickup</p>
                  <p className="text-xs text-gray-500">Collect from us</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  required
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pepper focus:border-transparent"
                  placeholder="Kwame Asante"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  required
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pepper focus:border-transparent"
                  placeholder="024 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address * <span className="text-xs text-gray-500">(required for payment)</span>
              </label>
              <input
                required
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pepper focus:border-transparent"
                placeholder="kwame@example.com"
              />
            </div>

            {deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                <textarea
                  required
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pepper focus:border-transparent resize-none"
                  placeholder="House number, Street name, Landmark, City"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Delivery fee will be negotiated with the rider.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
              <textarea
                name="deliveryNotes"
                value={formData.deliveryNotes}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pepper focus:border-transparent resize-none"
                placeholder="e.g., Call when you arrive, extra shito please"
              />
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm h-fit">
            <h2 className="text-xl font-heading font-bold text-waakye-dark border-b pb-2 mb-4">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-semibold text-waakye-dark">
                      {item.quantity}x {item.name}
                    </span>
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-gray-500 text-xs mt-1">
                        + {item.extras.map(e => `${e.quantity}x ${e.name}`).join(', ')}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-pepper text-xs italic mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <span className="font-medium text-gray-800">
                    GH₵ {item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>GH₵ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Order Method</span>
                <span className="font-medium">
                  {deliveryMethod === 'delivery' ? '🚴 Delivery' : '🏪 Pickup'}
                </span>
              </div>
              {deliveryMethod === 'delivery' && (
                <p className="text-xs text-gray-500 italic">
                  * Delivery fee negotiated with rider
                </p>
              )}
              <div className="flex justify-between text-xl font-bold text-waakye-dark pt-2 border-t">
                <span>Total</span>
                <span>GH₵ {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-3.5 bg-pepper hover:bg-pepper-light disabled:bg-gray-400 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  💳 Pay GH₵ {totalPrice.toFixed(2)} with Paystack
                </>
              )}
            </button>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secured by Paystack. We accept MoMo & Cards.</span>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CheckoutPage;