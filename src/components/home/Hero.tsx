const Hero = () => {
  return (
    <section className="relative bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-plantain/20 text-waakye-dark rounded-full text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-plantain opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-plantain"></span>
              </span>
              Now Delivering in Accra!
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-waakye-dark leading-tight">
              The Ultimate <br />
              <span className="text-pepper">Waakye</span> Experience
            </h1>
            
            <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
              Authentic Ghanaian flavors, crafted with passion. Experience the rich taste of traditional Waakye, served with fresh shito, spaghetti, and your favorite proteins.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#menu" className="px-8 py-3 bg-pepper hover:bg-pepper-light text-white font-semibold rounded-lg shadow-lg transition-colors duration-300 text-center">
                View Menu
              </a>
              <a href="#about" className="px-8 py-3 bg-white hover:bg-gray-50 text-waakye-dark font-semibold rounded-lg shadow-md border border-gray-200 transition-colors duration-300 text-center">
                Our Story
              </a>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-72 h-72 bg-plantain/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-pepper/20 rounded-full blur-3xl"></div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80" 
                alt="Delicious Waakye" 
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;