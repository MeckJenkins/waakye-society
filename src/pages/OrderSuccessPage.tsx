import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '@/context/useCart';
import { getOrderTrackingToken } from '@/services/orderService';
import { verifyPayment } from '@/services/paystackService';

type PaymentState = 'checking' | 'paid' | 'pending' | 'error';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');
  const [trackingToken] = useState(() =>
    orderId ? getOrderTrackingToken(orderId) : null,
  );
  const [paymentState, setPaymentState] = useState<PaymentState>('checking');
  const [copied, setCopied] = useState(false);
  const { clearCart } = useCart();

  useEffect(() => {
    let isMounted = true;

    const confirmPayment = async () => {
      if (!orderId || !reference || !trackingToken) {
        setPaymentState('pending');
        return;
      }

      setPaymentState('checking');
      try {
        const result = await verifyPayment(orderId, reference, trackingToken);
        if (isMounted) {
          setPaymentState(result.paid ? 'paid' : 'pending');
          if (result.paid) {
            clearCart();
          }
        }
      } catch {
        if (isMounted) {
          setPaymentState('error');
        }
      }
    };

    void confirmPayment();
    return () => {
      isMounted = false;
    };
  }, [clearCart, orderId, reference, trackingToken]);

  const copyTrackingToken = async () => {
    if (!trackingToken) return;
    try {
      await navigator.clipboard.writeText(trackingToken);
      setCopied(true);
    } catch (error) {
      console.error('Could not copy the order access code:', error);
      setCopied(false);
    }
  };

  const heading = {
    checking: 'Verifying Your Payment',
    paid: 'Order Placed Successfully!',
    pending: 'Your Order Is Being Processed',
    error: 'Payment Not Confirmed Yet',
  }[paymentState];

  const description = {
    checking: 'Please wait while Paystack confirms your transaction securely.',
    paid: 'Your payment has been verified. We have received your order.',
    pending: 'Your order is saved. Payment has not yet been confirmed; you can check its status using your private access code.',
    error: 'We could not confirm the payment right now. Your order details remain available using the private access code.',
  }[paymentState];

  return (
    <section className="flex min-h-screen items-center bg-cream py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-leaf/10 text-leaf">
          {paymentState === 'checking' ? (
            <span className="h-10 w-10 animate-spin rounded-full border-b-2 border-leaf" aria-hidden="true" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <h1 className="mb-4 font-heading text-3xl font-bold text-waakye-dark md:text-4xl">
          {heading}
        </h1>
        <p className="mb-8 text-lg text-gray-600">{description}</p>

        {orderId && (
          <div className="mb-8 space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Your Order Number
              </p>
              <p className="font-mono text-2xl font-bold text-pepper">
                {orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            {trackingToken ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-waakye-dark">
                  Private Order Access Code
                </p>
                <p className="break-all rounded-lg bg-cream p-3 font-mono text-sm text-waakye-dark">
                  {trackingToken}
                </p>
                <button
                  type="button"
                  onClick={() => void copyTrackingToken()}
                  className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-waakye-dark hover:bg-gray-50"
                >
                  {copied ? 'Copied' : 'Copy access code'}
                </button>
                <p className="mt-3 text-sm text-gray-500">
                  Save this code with your order number. A phone number alone cannot access order details.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                The private access code is not available in this browser session.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/menu"
            className="rounded-lg bg-waakye px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-waakye-dark"
          >
            Order More Food
          </Link>
          <Link
            to={orderId ? `/track-order?id=${encodeURIComponent(orderId)}` : '/track-order'}
            className="rounded-lg border border-gray-200 bg-white px-8 py-3 font-semibold text-waakye-dark shadow-md transition-colors hover:bg-gray-50"
          >
            Track My Order
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccessPage;
