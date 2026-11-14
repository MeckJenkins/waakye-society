import { supabase } from '@/lib/supabase';
import type { DatabaseMenuItem, DatabaseExtra, MenuItem, Extra } from '@/types/database';

// Fetch all available menu items
export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    throw new Error('Failed to fetch menu items');
  }

  // Transform database format to frontend format
  return (data as DatabaseMenuItem[]).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    includedItems: item.included_items,
    price: item.price,
    image: item.image_url || 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
  }));
};

// Fetch all available extras
export const fetchExtras = async (): Promise<Extra[]> => {
  const { data, error } = await supabase
    .from('extras')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching extras:', error);
    throw new Error('Failed to fetch extras');
  }

  // Transform database format to frontend format
  return (data as DatabaseExtra[]).map((extra) => ({
    id: extra.id,
    name: extra.name,
    price: extra.price,
  }));
};

// Fetch featured menu items (first 3)
export const fetchFeaturedMenuItems = async (): Promise<MenuItem[]> => {
  const allItems = await fetchMenuItems();
  return allItems.slice(0, 3);
};


// Fetch all orders for a specific phone number, including their items
export const getOrdersByPhone = async (phoneNumber: string) => {
  // Clean the phone number (remove spaces, dashes) for consistent matching
  const cleanPhone = phoneNumber.replace(/\s+/g, '');

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        meal_name,
        quantity,
        extras,
        special_instructions,
        line_total
      )
    `)
    .eq('customer_phone', cleanPhone)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders. Please check the phone number and try again.');
  }

  return data || [];
};


// Upload an image to Supabase Storage and return the public URL
export const uploadMenuImage = async (file: File, itemId: string) => {
  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const filePath = `${itemId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  // Upload the file
  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error(
      'Could not upload image. Check that the menu-images storage bucket exists and allows admin uploads.',
    );
  }

  // Get the public URL
  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};