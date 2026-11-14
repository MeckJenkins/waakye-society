import { useRef, useState } from 'react';
import type { MenuItem } from '@/types/database';
import { extras } from '@/data/extrasData';
import type { CartExtra, CartItemInput } from '@/context/CartContext';
import { useDialogFocus } from '@/hooks/useDialogFocus';

interface MealDetailModalProps {
  item: MenuItem;
  onAddToCart: (item: CartItemInput) => void;
  onClose: () => void;
}

const MealDetailModal = ({ item, onAddToCart, onClose }: MealDetailModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [extraQuantities, setExtraQuantities] = useState<Record<number, number>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogFocus(true, dialogRef, onClose);

  const selectedExtras: CartExtra[] = extras.flatMap((extra) => {
    const extraQuantity = extraQuantities[extra.id] ?? 0;
    return extraQuantity > 0 ? [{ ...extra, quantity: extraQuantity }] : [];
  });
  const mealSubtotal = item.price * quantity;
  const extrasSubtotal = selectedExtras.reduce(
    (total, extra) => total + extra.price * extra.quantity,
    0,
  );
  const total = mealSubtotal + extrasSubtotal;

  const setExtraQuantity = (id: number, extraQuantity: number) => {
    setExtraQuantities((current) => ({ ...current, [id]: Math.max(0, extraQuantity) }));
  };

  const handleAddToCart = () => {
    onAddToCart({
      mealId: item.id,
      name: item.name,
      description: item.description,
      includedItems: item.includedItems,
      price: item.price,
      quantity,
      image: item.image,
      extras: selectedExtras,
      specialInstructions: specialInstructions.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="fixed inset-0 bg-black/60"
        aria-label="Close meal details"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-detail-title"
        aria-describedby="meal-detail-description"
        tabIndex={-1}
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="relative h-52 sm:h-64">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-waakye-dark shadow hover:text-pepper"
            aria-label="Close meal details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <div>
            <h2 id="meal-detail-title" className="text-2xl font-heading font-bold text-waakye-dark">
              {item.name}
            </h2>
            <p id="meal-detail-description" className="mt-2 text-gray-600">
              {item.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Included items">
              {item.includedItems.map((includedItem) => (
                <span
                  key={includedItem}
                  className="rounded-full bg-plantain/20 px-3 py-1 text-xs font-medium text-waakye-dark"
                >
                  {includedItem}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-y border-gray-100 py-4">
            <span className="font-semibold text-waakye-dark">Meal quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity === 1}
                className="h-9 w-9 rounded-lg border border-gray-300 text-lg disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease meal quantity"
              >
                −
              </button>
              <span className="min-w-6 text-center font-semibold" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                className="h-9 w-9 rounded-lg border border-gray-300 text-lg"
                aria-label="Increase meal quantity"
              >
                +
              </button>
            </div>
          </div>

          <fieldset>
            <legend className="text-lg font-heading font-bold text-waakye-dark">
              Choose your extras <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </legend>
            <div className="mt-3 space-y-2">
              {extras.map((extra) => {
                const extraQuantity = extraQuantities[extra.id] ?? 0;
                return (
                  <div
                    key={extra.id}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <label className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={extraQuantity > 0}
                        onChange={(event) =>
                          setExtraQuantity(extra.id, event.target.checked ? 1 : 0)
                        }
                        className="h-4 w-4 accent-pepper"
                      />
                      <span className="text-sm font-medium text-gray-700">{extra.name}</span>
                      <span className="text-sm text-gray-500">GH₵ {extra.price.toFixed(2)}</span>
                    </label>
                    {extraQuantity > 0 && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExtraQuantity(extra.id, extraQuantity - 1)}
                          className="h-8 w-8 rounded-md border border-gray-300 bg-white"
                          aria-label={`Decrease ${extra.name} extra quantity`}
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm" aria-live="polite">
                          {extraQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExtraQuantity(extra.id, extraQuantity + 1)}
                          className="h-8 w-8 rounded-md border border-gray-300 bg-white"
                          aria-label={`Increase ${extra.name} extra quantity`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="special-instructions" className="font-semibold text-waakye-dark">
              Special instructions <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </label>
            <textarea
              id="special-instructions"
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Any preferences for preparing your meal?"
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 p-3 text-sm focus:border-pepper focus:outline-none focus:ring-2 focus:ring-pepper/20"
            />
          </div>

          <div className="space-y-2 rounded-xl bg-cream p-4 text-sm">
            <div className="flex justify-between">
              <span>Meal subtotal</span>
              <span>GH₵ {mealSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Extras subtotal</span>
              <span>GH₵ {extrasSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-waakye-light/30 pt-2 text-base font-bold text-waakye-dark">
              <span>Total</span>
              <span>GH₵ {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-lg bg-pepper px-5 py-3 font-semibold text-white transition-colors hover:bg-pepper-light"
          >
            Add to Cart · GH₵ {total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealDetailModal;
