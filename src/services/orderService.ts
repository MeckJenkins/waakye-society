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
  subtotal: number;
  total: number;
  cartItems: CartItem[];
}

export const createOrder = async (orderData: OrderData) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    deliveryNotes,
    deliveryMethod,
    subtotal,
    total,
    cartItems,
  } = orderData;

  // 1. Insert the main order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      delivery_address: deliveryAddress,
      delivery_notes: deliveryNotes || null,
      delivery_method: deliveryMethod,
      subtotal,
      delivery_fee: 0,
      total,
      status: 'pending',
      payment_status: 'pending',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Error creating order:', orderError);
    throw new Error(
      'We could not create your order. Please check your details and try again.',
    );
  }

  // 2. Insert the order items linked to this order
  const itemsToInsert = cartItems.map((item) => ({
    order_id: order.id,
    meal_id: item.mealId, // Note: Ensure your CartContext passes the original meal ID
    meal_name: item.name,
    meal_description: item.description,
    meal_price: item.price,
    quantity: item.quantity,
    special_instructions: item.specialInstructions || null,
    extras: item.extras, // This will be saved as JSONB in Supabase
    line_total: item.total,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    const { error: rollbackError } = await supabase
      .from('orders')
      .delete()
      .eq('id', order.id);

    if (rollbackError) {
      console.error('Failed to remove incomplete order:', rollbackError);
      throw new Error(
        'Your order could not be completed. Please contact us before trying again.',
      );
    }

    throw new Error('We could not save your order items. Please try again.');
  }

  return order.id; // Return the new Order ID
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

const getPhoneSearchCandidates = (phone: string) => {
  const trimmedPhone = phone.trim();
  const digits = trimmedPhone.replace(/\D/g, '');
  const candidates = new Set([trimmedPhone, digits, `+${digits}`]);

  if (digits.startsWith('0')) {
    candidates.add(`233${digits.slice(1)}`);
    candidates.add(`+233${digits.slice(1)}`);
  } else if (digits.startsWith('233')) {
    candidates.add(`0${digits.slice(3)}`);
    candidates.add(`+${digits}`);
  }

  return [...candidates].filter(Boolean);
};

export const getOrdersByPhone = async (phone: string): Promise<TrackedOrder[]> => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new Error('Enter a valid phone number to search for your orders.');
  }

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, created_at, status, total, order_items(id, meal_name, quantity, extras, special_instructions, line_total)',
    )
    .in('customer_phone', getPhoneSearchCandidates(phone))
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by phone:', error);
    throw new Error('Could not search orders right now. Please try again.');
  }

  if (!Array.isArray(data)) {
    throw new Error('Could not read the order search results. Please try again.');
  }

  return data.map(parseTrackedOrder);
};

// Update order with payment details after successful payment
export const updateOrderPayment = async (
  orderId: string,
  paystackReference: string,
  paymentMethod: string
) => {
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      paystack_reference: paystackReference,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
      status: 'confirmed', // Auto-confirm when paid
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating payment:', error);
    throw new Error('Failed to update payment status');
  }
};