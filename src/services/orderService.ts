import { supabase } from '@/lib/supabase';
import type { CartItem } from '@/context/CartContext';

export interface TrackedOrderExtra {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface TrackedOrderItem {
  id: string;
  meal_name: string;
  quantity: number;
  extras: TrackedOrderExtra[];
  special_instructions: string | null;
  line_total: number;
}

export interface TrackedOrder {
  id: string;
  created_at: string;
  status: string;
  total: number;
  order_items: TrackedOrderItem[];
}

export type DeliveryMethod = 'delivery' | 'pickup';

interface OrderData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryNotes: string;
  deliveryMethod: DeliveryMethod;
  cartItems: CartItem[];
}

export interface CreatedOrder {
  orderId: string;
  total: number;
  trackingToken: string;
}

export const trackingTokenStorageKey = (orderId: string) =>
  `waakye.order-access.${orderId}`;

export const ensureTrackingTokenStorageAvailable = () => {
  const key = 'waakye.order-access.storage-check';
  try {
    sessionStorage.setItem(key, '1');
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Order tracking requires session storage:', error);
    throw new Error('Enable browser session storage before placing your order.', {
      cause: error,
    });
  }
};

export const saveOrderTrackingToken = (orderId: string, token: string) => {
  try {
    sessionStorage.setItem(trackingTokenStorageKey(orderId), token);
  } catch (error) {
    console.error('Could not save the order tracking code in this browser:', error);
    throw new Error('Allow session storage to be used so you can securely track your order.', {
      cause: error,
    });
  }
};

export const getOrderTrackingToken = (orderId: string) => {
  try {
    return sessionStorage.getItem(trackingTokenStorageKey(orderId));
  } catch (error) {
    console.error('Could not read the order tracking code from this browser:', error);
    return null;
  }
};

export const createOrder = async (orderData: OrderData): Promise<CreatedOrder> => {
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      deliveryAddress: orderData.deliveryAddress,
      deliveryNotes: orderData.deliveryNotes,
      deliveryMethod: orderData.deliveryMethod,
      items: orderData.cartItems.map((item) => ({
        mealId: item.mealId,
        quantity: item.quantity,
        extras: item.extras.map(({ name, quantity }) => ({ name, quantity })),
        specialInstructions: item.specialInstructions,
      })),
    },
  });

  if (
    error ||
    !isRecord(data) ||
    typeof data.orderId !== 'string' ||
    typeof data.total !== 'number' ||
    typeof data.trackingToken !== 'string'
  ) {
    console.error('Trusted order creation failed:', error);
    throw new Error(
      'We could not create your order. Please check your details and try again.',
    );
  }

  return {
    orderId: data.orderId,
    total: data.total,
    trackingToken: data.trackingToken,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getRequiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`The order response is missing a valid ${field}.`);
  }

  return value;
};

const getFiniteNumber = (value: unknown, field: string): number => {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`The order response is missing a valid ${field}.`);
  }

  return number;
};

const parseOrderExtra = (value: unknown): TrackedOrderExtra => {
  if (!isRecord(value)) {
    throw new Error('The order response contains an invalid extra.');
  }

  return {
    id: getFiniteNumber(value.id, 'extra ID'),
    name: getRequiredString(value.name, 'extra name'),
    price: getFiniteNumber(value.price, 'extra price'),
    quantity: getFiniteNumber(value.quantity, 'extra quantity'),
  };
};

const parseOrderItem = (value: unknown): TrackedOrderItem => {
  if (!isRecord(value) || (value.extras !== null && !Array.isArray(value.extras))) {
    throw new Error('The order response contains an invalid order item.');
  }

  const specialInstructions = value.special_instructions;
  if (specialInstructions !== null && typeof specialInstructions !== 'string') {
    throw new Error('The order response contains invalid special instructions.');
  }

  return {
    id: getRequiredString(value.id, 'order item ID'),
    meal_name: getRequiredString(value.meal_name, 'meal name'),
    quantity: getFiniteNumber(value.quantity, 'meal quantity'),
    extras: Array.isArray(value.extras) ? value.extras.map(parseOrderExtra) : [],
    special_instructions: specialInstructions,
    line_total: getFiniteNumber(value.line_total, 'line total'),
  };
};

const parseTrackedOrder = (value: unknown): TrackedOrder => {
  if (!isRecord(value) || !Array.isArray(value.order_items)) {
    throw new Error('The order response contains an invalid order.');
  }

  return {
    id: getRequiredString(value.id, 'order ID'),
    created_at: getRequiredString(value.created_at, 'order date'),
    status: getRequiredString(value.status, 'order status'),
    total: getFiniteNumber(value.total, 'order total'),
    order_items: value.order_items.map(parseOrderItem),
  };
};

export const getOrderByTrackingToken = async (
  orderId: string,
  trackingToken: string,
): Promise<TrackedOrder> => {
  const { data, error } = await supabase.functions.invoke('get-order', {
    body: { orderId, trackingToken },
  });
  if (error) {
    console.error('Secure order lookup failed:', error);
    throw new Error('Could not find that order. Check the order number and access code.');
  }

  if (!isRecord(data) || !isRecord(data.order)) {
    throw new Error('Could not read the order details. Please try again.');
  }

  return parseTrackedOrder(data.order);
};