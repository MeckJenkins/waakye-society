import { useEffect, useState } from 'react';
import FoodCard from '@/components/menu/FoodCard';
import { fetchMenuItems } from '@/services/menuService';
import type { MenuItem } from '@/types/database';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadMenu = async () => {
      try {
        const items = await fetchMenuItems();
        if (isMounted) {
          setMenuItems(items);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
        if (isMounted) {
          setError('Could not load the menu. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadMenu();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <section className="min-h-screen bg-cream py-16" aria-busy="true">
        <div className="mx-auto max-w-7xl px-4 text-center" role="status">
          <div
            className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-pepper"
            aria-hidden="true"
          />
          <p className="mt-4 text-gray-600">Loading our menu...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-cream py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="font-heading text-3xl font-bold text-waakye-dark md:text-4xl">
            Our Menu
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Freshly prepared Ghanaian favorites, made with care.
          </p>
        </div>

        {error ? (
          <div className="text-center" role="alert">
            <p className="text-pepper">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRefreshKey((key) => key + 1);
              }}
              className="mt-4 rounded-lg bg-pepper px-6 py-2 font-semibold text-white transition-colors hover:bg-pepper-light"
            >
              Retry
            </button>
          </div>
        ) : menuItems.length === 0 ? (
          <p className="text-center text-gray-600">No menu items are available right now.</p>
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

export default MenuPage;
