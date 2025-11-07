import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CartItem, Product, CartItemOption } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('access_token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedOptions: CartItemOption[]) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity, selectedOptions) => {
        const basePrice = product.base_price;
        const optionsPrice = selectedOptions.reduce((sum, opt) => sum + opt.option_price, 0);
        const totalPrice = (basePrice + optionsPrice) * quantity;

        set((state) => ({
          items: [
            ...state.items,
            {
              product,
              quantity,
              selected_options: selectedOptions,
              total_price: totalPrice,
            },
          ],
        }));
      },
      removeItem: (index) => {
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        }));
      },
      updateQuantity: (index, quantity) => {
        set((state) => {
          const newItems = [...state.items];
          const item = newItems[index];
          const basePrice = item.product.base_price;
          const optionsPrice = item.selected_options.reduce((sum, opt) => sum + opt.option_price, 0);
          item.quantity = quantity;
          item.total_price = (basePrice + optionsPrice) * quantity;
          return { items: newItems };
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalAmount: () => {
        return get().items.reduce((sum, item) => sum + item.total_price, 0);
      },
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

interface AppState {
  language: 'rus' | 'kaz' | 'eng';
  setLanguage: (lang: 'rus' | 'kaz' | 'eng') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'rus',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'app-storage',
    }
  )
);
