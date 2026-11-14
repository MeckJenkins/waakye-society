// Menu item from database
export interface DatabaseMenuItem {
  id: string; // UUID from Supabase
  name: string;
  description: string;
  included_items: string[]; // Array of strings
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}

// Extra item from database
export interface DatabaseExtra {
  id: string; // UUID from Supabase
  name: string;
  price: number;
  is_available: boolean;
  created_at: string;
}

// Frontend menu item (after transformation)
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  includedItems: string[];
  price: number;
  image: string;
}

// Frontend extra (after transformation)
export interface Extra {
  id: string;
  name: string;
  price: number;
}