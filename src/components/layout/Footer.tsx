const Footer = () => {
  return (
    <footer id="contact" className="bg-waakye-dark text-cream mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-plantain">
              Waakye<span className="text-cream">Society</span>
            </h3>
            <p className="mt-4 text-gray-300 text-sm leading-relaxed">
              Authentic Ghanaian flavors, crafted with passion. Experience the rich taste of traditional Waakye, delivered fresh to your door.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-lg font-semibold text-cream mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#menu" className="text-gray-300 hover:text-plantain transition-colors">Our Menu</a></li>
              <li><a href="#about" className="text-gray-300 hover:text-plantain transition-colors">About Us</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-plantain transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info Column */}
          <div>
            <h4 className="text-lg font-semibold text-cream mb-4">Visit Us</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Accra, Ghana</li>
              <li>+233 (0) 24 123 4567</li>
              <li>hello@waakyesociety.com</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-waakye-light/30 mt-8 pt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Waakye Society. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;