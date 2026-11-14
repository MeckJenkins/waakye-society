import { Link, useLocation } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { useCart } from '@/context/useCart';
import CartDrawer from '@/components/cart/CartDrawer';

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalItems } = useCart();
  const closeCart = useCallback(() => setIsCartOpen(false), []);

 const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Menu', href: '/menu' },
  { name: 'Track Order', href: '/track-order' },
  { name: 'Contact', href: '/contact' },
];

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-heading font-bold text-waakye-dark">
            Waakye<span className="text-pepper">Society</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center space-x-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'text-pepper'
                    : 'text-gray-600 hover:text-waakye-dark'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/menu"
              className="rounded-lg bg-pepper px-5 py-2 font-semibold text-white shadow-md transition-colors hover:bg-pepper-light"
            >
              Order Now
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 p-2 text-waakye-dark transition-colors hover:text-pepper"
            aria-label="Open cart"
            aria-controls="cart-drawer"
            aria-expanded={isCartOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden md:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pepper text-xs font-bold text-white">
                <span className="sr-only">
                  {totalItems} item{totalItems === 1 ? '' : 's'} in cart
                </span>
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-waakye-dark"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? (
              // Close 'X' icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-in fade-in slide-in-from-top-2">
  {navLinks.map((link) => (
    <Link
      key={link.name}
      to={link.href}
      className={`block px-3 py-2 rounded-md font-medium transition-colors ${
        location.pathname === link.href
          ? 'text-pepper bg-pepper/10'
          : 'text-gray-600 hover:text-waakye-dark hover:bg-gray-100'
      }`}
      onClick={() => setIsOpen(false)}
    >
      {link.name}
    </Link>
  ))}
  <Link
    to="/menu"
    className="block text-center mt-2 px-5 py-2 bg-pepper hover:bg-pepper-light text-white font-semibold rounded-lg shadow-md transition-colors"
    onClick={() => setIsOpen(false)}
  >
    Order Now
  </Link>
</div>
        )}
      </nav>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </header>
  );
};

export default Navbar;