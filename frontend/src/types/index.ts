export type Language = 'rus' | 'kaz';

export type UserRole = 'client' | 'admin';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: UserRole;
  bonus_points: number;
  is_active: boolean;
  created_at: string;
}

export interface Option {
  id: number;
  group_id: number;
  name_rus: string;
  name_kaz: string;
  price: number;
  is_available: boolean;
}

export interface OptionGroup {
  id: number;
  name_rus: string;
  name_kaz: string;
  is_required: boolean;
  is_multiple: boolean;
  options: Option[];
}

export type ProductStatus = 'active' | 'out_of_stock' | 'inactive';

export interface Product {
  id: number;
  category_id: number;
  name_rus: string;
  name_kaz: string;
  description_rus?: string | null;
  description_kaz?: string | null;
  base_price: number;
  image_url?: string | null;
  status: ProductStatus;
  option_groups: OptionGroup[];
}

export interface MenuCategory {
  id: number;
  name_rus: string;
  name_kaz: string;
  order: number;
  is_active: boolean;
  products: Product[];
}

export interface Menu {
  categories: MenuCategory[];
}

export interface CartItemOption {
  option_group_name: string;
  option_name: string;
  option_price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected_options: CartItemOption[];
  total_price: number;
}

export interface Category {
  id: number;
  name_rus: string;
  name_kaz: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

