import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CartContext } from './CartContext';
import type { CartItem, CartItemInput } from './CartContext';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: CartItemInput) => {
    const extras = [...item.extras].sort((a, b) => a.id - b.id);
    const specialInstructions = item.specialInstructions.trim();
    const id = JSON.stringify([
      item.mealId,
      extras.map(({ id: extraId, quantity }) => [extraId, quantity]),
      specialInstructions,
    ]);

    setCartItems((previousItems) => {
      const existingItem = previousItems.find((cartItem) => cartItem.id === id);

      if (existingItem) {
        return previousItems.map((cartItem) => {
          if (cartItem.id !== id) {
            return cartItem;
          }

          const quantity = cartItem.quantity + item.quantity;
          const mealSubtotal = cartItem.price * quantity;
          return {
            ...cartItem,
            quantity,
            mealSubtotal,
            total: mealSubtotal + cartItem.extrasSubtotal,
          };
        });
      }

      const mealSubtotal = item.price * item.quantity;
      const extrasSubtotal = item.extras.reduce(
        (total, extra) => total + extra.price * extra.quantity,
        0,
      );

      return [
        ...previousItems,
        {
          ...item,
          extras,
          id,
          specialInstructions,
          mealSubtotal,
          extrasSubtotal,
          total: mealSubtotal + extrasSubtotal,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      return;
    }

    setCartItems((previousItems) =>
      previousItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const mealSubtotal = item.price * quantity;
        return {
          ...item,
          quantity,
          mealSubtotal,
          total: mealSubtotal + item.extrasSubtotal,
        };
      }),
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems((previousItems) => previousItems.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);
  const foodSubtotal = cartItems.reduce((total, item) => total + item.mealSubtotal, 0);
  const extrasTotal = cartItems.reduce((total, item) => total + item.extrasSubtotal, 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.total, 0);
  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      foodSubtotal,
      extrasTotal,
      totalItems,
      totalPrice,
    }),
    [
      addToCart,
      cartItems,
      clearCart,
      extrasTotal,
      foodSubtotal,
      removeFromCart,
      totalItems,
      totalPrice,
      updateQuantity,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};
