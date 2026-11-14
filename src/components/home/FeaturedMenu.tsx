import { useState, useEffect } from 'react';
import FoodCard from '@/components/menu/FoodCard';
import { fetchFeaturedMenuItems } from '@/services/menuService';
import type { MenuItem } from '@/types/database';

const FeaturedMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedMenu = async () => {
      try {
        const items = await fetchFeaturedMenuItems();
        if (isMounted) {
          setMenuItems(items);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load featured menu:', err);
        if (isMounted) {
          setError('Failed to load featured dishes. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadFeaturedMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section id="menu" className="bg-gray-50 py-16 md:py-24" aria-busy="true">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8" role="status">
          <div
            className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-pepper"
            aria-hidden="true"
          />
          <p className="mt-4 text-gray-600">Loading featured dishes...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold text-waakye-dark md:text-4xl">
            Our Signature Dishes
          </h2>
          <p className="text-lg text-gray-600">
            Handcrafted daily using the freshest local ingredients and authentic Ghanaian recipes.
          </p>
        </div>

        {error ? (
          <div className="text-center" role="alert">
            <p className="text-pepper">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-pepper px-6 py-2 font-semibold text-white transition-colors hover:bg-pepper-light"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedMenu;