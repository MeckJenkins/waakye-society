const AboutUs = () => {
  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Image Side */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute -top-4 -right-4 w-full h-full bg-plantain/20 rounded-2xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80" 
              alt="Chef preparing authentic Ghanaian food" 
              className="relative rounded-2xl shadow-xl w-full h-[400px] object-cover border-4 border-white"
            />
          </div>

          {/* Text Side */}
          <div className="space-y-6 order-1 lg:order-2 text-center lg:text-left">
            <span className="text-pepper font-semibold tracking-wide uppercase text-sm">
              Our Story
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-waakye-dark leading-tight">
              More Than Just Food. <br /> It's a <span className="text-pepper">Tradition</span>.
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              At Waakye Society, we believe every meal should tell a story. Born from a deep love for Ghanaian culinary heritage, we set out to bring the authentic, comforting taste of home-cooked Waakye to the modern world.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              From the careful selection of local millet and rice to the slow-cooked, rich shito, every ingredient is chosen with passion. We aren't just serving food; we are serving a piece of Ghana in every bowl.
            </p>
            
            <a href="#menu" className="inline-flex items-center gap-2 text-waakye-dark font-semibold hover:text-pepper transition-colors mt-4">
              Discover our menu
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;