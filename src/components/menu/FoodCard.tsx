import { useCallback, useState } from 'react';
import { useCart } from '@/context/useCart';
import type { MenuItem } from '@/types/database';
import MealDetailModal from './MealDetailModal';

interface FoodCardProps {
  item: MenuItem;
}

const FoodCard = ({ item }: FoodCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { addToCart } = useCart();
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const descriptionIsLong = item.description.length > 120;
  const description =
    descriptionIsLong && !isDescriptionExpanded
      ? `${item.description.slice(0, 120).trimEnd()}…`
      : item.description;

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
        <div className="relative h-48 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3 rounded-full bg-cream/90 px-3 py-1 shadow-md backdrop-blur-sm">
            <span className="text-sm font-bold text-waakye-dark">
              GH₵ {item.price.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-grow flex-col p-5">
          <h3 className="mb-2 font-heading text-xl font-bold text-waakye-dark">
            {item.name}
          </h3>
          <p className="text-sm leading-relaxed text-gray-600">{description}</p>
          {descriptionIsLong && (
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
              className="mt-1 self-start text-sm font-semibold text-pepper hover:underline"
              aria-expanded={isDescriptionExpanded}
            >
              {isDescriptionExpanded ? 'Read less' : 'Read more'}
            </button>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Included items">
            {item.includedItems.map((includedItem) => (
              <span
                key={includedItem}
                className="rounded-full bg-plantain/20 px-2.5 py-1 text-xs text-waakye-dark"
              >
                {includedItem}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 w-full rounded-lg bg-waakye py-2.5 font-semibold text-white transition-colors duration-200 hover:bg-waakye-dark"
          >
            Add to Cart
          </button>
        </div>
      </article>

      {isModalOpen && (
        <MealDetailModal
          item={item}
          onAddToCart={addToCart}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default FoodCard;
