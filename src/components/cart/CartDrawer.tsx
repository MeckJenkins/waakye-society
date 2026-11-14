import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/useCart';
import { useDialogFocus } from '@/hooks/useDialogFocus';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPrice = (price: number) => `GH₵ ${price.toFixed(2)}`;

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    foodSubtotal,
    extrasTotal,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    onClose();

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, 300);
  }, [onClose]);

  useDialogFocus(isOpen, drawerRef, handleClose);

  useEffect(
    () => () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    },
    [],
  );

  if (!isOpen && !isClosing) {
    return null;
  }

  return createPortal(
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] cursor-default bg-black/50"
          aria-label="Close cart backdrop"
          onClick={handleClose}
        />
      )}

      <div
        ref={drawerRef}
        id="cart-drawer"
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
        aria-labelledby={isOpen ? 'cart-title' : undefined}
        aria-hidden={!isOpen}
        inert={!isOpen}
        tabIndex={-1}
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl ${
          isOpen
            ? 'animate-[cart-drawer-in_300ms_ease-out_both]'
            : 'animate-[cart-drawer-out_300ms_ease-in_both]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-5 sm:p-6">
          <div>
            <h2 id="cart-title" className="font-heading text-2xl font-bold text-waakye-dark">
              Your Cart
            </h2>
            {totalItems > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {totalItems} {totalItems === 1 ? 'meal' : 'meals'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-waakye-dark"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-grow overflow-y-auto p-4 sm:p-6">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-16 w-16 text-waakye-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5m1.6 8-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-semibold text-waakye-dark">Your cart is empty</p>
              <p className="mt-2 text-sm text-gray-500">Add some delicious Waakye to get started.</p>
              <Link
                to="/menu"
                onClick={handleClose}
                className="mt-6 rounded-lg bg-pepper px-5 py-3 font-semibold text-white transition-colors hover:bg-pepper-light"
              >
                Browse our menu
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <article key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-bold text-waakye-dark">{item.name}</h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:text-pepper"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatPrice(item.price)} each
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-semibold" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white transition-colors hover:bg-gray-100"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-gray-200 pt-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Included
                      </p>
                      <p className="mt-1 break-words text-gray-600">
                        {item.includedItems.join(', ')}
                      </p>
                    </div>
                    {item.extras.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Extras
                        </p>
                        <ul className="mt-1 space-y-1 text-gray-600">
                          {item.extras.map((extra) => (
                            <li key={extra.id} className="flex justify-between gap-3">
                              <span>{extra.name} × {extra.quantity}</span>
                              <span className="shrink-0">
                                {formatPrice(extra.price * extra.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.specialInstructions && (
                      <p className="break-words italic text-gray-600">
                        “{item.specialInstructions}”
                      </p>
                    )}
                    <div className="flex justify-between gap-3 pt-1 font-semibold text-waakye-dark">
                      <span>Line total</span>
                      <span>{formatPrice(item.total)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="space-y-3 border-t border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Food subtotal</span>
              <span>{formatPrice(foodSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Extras total</span>
              <span>{formatPrice(extrasTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-waakye-dark">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-xs text-gray-500">Delivery fees calculated at checkout.</p>
            <button
              type="button"
              onClick={() => {
                handleClose();
                navigate('/checkout');
              }}
              className="w-full rounded-lg bg-pepper py-3 font-semibold text-white shadow-md transition-colors hover:bg-pepper-light"
            >
              Proceed to Checkout
            </button>
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/menu"
                onClick={handleClose}
                className="text-sm font-semibold text-waakye-dark hover:text-pepper"
              >
                Continue Shopping
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="text-sm font-medium text-gray-500 hover:text-pepper"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
};

export default CartDrawer;
