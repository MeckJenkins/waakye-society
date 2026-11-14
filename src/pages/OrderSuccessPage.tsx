import { useSearchParams, Link } from 'react-router-dom';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <section className="py-16 md:py-24 bg-cream min-h-screen flex items-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-leaf/10 text-leaf rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-waakye-dark mb-4">
          Order Placed Successfully!
        </h1>
        
        <p className="text-gray-600 text-lg mb-8">
          Thank you for ordering from Waakye Society. We have received your order and will start preparing it shortly.
        </p>

        {orderId && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Your Order Number</p>
            <p className="text-3xl font-mono font-bold text-pepper">{orderId.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm text-gray-500 mt-4">
              Save this number! You can use it to track your order or inquire about your delivery.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/menu"
            className="px-8 py-3 bg-waakye hover:bg-waakye-dark text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            Order More Food
          </Link>
          <Link
            to={orderId ? `/track-order?id=${encodeURIComponent(orderId)}` : '/track-order'}
            className="px-8 py-3 bg-white hover:bg-gray-50 text-waakye-dark font-semibold rounded-lg shadow-md border border-gray-200 transition-colors"
          >
            Track My Order
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccessPage;