import { createContext } from 'react';

export interface CartExtra {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItemInput {
  mealId: string;
  name: string;
  description: string;
  includedItems: string[];
  price: number;
  quantity: number;
  image: string;
  extras: CartExtra[];
  specialInstructions: string;
}

export interface CartItem extends CartItemInput {
  id: string;
  mealSubtotal: number;
  extrasSubtotal: number;
  total: number;
}

export interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (item: CartItemInput) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  foodSubtotal: number;
  extrasTotal: number;
  totalItems: number;
  totalPrice: number;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);
